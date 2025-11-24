'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN DEL LABORATORIO ---
// Usamos tus claves directamente aquí para asegurar que el test funcione sin errores de entorno
const CX_ID = "9022e72d0fcbd4093"; 
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Tu clave válida
const MIN_QUALITY_SCORE = 3.75; // Nota mínima para entrar en el podio

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

// --- 1. COMPONENTE VISUAL: LA TARJETA (PASTILLA) ---
const SpotCard = ({ spot, rank }: { spot: SpotData, rank: number }) => {
  const medals = ["🥇", "🥈", "🥉"];
  const borderColors = ["border-yellow-500", "border-gray-400", "border-orange-400"];
  
  const borderColor = borderColors[rank] || "border-gray-200";
  const medal = medals[rank] || `#${rank + 1}`;
  const badgeColor = spot.rating >= 4.5 ? "bg-green-600" : (spot.rating >= 4 ? "bg-green-500" : "bg-yellow-500");

  return (
    <a 
      href={spot.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`flex flex-col bg-white border-2 ${borderColor} rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group h-full no-underline relative`}
    >
      {/* IMAGEN */}
      <div className="relative h-48 bg-gray-200">
        {spot.image ? (
          <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
              <span className="text-4xl">🌲</span>
              <span className="text-[10px] mt-2 uppercase font-bold">Sin Foto</span>
          </div>
        )}
        
        {/* MEDALLA */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-lg px-2 py-1 rounded-lg shadow-sm border border-gray-200 z-10">
           {medal}
        </div>

        {/* NOTA GRANDE */}
        {spot.rating > 0 && (
            <div className={`absolute bottom-2 right-2 ${badgeColor} text-white text-sm font-extrabold px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-10 border border-white/20`}>
               ⭐ {spot.displayRating}
            </div>
        )}
        
        {/* TIPO DE LUGAR */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase backdrop-blur-sm">
            {spot.type}
        </div>
      </div>

      {/* TEXTOS */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {spot.title}
        </h3>
        
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-grow">
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

// --- 2. LÓGICA: EL CEREBRO (Busca, Filtra y Ordena) ---
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
        // 1. CONSULTA (AJUSTADA SEGÚN TUS INSTRUCCIONES)
        // Buscamos en todo el dominio, usando el nombre de la ciudad exacto
        const query = `site:park4night.com "${city}"`; 
        
        // Pedimos 10 resultados para tener margen de filtrado
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        const json = await res.json();

        if (!json.items || json.items.length === 0) {
             setError("No se encontraron lugares en Park4Night.");
             return;
        }

        // 2. PROCESAMIENTO (ALGORITMO v4)
        const processedSpots: SpotData[] = json.items.map((item: any) => {
            let ratingValue = 0;
            
            // A. Detección de Nota
            const textToAnalyze = (item.snippet || "") + " " + (item.title || "");
            const ratingMatch = textToAnalyze.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/); // Busca "4.5/5"

            if (ratingMatch) {
                ratingValue = parseFloat(ratingMatch[1].replace(',', '.'));
            } else {
                // Búsqueda secundaria (estrellas o datos ocultos)
                const starMatch = textToAnalyze.match(/(\d[\.,]\d) (stars|estrellas)/i);
                if (starMatch) ratingValue = parseFloat(starMatch[1].replace(',', '.'));
                
                if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
                    ratingValue = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
                }
            }

            // B. Detección de Tipo
            let type = "Spot";
            const lowerText = textToAnalyze.toLowerCase();
            if (lowerText.includes("área") || lowerText.includes("area")) type = "Área AC";
            else if (lowerText.includes("parking") || lowerText.includes("aparcamiento")) type = "Parking";
            else if (lowerText.includes("picnic") || lowerText.includes("nature") || lowerText.includes("naturaleza")) type = "Naturaleza";
            else if (lowerText.includes("camping")) type = "Camping";
            else if (lowerText.includes("farm") || lowerText.includes("granja")) type = "Granja";

            // C. Limpieza
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
                type
            };
        });

        // 3. FILTRADO (La Guillotina)
        // Quitamos duplicados
        const uniqueSpots = processedSpots.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
        
        // Solo pasan los que superan la nota de corte
        const highQualitySpots = uniqueSpots.filter(spot => spot.rating >= MIN_QUALITY_SCORE);

        // 4. ORDENACIÓN (El Podio)
        let finalSpots = highQualitySpots.sort((a, b) => b.rating - a.rating);

        // Plan B: Si somos demasiado estrictos y no queda nadie, mostramos los que tienen foto
        if (finalSpots.length === 0) {
            setError(`No hay sitios con nota > ${MIN_QUALITY_SCORE}, mostrando alternativas visuales:`);
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

  // Renderizado de Carga
  if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-white rounded-xl border p-4 animate-pulse flex flex-col gap-4">
                  <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
          ))}
      </div>
  );

  // Renderizado Principal
  return (
    <div className="mt-10 w-full max-w-6xl">
        <div className="flex flex-col items-center justify-center gap-2 mb-10">
            <div className="flex items-center gap-3">
                <span className="text-4xl">🏆</span>
                <h3 className="font-black text-3xl text-gray-800">Top 3 Recomendados</h3>
            </div>
            {error && (
                <span className="bg-orange-100 text-orange-800 text-sm px-4 py-1 rounded-full font-medium border border-orange-200">
                    ⚠️ {error}
                </span>
            )}
        </div>
        
        {spots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {spots.map((spot, index) => (
                    <SpotCard key={index} spot={spot} rank={index} />
                ))}
            </div>
        ) : (
            !error && (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-lg">No encontramos resultados claros en Park4Night.</p>
                <a href={`https://park4night.com/es/search?q=${city}`} target="_blank" className="text-blue-600 font-bold hover:underline mt-4 inline-block">
                    Ir a la web oficial ➜
                </a>
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
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 drop-shadow-sm">
                    CaraCola <span className="text-gray-800">Lab</span> 🧪
                </h1>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">
                    Banco de pruebas para el algoritmo de recomendación de pernocta.
                    <br/>
                    <span className="text-sm bg-gray-200 px-2 py-1 rounded mt-2 inline-block">Filtro de Calidad: &gt; {MIN_QUALITY_SCORE}/5</span>
                </p>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white p-3 pl-6 rounded-full shadow-xl border border-gray-200 w-full max-w-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-orange-100 transform hover:scale-105 duration-300">
                <span className="text-2xl">🔎</span>
                <input 
                    type="text" 
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    className="flex-1 py-4 bg-transparent outline-none text-xl text-gray-800 placeholder-gray-400 font-medium"
                    placeholder="Escribe una ciudad..."
                />
                <button 
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95"
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