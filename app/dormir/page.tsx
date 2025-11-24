'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURACIÓN ---
declare const google: any;
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Clave para pruebas
const MIN_QUALITY_SCORE = 3.75; 

// --- INTERFACES ---
// 🆕 AÑADIDO: Campo 'coordinates' para guardar lat/lng exactos
interface DailyPlan { 
  day: number; 
  date: string; 
  from: string; 
  to: string; 
  distance: number; 
  isDriving: boolean;
  coordinates?: { lat: number, lng: number }; 
}

interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; 
  displayRating: string; 
  type: string;
}

interface TripResult { totalDays: number | null; distanceKm: number | null; totalCost: number | null; dailyItinerary: DailyPlan[] | null; error: string | null; }

// --- 1. COMPONENTE VISUAL: LA TARJETA ---
const SpotCard = ({ spot, rank, isFallback = false }: { spot: SpotData, rank: number, isFallback?: boolean }) => {
  const medals = ["🥇", "🥈", "🥉"];
  
  const borderColors = isFallback 
    ? ["border-blue-300"] 
    : ["border-yellow-500", "border-gray-400", "border-orange-400"];
  
  const borderColor = borderColors[rank] || (isFallback ? "border-blue-300" : "border-gray-200");
  const medal = isFallback ? "🔍" : (medals[rank] || `#${rank + 1}`);
  
  let badgeColor = "bg-gray-500";
  if (spot.rating >= 4.5) badgeColor = "bg-green-600";
  else if (spot.rating >= 4) badgeColor = "bg-green-500";
  else if (spot.rating >= 3) badgeColor = "bg-yellow-500";

  return (
    <a 
      href={spot.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 group h-full no-underline relative`}
    >
      <div className={`relative h-40 ${isFallback ? 'bg-blue-50' : 'bg-gray-200'}`}>
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
              {isFallback ? '🌍' : '🌲'}
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md font-bold shadow text-sm backdrop-blur-sm">
           {medal}
        </div>

        {!isFallback && spot.rating > 0 && (
            <div className={`absolute bottom-2 right-2 ${badgeColor} text-white text-xs font-bold px-2 py-1 rounded shadow`}>
               ⭐ {spot.displayRating}
            </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase backdrop-blur-sm">
            {spot.type}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow bg-white">
        <h3 className={`font-bold text-sm leading-snug mb-2 line-clamp-2 transition-colors ${isFallback ? 'text-blue-700' : 'text-gray-900 group-hover:text-orange-600'}`}>
            {spot.title}
        </h3>
        
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-grow">
            {spot.snippet}
        </p>
        
        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-end items-center">
             <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isFallback ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 bg-blue-50 group-hover:bg-blue-100'}`}>
                {/* 🛑 CAMBIO: Texto actualizado */}
                {isFallback ? 'Buscar en Park4Night ➜' : 'Ver Ficha ➜'}
             </span>
        </div>
      </div>
    </a>
  );
};

