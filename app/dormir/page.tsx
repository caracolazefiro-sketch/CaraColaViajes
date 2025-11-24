'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN ---
declare const google: any;
const CX_ID = "9022e72d0fcbd4093"; 

// --- INTERFACES DE DATOS ---
interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; // La nota numérica para ordenar
  displayRating: string; // La nota en texto para mostrar
}

// --- COMPONENTE: TARJETA DE UN SPOT ---
const SpotCard = ({ spot, rank }: { spot: SpotData, rank: number }) => {
  // Colores según ranking
  const medals = ["🥇", "🥈", "🥉"];
  const borderColors = ["border-yellow-400", "border-gray-300", "border-orange-300"];
  const shadowColors = ["shadow-yellow-100", "shadow-gray-100", "shadow-orange-100"];
  
  const borderColor = borderColors[rank] || "border-gray-200";
  const shadowClass = shadowColors[rank] || "shadow-sm";
  const medal = medals[rank] || `#${rank + 1}`;

  return (
    <a 
      href={spot.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-xl ${shadowClass} transition-all transform hover:-translate-y-1 group h-full`}
    >
      {/* CABECERA IMAGEN */}
      <div className="relative h-32 bg-gray-100">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🚐</div>
        )}
        
        {/* MEDALLA */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm border border-gray-200">
           {medal}
        </div>

        {/* NOTA */}
        <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
           ⭐ {spot.displayRating}
        </div>
      </div>

      {/* CUERPO */}
      <div className="p-3 flex flex-col flex-grow justify-between">
        <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-orange-600">
                {spot.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-3">
                {spot.snippet}
            </p>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                Ver Ficha ➜
             </span>
        </div>
      </div>
    </a>
  );
};

// --- COMPONENTE: LISTA DE MEJORES OPCIONES ---
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
        // 1. Preparamos la llamada
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        // Pedimos num=10 para tener variedad donde elegir
        const query = `site:park4night.com "área" ${city}`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        // 2. Fetch
        const res = await fetch(url);
        const json = await res.json();

        if (!json.items || json.items.length === 0) {
             setError("No se encontraron áreas.");
             return;
        }

        // 3. PROCESAMIENTO INTELIGENTE (La magia ✨)
        const processedSpots: SpotData[] = json.items.map((item: any) => {
            // A. Extraer Nota (Rating) con Regex
            // Busca patrones como "4.5/5", "3,80/5", etc.
            const ratingMatch = item.snippet?.match(/(\d[\.,]\d+)\/5/);
            let ratingValue = 0;
            let ratingText = "-";

            if (ratingMatch) {
                ratingValue = parseFloat(ratingMatch[1].replace(',', '.'));
                ratingText = ratingValue.toFixed(1) + "/5";
            } else {
                // Si no tiene nota en el texto, le damos prioridad baja
                ratingValue = 0; 
                ratingText = "N/A";
            }

            // B. Extraer Imagen
            const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;

            // C. Limpiar Título
            const title = item.title
                .replace(' - park4night', '')
                .replace(' - Caramaps', '')
                .replace(/\(\d+\)/, '') // Quita códigos postales (28001)
                .trim();

            return {
                title: title,
                link: item.link,
                snippet: item.snippet,
                image: img,
                rating: ratingValue,
                displayRating: ratingText
            };
        });

        // 4. ORDENAR Y FILTRAR
        // Ordenamos por nota (mayor a menor) y cogemos los 3 mejores
        const top3 = processedSpots
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);

        setSpots(top3);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-xl border p-4 animate-pulse">
                  <div className="w-full h-24 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
          ))}
      </div>
  );

  if (error) return <div className="text-center p-4 text-gray-500">{error}</div>;

  return (
    <div>
        <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <h3 className="font-bold text-gray-800">Top 3 Recomendados en {city}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spots.map((spot, index) => (
                <SpotCard key={index} spot={spot} rank={index} />
            ))}
        </div>

        {spots.length === 0 && (
            <p className="text-sm text-gray-500 italic">No pudimos clasificar los resultados.</p>
        )}
    </div>
  );
};

// --- PÁGINA DE LABORATORIO ---
export default function DormirLab() {
  const [inputCity, setInputCity] = useState('Punta Umbria');
  const [searchCity, setSearchCity] = useState('Punta Umbria');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCity(inputCity);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 font-sans text-gray-900">
        <div className="max-w-4xl w-full space-y-8">
            
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    Ranking Inteligente 🧠
                </h1>
                <p className="text-gray-500 text-sm mt-1">Analiza 10 resultados, extrae la nota y muestra el podio.</p>
            </div>

            {/* BUSCADOR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 max-w-lg mx-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputCity}
                        onChange={(e) => setInputCity(e.target.value)}
                        className="flex-1 p-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400"
                        placeholder="Ej: Tarifa, Cuenca..."
                    />
                    <button type="submit" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 shadow-md transition-all">
                        Buscar
                    </button>
                </form>
            </div>

            {/* RESULTADOS: EL PODIO */}
            <div className="mt-8">
                <TopSpotsList city={searchCity} />
            </div>

        </div>
    </div>
  );
}