'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; 

interface Spot {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number;
}

// --- COMPONENTE TARJETA ---
const SpotCard = ({ spot, rank }: { spot: Spot, rank: number }) => {
  const medals = ["🥇", "🥈", "🥉"];
  
  // Colores según nota real
  let color = "bg-gray-500";
  if (spot.rating >= 4.5) color = "bg-green-600";
  else if (spot.rating >= 4) color = "bg-green-500";
  else if (spot.rating >= 3) color = "bg-yellow-500";
  else color = "bg-red-500";

  return (
    <a href={spot.link} target="_blank" rel="noopener noreferrer" className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden hover:scale-[1.02] transition-transform h-full border border-gray-100 no-underline group">
      <div className="relative h-40 bg-gray-200">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100 text-gray-300">📷</div>
        )}
        
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md font-bold shadow text-sm">{medals[rank]}</div>
        
        <div className={`absolute bottom-2 right-2 ${color} text-white font-bold px-2 py-1 rounded shadow text-xs`}>
            ⭐ {spot.rating}/5
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 leading-snug">{spot.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-3 flex-grow mb-2">
            {spot.snippet.replace(/(\d[\.,]\d+\/5)/g, '')}
        </p>
        
        <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
             <span className="text-[10px] text-gray-400">park4night.com</span>
             <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Nota Verificada</span>
        </div>
      </div>
    </a>
  );
};

// --- LÓGICA DE BÚSQUEDA ESTRICTA ---
const SearchEngine = () => {
  const [city, setCity] = useState("Punta Umbria");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const searchBestSpots = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSpots([]);
    setStatus("Lanzando escáner doble (20 resultados)...");

    try {
      // 1. PEDIMOS 20 RESULTADOS (Página 1 y 2)
      const queries = [1, 11].map(start => 
        fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=site:park4night.com "${city}"&num=10&start=${start}`)
        .then(r => r.json())
      );

      const responses = await Promise.all(queries);
      let allItems: any[] = [];
      responses.forEach(r => { if (r.items) allItems.push(...r.items); });

      if (allItems.length === 0) {
          setStatus("Google no devolvió resultados.");
          setLoading(false);
          return;
      }

      setStatus(`Filtrando ${allItems.length} candidatos...`);

      // 2. PROCESAMIENTO ESTRICTO
      const processed = allItems.map(item => {
        const text = (item.title + " " + item.snippet);
        
        // Buscamos nota real
        const match = text.match(/(\d[\.,]\d+)\/5/);
        let rating = 0;
        if (match) rating = parseFloat(match[1].replace(',', '.'));
        else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
            rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
        }

        return {
          title: item.title.replace(' - park4night', '').replace(' - Caramaps', '').replace(/\(\d+\)/, '').trim(),
          link: item.link,
          snippet: item.snippet,
          image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null,
          rating // Si es 0, se filtrará
        };
      });

      // 3. FILTRO "TOLERANCIA CERO"
      // Solo pasan los sitios donde HEMOS ENCONTRADO una nota (> 0)
      const verifiedSpots = processed
        .filter((v,i,a)=>a.findIndex(t=>(t.link === v.link))===i) // Quitar duplicados
        .filter(spot => spot.rating > 0) // <--- AQUÍ ESTÁ EL FILTRO NUEVO
        .sort((a, b) => b.rating - a.rating); // Ordenar de mejor a peor

      if (verifiedSpots.length === 0) {
          setStatus(`Se encontraron sitios, pero Google no mostraba sus notas en el resumen.`);
      } else {
          setSpots(verifiedSpots.slice(0, 3));
          setStatus(`¡Éxito! Mostrando los ${Math.min(3, verifiedSpots.length)} mejores con nota verificada.`);
      }

    } catch (err) {
      console.error(err);
      setStatus("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-100">
            <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">🕵️‍♂️ Buscador Estricto</h1>
            <p className="text-center text-gray-400 text-sm mb-6">Solo muestra sitios con puntuación detectada explícitamente.</p>
            
            <form onSubmit={searchBestSpots} className="flex gap-2 max-w-lg mx-auto">
                <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    className="flex-1 p-3 border rounded-lg text-lg shadow-inner"
                    placeholder="Ciudad..."
                />
                <button disabled={loading} className="bg-blue-600 text-white px-8 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>
            <p className="text-center text-xs text-orange-500 mt-3 font-medium h-4">{status}</p>
        </div>

        {spots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {spots.map((s, i) => <SpotCard key={i} spot={s} rank={i} />)}
            </div>
        ) : (
            !loading && status.includes("Se encontraron sitios") && (
                <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 mb-2">🙈 Google no nos ha chivado ninguna nota para esta búsqueda.</p>
                    <a href={`https://park4night.com/es/search?q=${city}`} target="_blank" className="text-blue-600 underline font-bold">Buscar manualmente en Park4Night</a>
                </div>
            )
        )}
    </div>
  );
};

export default function DormirLab() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans text-gray-900">
        <SearchEngine />
    </div>
  );
}
