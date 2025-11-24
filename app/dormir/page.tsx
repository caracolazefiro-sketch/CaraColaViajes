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
  rating: number; // Nota numérica para ordenar
  displayRating: string; // Nota visual (ej: "4.5")
  reviews: number; // Número de reseñas (si las encontramos)
}

// --- COMPONENTE: TARJETA DE UN SPOT ---
const SpotCard = ({ spot, rank }: { spot: SpotData, rank: number }) => {
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
      className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-xl ${shadowClass} transition-all transform hover:-translate-y-1 group h-full no-underline`}
    >
      {/* IMAGEN */}
      <div className="relative h-36 bg-gray-200">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">🚐</div>
        )}
        
        {/* MEDALLA */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-sm font-bold px-2 py-1 rounded-lg shadow-sm border border-gray-200 z-10">
           {medal}
        </div>

        {/* NOTA DESTACADA */}
        {spot.rating > 0 && (
            <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 z-10">
               ⭐ {spot.displayRating} <span className="opacity-75 font-normal text-[10px]">/5</span>
            </div>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                {spot.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                {spot.snippet}
            </p>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
             <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                {new URL(spot.link).hostname.replace('www.', '')}
             </span>
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
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
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        // Pedimos 10 resultados para poder filtrar la basura y quedarnos con la "creme de la creme"
        const query = `site:park4night.com "área" ${city}`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error API");
        const json = await res.json();

        if (!json.items || json.items.length === 0) {
             setError("No se encontraron áreas con suficiente información.");
             return;
        }

        // --- ALGORITMO DE EXTRACCIÓN Y RANKING v2 ---
        const processedSpots: SpotData[] = json.items.map((item: any) => {
            let ratingValue = 0;
            let reviewCount = 0;

            // ESTRATEGIA 1: Datos Estructurados (Schema.org) - La fuente más fiable
            // Park4Night suele inyectar esto en el pagemap
            const aggregateRating = item.pagemap?.aggregaterating?.[0];
            if (aggregateRating?.ratingvalue) {
                ratingValue = parseFloat(aggregateRating.ratingvalue);
                if (aggregateRating.reviewcount) reviewCount = parseInt(aggregateRating.reviewcount);
            }

            // ESTRATEGIA 2: Regex en Metatags (OpenGraph)
            // A veces la descripción de OG es: "4.5/5 - 20 reviews..."
            if (ratingValue === 0 && item.pagemap?.metatags?.[0]?.["og:description"]) {
                const desc = item.pagemap.metatags[0]["og:description"];
                const match = desc.match(/(\d[.,]\d+)\/5/);
                if (match) ratingValue = parseFloat(match[1].replace(',', '.'));
            }

            // ESTRATEGIA 3: Regex en el Snippet (Texto visible)
            // Busca patrones como "4.50/5", "3,8/5"
            if (ratingValue === 0 && item.snippet) {
                const match = item.snippet.match(/(\d[.,]\d{1,2})\/5/);
                if (match) ratingValue = parseFloat(match[1].replace(',', '.'));
            }

            // Limpieza de Imagen
            const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;

            // Limpieza de Título
            const title = item.title
                .replace(/ - park4night/i, '')
                .replace(/ - Caramaps/i, '')
                .replace(/\(\d+\)/, '') // Quita (28001)
                .trim();

            return {
                title,
                link: item.link,
                snippet: item.snippet,
                image: img,
                rating: ratingValue,
                displayRating: ratingValue > 0 ? ratingValue.toFixed(1) : "N/A",
                reviews: reviewCount
            };
        });

        // FILTRADO Y ORDENACIÓN
        // 1. Priorizamos los que tienen rating detectado (> 0)
        // 2. Ordenamos por nota descendente
        const rankedSpots = processedSpots
            .sort((a, b) => {
                // Si uno tiene rating y el otro no, gana el que tiene
                if (a.rating > 0 && b.rating === 0) return -1;
                if (a.rating === 0 && b.rating > 0) return 1;
                // Si ambos tienen, gana el mayor
                return b.rating - a.rating;
            })
            .slice(0, 3); // Nos quedamos el Top 3

        setSpots(rankedSpots);

      } catch (e: any) {
        console.error(e);
        setError("Error de conexión con el buscador.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-white rounded-xl border p-4 animate-pulse flex flex-col gap-3">
                  <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
          ))}
      </div>
  );

  if (error) return <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300 mt-4">{error}</div>;

  return (
    <div className="mt-8 w-full max-w-5xl">
        <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">🏆</span>
            <h3 className="font-bold text-xl text-gray-800">Podio de Mejores Opciones</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spots.map((spot, index) => (
                <SpotCard key={index} spot={spot} rank={index} />
            ))}
        </div>

        {spots.length === 0 && (
            <p className="text-center text-gray-500 italic mt-4">No se encontraron resultados claros para clasificar.</p>
        )}
        
        <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Algoritmo de clasificación basado en datos de park4night
            </p>
        </div>
    </div>
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-16 px-4 font-sans text-gray-900">
        <div className="w-full max-w-5xl space-y-10 flex flex-col items-center">
            
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Ranking Inteligente v2.0
                </h1>
                <p className="text-gray-500">Analiza los datos ocultos de Google para encontrar las verdaderas joyas.</p>
            </div>

            {/* BUSCADOR */}
            <div className="bg-white p-2 pl-4 rounded-full shadow-lg border border-gray-200 w-full max-w-md flex items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-blue-100">
                <span className="text-gray-400">🔍</span>
                <input 
                    type="text" 
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    className="flex-1 p-3 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    placeholder="Ciudad o Zona..."
                />
                <button 
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
                >
                    Buscar
                </button>
            </div>

            {/* RESULTADOS */}
            <TopSpotsList city={searchCity} />

        </div>
    </div>
  );
}