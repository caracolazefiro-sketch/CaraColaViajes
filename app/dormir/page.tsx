'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
const CX_ID = "9022e72d0fcbd4093"; 

// --- COMPONENTE: TARJETA VISUAL ---
const Park4NightCard = ({ city, onDataReceived }: { city: string, onDataReceived: (data: any) => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) throw new Error("Falta API Key");

        // Buscamos específicamente en park4night para tener datos más ricos
        const query = `site:park4night.com "área" ${city}`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=1`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.items && json.items.length > 0) {
          const item = json.items[0];
          setData(item);
          onDataReceived(item); // Enviamos los datos brutos al padre para verlos
        } else {
          setError("Sin resultados relevantes.");
          onDataReceived(null);
        }

      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  if (loading) return <div className="w-full max-w-md mx-auto p-4 bg-gray-50 rounded-xl border animate-pulse">Buscando el mejor spot...</div>;

  if (error || !data) return <div className="text-center text-gray-400 text-sm p-4">No se encontró información visual.</div>;

  // --- EXTRACCIÓN DE DATOS ---
  // Intentamos buscar la imagen más grande posible (Open Graph)
  const image = data.pagemap?.metatags?.[0]?.['og:image'] || 
                data.pagemap?.cse_image?.[0]?.src;

  const title = data.title.replace(' - park4night', '').replace(' - Caramaps', '');

  return (
    <a href={data.link} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group no-underline">
      <div className="relative h-48 bg-gray-200">
        {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🚐</div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
            <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{data.snippet}</p>
        <div className="flex justify-between items-center">
             <span className="text-xs font-mono text-gray-400">park4night.com</span>
             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Ver Detalles</span>
        </div>
      </div>
    </a>
  );
};

// --- PÁGINA DE LABORATORIO ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');
  const [rawData, setRawData] = useState<any>(null); // Aquí guardaremos el JSON crudo

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
    setRawData(null); // Limpiamos datos viejos
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 font-sans">
        <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">🔬 Inspector de Datos CSE</h1>
                <p className="text-gray-500 mt-2">Analiza qué nos devuelve Google sobre cada lugar.</p>
            </div>

            {/* BUSCADOR */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                    type="text" 
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    className="flex-1 p-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                    placeholder="Ciudad..."
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                    Analizar
                </button>
            </form>

            {/* TARJETA VISUAL */}
            <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">Vista Previa (Usuario)</h2>
                <Park4NightCard city={searchCity} onDataReceived={setRawData} />
            </div>

            {/* VISOR DE DATOS TÉCNICOS (JSON) */}
            {rawData && (
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 mt-8">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-mono text-green-400">● DATOS RECIBIDOS (JSON)</span>
                        <span className="text-[10px] text-gray-500">Estructura cruda de Google CSE</span>
                    </div>
                    <pre className="p-4 text-xs text-green-300 font-mono overflow-x-auto max-h-96">
                        {JSON.stringify(rawData, null, 2)}
                    </pre>
                    <div className="p-4 bg-gray-800 text-gray-300 text-xs border-t border-gray-700">
                        <strong>¿Qué buscar aquí?</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                            <li>Mira dentro de <code>pagemap {'>'} metatags</code>. A veces salen coordenadas (<code>og:latitude</code>) o valoraciones.</li>
                            <li>Mira <code>pagemap {'>'} cse_image</code> para ver la URL de la foto.</li>
                            <li>El campo <code>snippet</code> es la descripción corta.</li>
                        </ul>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
}