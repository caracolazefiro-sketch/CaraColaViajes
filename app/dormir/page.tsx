'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- 1. CONFIGURACIÓN ---
declare const google: any;

const CX_ID = "9022e72d0fcbd4093"; 
const CENTER_POINT = { lat: 40.416775, lng: -3.703790 };

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
  minHeight: '600px',
  backgroundColor: '#e5e7eb'
};

// --- 2. INTERFACES ---
interface DailyPlan { day: number; date: string; from: string; to: string; distance: number; isDriving: boolean; }
interface TripResult { totalDays: number | null; distanceKm: number | null; totalCost: number | null; dailyItinerary: DailyPlan[] | null; error: string | null; }

// --- 3. HOOK DE CARGA DE MAPA (NATIVO) ---
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  }, [apiKey]);

  return isLoaded;
};

// --- 4. TARJETA PARK4NIGHT (BÚSQUEDA AMPLIADA) ---
const Park4NightCard = ({ city }: { city: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!city) return;
      setLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        
        // 🛑 CAMBIO CLAVE: Búsqueda abierta en el dominio, sin restringir a "área"
        const query = `site:park4night.com "${city}"`; 
        
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=1`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.items && json.items.length > 0) {
          setData(json.items[0]);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error("Error CSE:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [city]);

  if (loading) return <div className="animate-pulse p-3 bg-gray-100 rounded-lg h-20 w-full mt-2 text-xs text-gray-400 flex items-center justify-center">Buscando spots...</div>;
  
  if (error || !data) {
    return (
      <a href={`https://www.google.com/search?q=site:park4night.com ${city}`} target="_blank" rel="noopener noreferrer" className="block p-3 border border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 mt-2 text-xs text-gray-500">
        🔎 Buscar {city} en Google
      </a>
    );
  }

  // Extracción de datos
  const image = data.pagemap?.cse_image?.[0]?.src || data.pagemap?.cse_thumbnail?.[0]?.src;
  const title = data.title.replace(' - park4night', '').replace(' - Caramaps', '').replace(/\(\d+\)/, '').trim();

  // Intentamos sacar rating del snippet si existe (ej: "4.5/5")
  const ratingMatch = (data.snippet + title).match(/(\d[\.,]\d+)\/5/);
  const rating = ratingMatch ? ratingMatch[1] : null;

  return (
    <a href={data.link} target="_blank" rel="noopener noreferrer" className="flex bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all mt-2 h-24 no-underline group">
      {/* Imagen */}
      <div className="w-24 h-full flex-shrink-0 bg-gray-200 relative">
        {image ? (
           <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-2xl">🌲</div>
        )}
        {rating && <div className="absolute bottom-0 right-0 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md">⭐ {rating}</div>}
      </div>

      {/* Texto */}
      <div className="p-2 flex flex-col justify-between w-full">
        <div>
            <h6 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{title}</h6>
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{data.snippet}</p>
        </div>
        <div className="flex justify-end">
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Ver Ficha</span>
        </div>
      </div>
    </a>
  );
};

// --- 5. DETALLE DEL DÍA ---
const DayDetailView = ({ day }: { day: DailyPlan }) => {
  // Limpiamos el nombre de la ciudad para la búsqueda
  const city = day.to.replace('📍 Parada Táctica: ', '').split(',')[0].trim();

  return (
    <div className={`p-4 rounded-xl border-l-4 shadow-sm mb-4 ${day.isDriving ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'}`}>
       <div className="flex justify-between font-bold text-gray-700 mb-2">
          <span>{day.isDriving ? '🚗 Ruta' : '🏖️ Estancia'}</span>
          <span className="text-xs bg-white px-2 py-1 rounded">{day.date}</span>
       </div>
       <div className="text-sm mb-3">{day.from.split(',')[0]} ➝ {day.to.split(',')[0]}</div>
       
       {day.isDriving && (
         <div className="border-t border-gray-200 pt-3 mt-2">
            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Sugerencia en {city}:</h5>
            {/* Pasamos solo la ciudad, la tarjeta añade el 'site:...' */}
            <Park4NightCard city={city} />
         </div>
       )}
    </div>
  );
};

// --- 6. APP PRINCIPAL (NATIVA) ---
export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const isLoaded = useGoogleMapsScript(apiKey);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [results, setResults] = useState<TripResult>({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fechaInicio: '', origen: 'Salamanca', fechaRegreso: '', destino: 'Punta Umbria', etapas: 'Valencia', consumo: 9.0, precioGasoil: 1.75, kmMaximoDia: 400, evitarPeajes: false });

  // MAPA
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance && typeof google !== 'undefined') {
      const map = new google.maps.Map(mapRef.current, { center: CENTER_POINT, zoom: 6 });
      const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: false });
      setMapInstance(map);
      setDirectionsRenderer(renderer);
    }
  }, [isLoaded, mapInstance]);

  // CALCULO
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    
    const ds = new google.maps.DirectionsService();
    const wps = formData.etapas.split(',').filter(s=>s.trim()).map(l => ({ location: l, stopover: true }));

    try {
      const res = await ds.route({
        origin: formData.origen, destination: formData.destino, waypoints: wps,
        travelMode: 'DRIVING', avoidTolls: formData.evitarPeajes
      });
      
      const route = res.routes[0];
      const itinerary: DailyPlan[] = [];
      let day = 1;
      
      route.legs.forEach((leg: any, i: number) => {
         const end = leg.end_address.split(',')[0];
         itinerary.push({
            day: day++, date: `Día ${day-1}`, from: i===0 ? formData.origen : "Punto Intermedio",
            to: end, distance: leg.distance.value / 1000, isDriving: true
         });
         if (i === route.legs.length -1) itinerary.push({ day: day, date: `Día ${day}`, from: end, to: end, distance: 0, isDriving: false });
      });

      setResults({ totalDays: day, distanceKm: 0, totalCost: 0, dailyItinerary: itinerary, error: null });
      if (directionsRenderer) directionsRenderer.setDirections(res);

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { const {id, value} = e.target; setFormData(p => ({...p, [id]: value})); };

  if (!isLoaded) return <div className="p-10 text-center font-bold text-blue-600">Cargando Entorno de Pruebas...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
        <h1 className="text-3xl font-black text-orange-600 mb-6">🧪 Laboratorio /dormir</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-4xl mb-6">
            <form onSubmit={calculateRoute} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" id="origen" value={formData.origen} onChange={handleInput} className="p-2 border rounded" placeholder="Origen" />
                <input type="text" id="destino" value={formData.destino} onChange={handleInput} className="p-2 border rounded" placeholder="Destino" />
                <button type="submit" className="bg-blue-600 text-white font-bold rounded hover:bg-blue-700">{loading ? '...' : 'Generar Ruta de Prueba'}</button>
            </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
            {/* MAPA */}
            <div className="h-[600px] bg-gray-300 rounded-xl overflow-hidden shadow relative">
                <div ref={mapRef} style={containerStyle} />
            </div>

            {/* ITINERARIO */}
            <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                {results.dailyItinerary ? (
                    results.dailyItinerary.map((day, i) => <DayDetailView key={i} day={day} />)
                ) : (
                    <p className="text-gray-400 text-center mt-10">Dale a "Generar Ruta" para ver las tarjetas.</p>
                )}
            </div>
        </div>
    </div>
  );
}