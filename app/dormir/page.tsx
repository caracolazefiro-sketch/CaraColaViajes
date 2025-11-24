'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
declare const google: any;
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Tu clave válida
const MIN_QUALITY_SCORE = 3.75; 

// --- INTERFACES ---
interface SpotFeatures {
  hasWater: boolean;
  hasElec: boolean;
  isQuiet: boolean;
  isFree: boolean;
  isPaid: boolean;
}

interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; 
  displayRating: string; 
  type: string;
  features: SpotFeatures;
  coordinates: { lat: number, lng: number } | null;
}

// --- 1. COMPONENTE VISUAL: LA SUPER-TARJETA ---
const SpotCard = ({ spot, rank }: { spot: SpotData, rank: number }) => {
  const medals = ["🥇", "🥈", "🥉"];
  const borderColors = ["border-yellow-500", "border-gray-400", "border-orange-400"];
  
  const borderColor = borderColors[rank] || "border-gray-200";
  const medal = medals[rank] || `#${rank + 1}`;
  const badgeColor = spot.rating >= 4.5 ? "bg-green-600" : (spot.rating >= 4 ? "bg-green-500" : "bg-yellow-500");

  // URL para navegar directamente (Si tenemos coordenadas, usamos GPS, si no, búsqueda)
  const navUrl = spot.coordinates 
    ? `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates.lat},${spot.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.title)}`;

  return (
    <div className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 h-full relative`}>
      
      {/* IMAGEN + BADGES SUPERIORES */}
      <div className="relative h-48 bg-gray-200 group">
        <a href={spot.link} target="_blank" rel="noopener noreferrer">
            {spot.image ? (
            <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                <span className="text-4xl">🌲</span>
                <span className="text-[10px] mt-2 uppercase font-bold">Sin Foto</span>
            </div>
            )}
        </a>
        
        {/* MEDALLA */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-lg px-2 py-1 rounded-lg shadow-sm border border-gray-200 z-10">
           {medal}
        </div>

        {/* PRECIO (Deducido) */}
        {spot.features.isFree && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">GRATIS</div>}
        {spot.features.isPaid && <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow">€ PAGO</div>}
        
        {/* NOTA FLOTANTE */}
        {spot.rating > 0 && (
            <div className={`absolute bottom-2 right-2 ${badgeColor} text-white text-sm font-extrabold px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-10 border border-white/20`}>
               ⭐ {spot.displayRating}
            </div>
        )}

        {/* TIPO */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase backdrop-blur-sm">
            {spot.type}
        </div>
      </div>

      {/* CUERPO CON DATOS "MINADOS" */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        <a href={spot.link} target="_blank" rel="noopener noreferrer" className="group-hover:text-blue-600 transition-colors no-underline">
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
                {spot.title}
            </h3>
        </a>
        
        {/* ICONOS DE SERVICIOS DETECTADOS */}
        <div className="flex flex-wrap gap-1 mb-3">
            {spot.features.isQuiet && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded border border-teal-100">🍃 Tranquilo</span>}
            {spot.features.hasWater && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">💧 Agua</span>}
            {spot.features.hasElec && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded border border-yellow-100">⚡ Luz</span>}
        </div>

        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-grow border-l-2 border-gray-100 pl-2">
            "{spot.snippet.replace(/(\d[\.,]\d+\/5)/g, '')}"
        </p>
        
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-auto gap-2">
             {/* BOTÓN 1: Ver Ficha Web */}
             <a href={spot.link} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                📄 Ficha
             </a>
             
             {/* BOTÓN 2: Navegar GPS (La Joya) */}
             <a href={navUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-sm">
                <span>📍</span> Navegar
             </a>
        </div>
      </div>
    </div>
  );
};

// --- 2. LÓGICA: MINERÍA DE DATOS ---
const TopSpotsList = ({ city }: { city: string }) => {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. CONSULTA ABIERTA
        const query = `site:park4night.com "${city}"`; 
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        const json = await res.json();

        if (!json.items || json.items.length === 0) {
             setError("No se encontraron lugares.");
             return;
        }

        // 2. PROCESAMIENTO INTELIGENTE (ALGORITMO v5)
        const processedSpots: SpotData[] = json.items.map((item: any) => {
            let ratingValue = 0;
            
            // Texto completo para análisis (Título + Resumen)
            const fullText = (item.snippet || "") + " " + (item.title || "");
            const lowerText = fullText.toLowerCase();

            // A. EXTRACCIÓN DE NOTA
            const ratingMatch = fullText.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
            if (ratingMatch) {
                ratingValue = parseFloat(ratingMatch[1].replace(',', '.'));
            } else {
                const starMatch = fullText.match(/(\d[\.,]\d) (stars|estrellas)/i);
                if (starMatch) ratingValue = parseFloat(starMatch[1].replace(',', '.'));
                else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
                    ratingValue = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
                }
            }

            // B. EXTRACCIÓN DE CARACTERÍSTICAS (MINERÍA DE TEXTO)
            const features: SpotFeatures = {
                hasWater: lowerText.includes('agua') || lowerText.includes('water') || lowerText.includes('grifo') || lowerText.includes('servicios'),
                hasElec: lowerText.includes('luz') || lowerText.includes('electricidad') || lowerText.includes('corriente'),
                isQuiet: lowerText.includes('tranquilo') || lowerText.includes('quiet') || lowerText.includes('calm') || lowerText.includes('noche'),
                isFree: lowerText.includes('gratis') || lowerText.includes('free') || lowerText.includes('gratuit'),
                isPaid: lowerText.includes('€') || lowerText.includes('pago') || lowerText.includes('paid')
            };

            // C. EXTRACCIÓN DE COORDENADAS (GPS)
            // Buscamos en metatags (geo.position, place:location:latitude, etc.)
            let coords = null;
            const metas = item.pagemap?.metatags?.[0] || {};
            if (metas['place:location:latitude'] && metas['place:location:longitude']) {
                coords = { lat: parseFloat(metas['place:location:latitude']), lng: parseFloat(metas['place:location:longitude']) };
            } else if (metas['og:latitude'] && metas['og:longitude']) {
                 coords = { lat: parseFloat(metas['og:latitude']), lng: parseFloat(metas['og:longitude']) };
            }

            // D. TIPO DE LUGAR
            let type = "Spot";
            if (lowerText.includes("área") || lowerText.includes("area")) type = "Área AC";
            else if (lowerText.includes("parking") || lowerText.includes("aparcamiento")) type = "Parking";
            else if (lowerText.includes("picnic") || lowerText.includes("nature") || lowerText.includes("naturaleza")) type = "Naturaleza";
            else if (lowerText.includes("camping")) type = "Camping";
            else if (lowerText.includes("farm") || lowerText.includes("granja")) type = "Granja";

            // E. LIMPIEZA VISUAL
            const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
            const title = (item.title || "")
                .replace(/ - park4night/i, '')
                .replace(/ - Caramaps/i, '')
                .replace(/\(\d+\)/, '') 
                .replace(/Parking day\/night/i, 'PK Día/Noche')
                .trim();

            return {
                title,
                link: item.link,
                snippet: item.snippet || "",
                image: img,
                rating: ratingValue,
                displayRating: ratingValue > 0 ? ratingValue.toFixed(1) : "?",
                type,
                features,
                coordinates: coords
            };
        });

        // 3. FILTRADO Y ORDENACIÓN
        const uniqueSpots = processedSpots.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
        
        // Filtro de calidad (Anti-Basura)
        const highQualitySpots = uniqueSpots.filter(spot => spot.rating >= MIN_QUALITY_SCORE);

        let finalSpots = highQualitySpots.sort((a, b) => b.rating - a.rating);

        if (finalSpots.length === 0) {
            setError(`No hay sitios con nota > ${MIN_QUALITY_SCORE} detectada. Mostrando alternativas con foto:`);
            finalSpots = uniqueSpots.filter(s => s.image).slice(0, 3);
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
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="mt-8 w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🥇</span>
                <h3 className="font-extrabold text-2xl text-gray-800">Mejores Opciones Detectadas</h3>
            </div>
            {error && <span className="bg-orange-100 text-orange-800 text-xs px-4 py-1 rounded-full font-medium border border-orange-200">⚠️ {error}</span>}
        </div>
        
        {spots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {spots.map((spot, index) => <SpotCard key={index} spot={spot} rank={index} />)}
            </div>
        ) : (
            !error && (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-lg">No encontramos resultados claros.</p>
                <a href={`https://park4night.com/es/search?q=${city}`} target="_blank" className="text-blue-600 font-bold hover:underline mt-4 inline-block">Ir a Park4Night oficial ➜</a>
            </div>
            )
        )}
    </div>
  );
};

// --- 3. PÁGINA PRINCIPAL DEL LABORATORIO ---
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
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 drop-shadow-sm">CaraCola <span className="text-gray-800">Lab v5</span> 🧪</h1>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">Detector de Servicios (Agua, Luz, Ruido) + Navegación GPS</p>
            </div>

            <div className="bg-white p-3 pl-6 rounded-full shadow-xl border border-gray-200 w-full max-w-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-orange-100 transform hover:scale-105 duration-300">
                <span className="text-2xl">🔎</span>
                <input type="text" value={inputCity} onChange={(e) => setInputCity(e.target.value)} className="flex-1 py-4 bg-transparent outline-none text-xl text-gray-800 placeholder-gray-400 font-medium" placeholder="Escribe una ciudad..." />
                <button onClick={handleSearch} className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95">Buscar</button>
            </div>

            <TopSpotsList city={searchCity} />
        </div>
    </div>
  );
}