// --- 2. LÓGICA: CEREBRO DEL BUSCADOR ---
const TopSpotsList = ({ city, coordinates }: { city: string, coordinates?: {lat: number, lng: number} }) => {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 0. PREPARAR URL DE RESPALDO CON COORDENADAS EXACTAS
        // Si recibimos coordenadas del cálculo de ruta, las usamos directamente.
        // Esto es mucho más preciso y evita errores de búsqueda.
        let fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}`;
        
        if (coordinates) {
            // 🛑 CAMBIO CLAVE: Construimos la URL con lat/lng/z
            fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}&lat=${coordinates.lat}&lng=${coordinates.lng}&z=14`;
        } else if (typeof google !== 'undefined' && google.maps) {
             // Plan B: Si por lo que sea no llegan, geocodificamos (pero esto ya no debería hacer falta casi nunca)
             const geocoder = new google.maps.Geocoder();
             try {
                 const geoRes = await geocoder.geocode({ address: city });
                 if (geoRes.results && geoRes.results[0]) {
                     const loc = geoRes.results[0].geometry.location;
                     fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}&lat=${loc.lat()}&lng=${loc.lng()}&z=14`;
                 }
             } catch (e) {}
        }

        const createFallbackSpot = (): SpotData[] => [{
            title: `Ver mapa de sitios en ${city}`,
            link: fallbackUrl, 
            snippet: `Explora todas las opciones disponibles en ${city} directamente en el mapa interactivo de Park4Night.`,
            image: null, rating: 0, displayRating: "", type: "Búsqueda Manual"
        }];

        // 1. BÚSQUEDA EN GOOGLE CSE
        const query = `site:park4night.com "${city}"`; 
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.items || json.items.length === 0) {
             setSpots(createFallbackSpot());
             return;
        }

        // 2. PROCESADO
        const processedSpots: SpotData[] = json.items.map((item: any) => {
            let ratingValue = 0;
            const textToAnalyze = (item.snippet || "") + " " + (item.title || "");
            
            const ratingMatch = textToAnalyze.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
            if (ratingMatch) {
                ratingValue = parseFloat(ratingMatch[1].replace(',', '.'));
            } else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
                ratingValue = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
            }

            let type = "Spot";
            const lowerText = textToAnalyze.toLowerCase();
            if (lowerText.includes("área") || lowerText.includes("area")) type = "Área AC";
            else if (lowerText.includes("parking") || lowerText.includes("aparcamiento")) type = "Parking";
            else if (lowerText.includes("camping")) type = "Camping";
            else if (lowerText.includes("nature") || lowerText.includes("naturaleza")) type = "Naturaleza";

            const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
            const title = (item.title || "").replace(/ - park4night/i, '').replace(/ - Caramaps/i, '').replace(/\(\d+\)/, '').trim();
            
            // Forzar enlace español
            let link = item.link || "";
            link = link.replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

            return { title, link, snippet: (item.snippet || "").replace(/(\d[\.,]\d+\/5)/g, ''), image: img, rating: ratingValue, displayRating: ratingValue > 0 ? ratingValue.toFixed(1) : "?", type };
        });

        // 3. FILTRADO
        const uniqueSpots = processedSpots.filter((v,i,a)=>a.findIndex(t=>(t.link === v.link))===i);
        const highQualitySpots = uniqueSpots.filter(spot => spot.rating >= MIN_QUALITY_SCORE);
        let finalSpots = highQualitySpots.sort((a, b) => b.rating - a.rating);

        if (finalSpots.length === 0) {
            setSpots(createFallbackSpot());
        } else {
            setSpots(finalSpots.slice(0, 3));
        }

      } catch (e: any) {
        console.error(e);
        // Fallback seguro
        setSpots([{
            title: `Buscar ${city} en Park4Night`,
            link: `https://park4night.com/es/search?q=${encodeURIComponent(city)}`,
            snippet: "Error de conexión. Pulsa para buscar manualmente.",
            image: null, rating: 0, displayRating: "", type: "Búsqueda Manual"
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city, coordinates]);

  if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-white rounded-xl border p-4 animate-pulse flex flex-col gap-3">
                  <div className="w-full h-40 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="mt-8 w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <h3 className="font-extrabold text-2xl text-gray-800">Recomendaciones</h3>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spots.map((spot, index) => (
                <SpotCard key={index} spot={spot} rank={index} isFallback={spot.type === "Búsqueda Manual"} />
            ))}
        </div>
    </div>
  );
};

// --- 3. PÁGINA PRINCIPAL DEL LABORATORIO ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');
  
  // Estado para coordenadas manuales (simulando el cálculo de ruta)
  const [coords, setCoords] = useState<{lat: number, lng: number} | undefined>(undefined);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
    
    // SIMULACIÓN: Al buscar, geocodificamos para pasar coordenadas "reales" al componente
    if (typeof google !== 'undefined' && google.maps) {
         const geocoder = new google.maps.Geocoder();
         try {
             const res = await geocoder.geocode({ address: inputCity });
             if (res.results[0]) {
                 const loc = res.results[0].geometry.location;
                 setCoords({ lat: loc.lat(), lng: loc.lng() });
             }
         } catch(e) {}
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4 font-sans text-gray-900">
        <div className="w-full max-w-6xl flex flex-col items-center">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">
                    CaraCola 🐌 Lab
                </h1>
                <p className="text-gray-500 text-lg">Enlace GPS Preciso + Filtro Calidad</p>
            </div>

            <div className="bg-white p-3 pl-6 rounded-full shadow-xl border border-gray-200 w-full max-w-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-100 transform hover:scale-105 duration-300">
                <span className="text-2xl">🔎</span>
                <input 
                    type="text" 
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    className="flex-1 py-4 bg-transparent outline-none text-xl text-gray-800 placeholder-gray-400 font-medium"
                    placeholder="Ciudad..."
                />
                <button 
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95"
                >
                    Buscar
                </button>
            </div>

            <TopSpotsList city={searchCity} coordinates={coords} />
        </div>
    </div>
  );
}
