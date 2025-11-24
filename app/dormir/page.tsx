'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
const CX_ID = "9022e72d0fcbd4093"; // Tu ID de Buscador Personalizado

// --- COMPONENTE: TARJETA PARK4NIGHT (La "Pastilla") ---
const Park4NightCard = ({ city }: { city: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usamos la clave de entorno o una cadena vacía si falla
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
            throw new Error("Falta la API Key en el archivo .env.local");
        }

        // Construimos la consulta: "área autocaravana {ciudad}"
        const query = `área autocaravana ${city}`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=1`;

        console.log("🔍 Buscando en CSE:", query); // Para depurar en consola

        const res = await fetch(url);
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error?.message || "Error en la API de Google");
        }

        const json = await res.json();

        if (json.items && json.items.length > 0) {
          setData(json.items[0]);
        } else {
          setError("No se encontraron resultados en Park4Night/Caramaps para esta zona.");
        }

      } catch (e: any) {
        console.error("Error fetch:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  // 1. ESTADO DE CARGA
  if (loading) return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm animate-pulse flex items-center gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
  );

  // 2. ESTADO DE ERROR O SIN RESULTADOS
  if (error || !data) {
    return (
      <div className="w-full max-w-md mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-center">
          <p className="text-red-600 font-bold mb-2">⚠️ No se encontró ficha visual</p>
          <p className="text-xs text-gray-500 mb-3">{error || "Intenta buscar con otro nombre"}</p>
          <a 
            href={`https://www.google.com/search?q=site:park4night.com ${city}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Probar búsqueda manual en Google
          </a>
      </div>
    );
  }

  // 3. ESTADO DE ÉXITO (LA PASTILLA VISUAL)
  // Intentamos sacar la mejor imagen posible
  const image = data.pagemap?.cse_image?.[0]?.src || data.pagemap?.cse_thumbnail?.[0]?.src;
  
  // Limpiamos el título para que no salga " - park4night"
  const cleanTitle = data.title
    .replace(' - park4night', '')
    .replace(' - Caramaps', '')
    .replace('SURVIVOR', ''); // A veces sale texto raro en SEO

  return (
    <a 
      href={data.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block w-full max-w-md mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer group no-underline"
    >
      <div className="flex h-32">
        {/* ZONA IMAGEN */}
        <div className="w-1/3 bg-gray-100 relative overflow-hidden">
            {image ? (
                <img 
                    src={image} 
                    alt={cleanTitle} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🚐</div>
            )}
            <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                SUGERENCIA
            </div>
        </div>

        {/* ZONA TEXTO */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {cleanTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {data.snippet}
                </p>
            </div>
            
            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-gray-400 truncate max-w-[100px]">
                    {data.displayLink}
                </span>
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    Ver Ficha ➜
                </span>
            </div>
        </div>
      </div>
    </a>
  );
};


// --- PÁGINA DE LABORATORIO (CONTROLADOR) ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4">
        
        <div className="max-w-lg w-full space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">🧪 Laboratorio de "Pastillas"</h1>
                <p className="text-gray-500 mt-2">Prueba aquí cómo se ven las tarjetas de Park4Night antes de ponerlas en el mapa.</p>
            </div>

            {/* BUSCADOR MANUAL */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                    type="text" 
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    // 🛑 CAMBIO AQUÍ: Añadido 'bg-white' y 'text-gray-900' explícitamente
                    className="flex-1 p-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                    placeholder="Escribe una ciudad (ej: Cuenca)"
                />
                <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
                >
                    Probar
                </button>
            </form>

            <div className="border-t border-gray-300 my-8"></div>

            {/* RESULTADO */}
            <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">
                    Resultado para: <span className="text-gray-800">{searchCity}</span>
                </h2>
                
                {/* AQUÍ ESTÁ EL COMPONENTE QUE QUEREMOS PROBAR */}
                <Park4NightCard city={searchCity} />
                
            </div>

        </div>
    </div>
  );
}