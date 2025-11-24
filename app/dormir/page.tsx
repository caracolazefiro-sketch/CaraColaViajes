'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
declare const google: any;
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0";
const MIN_QUALITY_SCORE = 3.75; 

// --- INTERFACES ---
interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; 
  displayRating: string; 
  type: string; 
}

// --- COMPONENTE VISUAL (TARJETA) ---
const SpotCard = ({ spot, rank }: { spot: SpotData, rank: number }) => {
  const medals = ["🥇", "🥈", "🥉"];
  const borderColors = ["border-yellow-500", "border-gray-400", "border-orange-400"];
  const medal = medals[rank] || `#${rank + 1}`;
  const borderColor = borderColors[rank] || "border-gray-200";
  
  const badgeColor = spot.rating >= 4.5 ? "bg-green-600" : (spot.rating >= 4 ? "bg-green-500" : "bg-yellow-500");

  return (
    <a 
      href={spot.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group h-full no-underline relative`}
    >
      <div className="relative h-40 bg-gray-200">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
              <span className="text-4xl">🌲</span>
              <span className="text-[10px] mt-2 uppercase font-bold">Sin Foto</span>
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-lg px-2 py-1 rounded-lg shadow-sm border border-gray-200 z-10">
           {medal}
        </div>

        {spot.rating > 0 && (
            <div className={`absolute bottom-2 right-2 ${badgeColor} text-white text-sm font-extrabold px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-10 border border-white/20`}>
               ⭐ {spot.displayRating}
            </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase backdrop-blur-sm">
            {spot.type}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow bg-white">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {spot.title}
        </h3>
        
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-grow border-l-2 border-gray-100 pl-2">
            {spot.snippet.replace(/(\d[\.,]\d+\/5)/g, '')} 
        </p>
        
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-auto">
             <span className="text-[10px] text-gray-400 font-mono">park4night.com</span>
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full group-hover:bg-blue-100 transition-colors">
                Ver Ficha ➜
             </span>
        </div>
      </div>
    </a>
  );
};

// --- LOGICA: MULTI-PAGE FETCH (LA CLAVE) ---
const TopSpotsList = ({ city }: { city: string }) => {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0); // Para mostrar cuántos hemos analizado

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setScannedCount(0);

      try {
        const query = `site:park4night.com "${city}"`; 
        
        // 🚀 ESTRATEGIA "DEEP SEARCH": Pedimos 3 páginas de golpe (30 resultados)
        // start=1 (1-10), start=11 (11-20), start=21 (21-30)
        const promises = [1, 11, 21].map(start => 
            fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10&start=${start}`)
            .then(res => res.json())
        );

        const results = await Promise.all(promises);
        
        // Unificamos todos los resultados en un solo array gigante
        let allItems: any[] = [];
        results.forEach(json => {
            if (json.items) allItems = [...allItems, ...json.items];
        });

        setScannedCount(allItems.length);

        if (allItems.length === 0) {
             setError("No se encontraron lugares.");
             return;
        }

        // --- PROCESAMIENTO (IGUAL QUE ANTES PERO CON MÁS DATOS) ---
        const processedSpots: SpotData[] = allItems.map((item: any) => {
            let ratingValue = 0;
            const textToAnalyze = (item.snippet || "") + " " + (item.title || "");
            
            const ratingMatch = textToAnalyze.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
            if (ratingMatch) {
                ratingValue = parseFloat(ratingMatch[1].replace(',', '.'));
            } else {
                const starMatch = textToAnalyze.match(/(\d[\.,]\d) (stars|estrellas)/i);
                if (starMatch) ratingValue = parseFloat(starMatch[1].replace(',', '.'));
                else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
                    ratingValue = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
                }
            }

            let type = "Spot";
            const lowerText = textToAnalyze.toLowerCase();
            if (lowerText.includes("área") || lowerText.includes("area")) type = "Área AC";
            else if (lowerText.includes("parking") || lowerText.includes("aparcamiento")) type = "Parking";
            else if (lowerText.includes("picnic") || lowerText.includes("nature") || lowerText.includes("naturaleza")) type = "Naturaleza";
            else if (lowerText.includes("camping")) type = "Camping";
            else if (lowerText.includes("farm") || lowerText.includes("granja")) type = "Granja";

            const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
            const title = (item.title || "").replace(/ - park4night/i, '').replace(/ - Caramaps/i, '').replace(/\(\d+\)/, '').trim();

            return {
                title,
                link: item.link,
                snippet: item.snippet || "",
                image: img,
                rating: ratingValue,
                displayRating: ratingValue > 0 ? ratingValue.toFixed(1) : "?",
                type
            };
        });

        // --- FILTRADO Y RANKING ---
        const uniqueSpots = processedSpots.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
        
        // 1. Filtro de Calidad Estricto
        const highQualitySpots = uniqueSpots.filter(spot => spot.rating >= MIN_QUALITY_SCORE);

        // 2. Ordenar por nota
        let finalSpots = highQualitySpots.sort((a, b) => b.rating - a.rating);

        // 3. Fallback: Si no hay de alta calidad, rellenar con lo mejor que tengamos que tenga foto
        if (finalSpots.length < 3) {
            const others = uniqueSpots
                .filter(s => s.rating < MIN_QUALITY_SCORE && s.image) // Tienen foto pero nota baja/desconocida
                .filter(s => !finalSpots.includes(s)); // No están ya en la lista
            
            finalSpots = [...finalSpots, ...others];
        }

        setSpots(finalSpots.slice(0, 3));

      } catch (e: any) {
        console.error(e);
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-white rounded-xl border p-4 animate-pulse flex flex-col gap-4">
                  <div className="w-full h-40 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
          ))}
          <div className="col-span-full text-center text-gray-400 text-sm animate-pulse">
              Escaneando 30 resultados en busca de 5 estrellas...
          </div>
      </div>
  );

  return (
    <div className="mt-8 w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <h3 className="font-extrabold text-2xl text-gray-800">Top 3 Hallazgos</h3>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
                Seleccionados entre {scannedCount} resultados analizados
            </p>
            {error && <span className="bg-orange-100 text-orange-800 text-xs px-4 py-1 rounded-full font-medium border border-orange-200">⚠️ {error}</span>}
        </div>
        
        {spots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {spots.map((spot, index) => (
                    <SpotCard key={index} spot={spot} rank={index} />
                ))}
            </div>
        ) : (
            !error && <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300 text-gray-400">Nada relevante encontrado.</div>
        )}
    </div>
  );
};

// --- CONTROLADOR PRINCIPAL ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4 font-sans text-gray-900">
        <div className="w-full max-w-6xl flex flex-col items-center">
            
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 drop-shadow-sm">
                    CaraCola <span className="text-gray-800">Deep Scan</span> 🛰️
                </h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Búsqueda profunda (3 páginas) para encontrar las joyas ocultas de 5 estrellas.
                </p>
            </div>

            <div className="bg-white p-3 pl-6 rounded-full shadow-xl border border-gray-200 w-full max-w-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-green-100 transform hover:scale-105 duration-300">
                <span className="text-2xl">🔎</span>
                <input type="text" value={inputCity} onChange={(e) => setInputCity(e.target.value)} className="flex-1 py-4 bg-transparent outline-none text-xl text-gray-800 placeholder-gray-400 font-medium" placeholder="Escribe una ciudad..." />
                <button onClick={handleSearch} className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95">Escanear</button>
            </div>

            <TopSpotsList city={searchCity} />

        </div>
    </div>
  );
}