'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
const CX_ID = "9022e72d0fcbd4093"; 

// --- COMPONENTE: TARJETA PRO (Extrae Rating y Fotos) ---
const Park4NightCard = ({ city, onDataReceived }: { city: string, onDataReceived?: (data: any) => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        if (!apiKey) throw new Error("Falta API Key");

        // Buscamos en park4night
        const query = `site:park4night.com "área" ${city}`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=1`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.items && json.items.length > 0) {
          const item = json.items[0];
          setData(item);
          if (onDataReceived) onDataReceived(item);
        } else {
          setError("Sin resultados");
          setData(null);
        }

      } catch (e: any) {
        console.error(e);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  if (loading) return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl border shadow-sm flex gap-4 animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
  );

  if (error || !data) return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-sm">
        No se encontró ficha automática para {city}
    </div>
  );

  // --- EXTRACCIÓN INTELIGENTE DE DATOS ---
  
  // 1. Imagen: Preferimos cse_image (la grande)
  const image = data.pagemap?.cse_image?.[0]?.src || data.pagemap?.cse_thumbnail?.[0]?.src;
  
  // 2. Título: Limpiamos la basura del SEO
  const cleanTitle = data.title
    .replace(' - park4night', '')
    .replace(' - Caramaps', '')
    .replace(/\(\d+\)/, '') // Quita códigos postales entre paréntesis si los hay
    .trim();

  // 3. Rating: Buscamos patrones como "4.5/5" o "3.84/5" en el texto
  const ratingMatch = data.snippet?.match(/(\d[\.,]\d+)\/5/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

  // 4. Color del Rating
  let ratingColor = "bg-gray-100 text-gray-600";
  if (rating && rating >= 4) ratingColor = "bg-green-100 text-green-700 border-green-200";
  else if (rating && rating >= 3) ratingColor = "bg-yellow-100 text-yellow-700 border-yellow-200";

  return (
    <a 
        href={data.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-full max-w-md mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group no-underline"
    >
      <div className="flex h-32">
        {/* FOTO */}
        <div className="w-32 h-full relative flex-shrink-0 bg-gray-200">
            {image ? (
                <img src={image} alt={cleanTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🚐</div>
            )}
            
            {/* ETIQUETA DE RATING (SI EXISTE) */}
            {rating && (
                <div className={`absolute bottom-0 left-0 right-0 ${ratingColor} text-[10px] font-bold px-2 py-1 text-center border-t`}>
                    ⭐ {rating}/5
                </div>
            )}
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 group-hover:text-orange-600 transition-colors">
                    {cleanTitle}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 overflow-hidden">
                    {data.snippet.split('...')[0]}... {/* Cortamos para que no sea eterno */}
                </p>
            </div>
            
            <div className="flex justify-end items-center mt-2">
                <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100 font-bold flex items-center gap-1">
                    Ver Ficha <span className="group-hover:translate-x-1 transition-transform">➜</span>
                </span>
            </div>
        </div>
      </div>
    </a>
  );
};

// --- PÁGINA DE LABORATORIO ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');
  const [rawData, setRawData] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
    setRawData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 font-sans text-gray-900">
        <div className="max-w-xl w-full space-y-6">
            
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    CaraCola Lab 🔬
                </h1>
                <p className="text-gray-500 text-sm mt-1">Prueba de extracción de datos (Park4Night)</p>
            </div>

            {/* BUSCADOR (ARREGLADO EL FONDO BLANCO) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputCity}
                        onChange={(e) => setInputCity(e.target.value)}
                        // Clases clave: bg-white, text-gray-900, border
                        className="flex-1 p-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400"
                        placeholder="Ej: Tarifa, Cuenca..."
                    />
                    <button type="submit" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 shadow-md transition-all">
                        Analizar
                    </button>
                </form>
            </div>

            {/* RESULTADO VISUAL */}
            <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 ml-1">Resultado Generado:</h2>
                <Park4NightCard city={searchCity} onDataReceived={setRawData} />
            </div>

            {/* DATOS TÉCNICOS */}
            {rawData && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-xs font-mono text-gray-400 uppercase">Datos Originales (Debug)</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto shadow-inner">
                        <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
                            {JSON.stringify(rawData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
}