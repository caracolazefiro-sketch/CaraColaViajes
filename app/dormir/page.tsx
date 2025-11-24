'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Usamos clave directa para asegurar el test
const MIN_QUALITY = 3.8; // Solo mostramos sitios con nota mayor a esta

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
  const color = spot.rating >= 4.5 ? "bg-green-600" : "bg-yellow-500";

  return (
    <a href={spot.link} target="_blank" rel="noopener noreferrer" className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden hover:scale-[1.02] transition-transform h-full border border-gray-100">
      <div className="relative h-40 bg-gray-200">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🌲</div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded font-bold shadow">{medals[rank]}</div>
        <div className={`absolute bottom-2 right-2 ${color} text-white font-bold px-2 py-1 rounded shadow text-sm`}>
           ⭐ {spot.rating > 0 ? spot.rating : "?"}/5
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2">{spot.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-3 flex-grow">{spot.snippet}</p>
        <div className="mt-3 pt-2 border-t text-right">
            <span className="text-xs text-blue-600 font-bold">Ver en Park4Night ➜</span>
        </div>
      </div>
    </a>
  );
};

// --- LÓGICA DE BÚSQUEDA AVANZADA ---
const SearchEngine = () => {
  const [city, setCity] = useState("Punta Umbria");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const searchBestSpots = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSpots([]);
    setStatus("Iniciando escáner...");

    try {
      // 1. LANZAMOS 2 REDES (20 resultados: Página 1 y Página 2)
      const queries = [1, 11].map(start => 
        fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=site:park4night.com "${city}"&num=10&start=${start}`)
        .then(r => r.json())
      );

      setStatus("Consultando a Google (20 resultados)...");
      const responses = await Promise.all(queries);
      
      let allItems: any[] = [];
      responses.forEach(r => { if (r.items) allItems.push(...r.items); });

      setStatus(`Analizando ${allItems.length} candidatos...`);

      // 2. PROCESAMOS Y EXTRAEMOS NOTAS
      const processed = allItems.map(item => {
        const text = (item.title + " " + item.snippet);
        
        // Buscamos notas: "4.50/5", "4,5/5"
        const match = text.match(/(\d[\.,]\d+)\/5/);
        let rating = 0;
        if (match) rating = parseFloat(match[1].replace(',', '.'));
        // Si no hay nota en texto, miramos si hay estrellas ocultas
        else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
            rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
        }

        return {
          title: item.title.replace(' - park4night', '').replace(/\(\d+\)/, '').trim(),
          link: item.link,
          snippet: item.snippet,
          image: item.pagemap?.cse_image?.[0]?.src || null,
          rating
        };
      });

      // 3. EL TORNEO: Filtramos y Ordenamos
      // Quitamos duplicados y filtramos por calidad mínima
      const bestOnes = processed
        .filter((v,i,a)=>a.findIndex(t=>(t.link === v.link))===i) // Unicos
        .sort((a, b) => b.rating - a.rating); // Ordenar por nota

      // Nos quedamos el Top 3
      setSpots(bestOnes.slice(0, 3));
      setStatus(`¡Encontrados! Mostrando los ${Math.min(3, bestOnes.length)} mejores.`);

    } catch (err) {
      console.error(err);
      setStatus("Error al buscar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h1 className="text-2xl font-black text-gray-800 mb-4 text-center">🕵️‍♂️ Buscador de Joyas</h1>
            <form onSubmit={searchBestSpots} className="flex gap-2">
                <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    className="flex-1 p-3 border rounded-lg text-lg"
                    placeholder="Ciudad..."
                />
                <button disabled={loading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition">
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-2">{status}</p>
        </div>

        {spots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {spots.map((s, i) => <SpotCard key={i} spot={s} rank={i} />)}
            </div>
        )}
    </div>
  );
};

export default function DormirLab() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
        <SearchEngine />
    </div>
  );
}
