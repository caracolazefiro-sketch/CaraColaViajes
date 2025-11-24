'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- 1. CONFIGURACIÓN Y VARIABLES GLOBALES ---
declare const google: any;

// ID de tu Buscador Personalizado (CSE)
const CX_ID = "9022e72d0fcbd4093"; 

const center = { lat: 40.416775, lng: -3.703790 }; // Madrid

// Estilos para el contenedor del mapa
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
  minHeight: '500px',
  backgroundColor: '#f3f4f6' // Color de fondo mientras carga
};

// Función segura para obtener variables de entorno
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

// --- 2. INTERFACES ---
interface DailyPlan { day: number; date: string; from: string; to: string; distance: number; isDriving: boolean; }
interface TripResult { totalDays: number | null; distanceKm: number | null; totalCost: number | null; dailyItinerary: DailyPlan[] | null; error: string | null; }

// --- 3. ICONOS SVG (Sin dependencias) ---
const IconCalendar = () => (<svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconSpinner = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

// --- 4. HOOK: CARGA GOOGLE MAPS MANUALMENTE ---
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      setIsLoaded(true); 
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Error al cargar Google Maps SDK");
    document.body.appendChild(script);
  }, [apiKey]);

  return isLoaded;
};

// --- 5. COMPONENTE: TARJETA INTELIGENTE (PARK4NIGHT) ---
const Park4NightCard = ({ query }: { query: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const apiKey = getEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
        if (!apiKey) throw new Error("No API Key");

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
        setData(null); // Aseguramos que data sea null en caso de error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [query]);

  if (loading) return <div className="animate-pulse p-4 bg-gray-100 rounded-lg h-24 w-full mt-3 flex items-center justify-center text-gray-400 text-sm">Buscando...</div>;
  
  if (!data) {
    const fallbackLink = `https://www.google.com/search?q=site:park4night.com ${query}`;
    return (
      <a href={fallbackLink} target="_blank" rel="noopener noreferrer" className="block p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 mt-3">
        <span className="text-gray-500 font-medium">🔍 Buscar en Google</span>
      </a>
    );
  }

  const image = data.pagemap?.cse_image?.[0]?.src || data.pagemap?.cse_thumbnail?.[0]?.src;
  const title = data.title ? data.title.replace(' - park4night', '').replace(' - Caramaps', '') : 'Resultado Park4Night';
  const snippet = data.snippet || 'Ver detalles en la web.';

  return (
    <a href={data.link} target="_blank" rel="noopener noreferrer" className="block group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 mt-3">
      <div className="flex h-32">
        {image ? (
          <div className="w-1/3 bg-gray-200 relative overflow-hidden">
             <img src={image} alt={title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="w-1/3 bg-blue-100 flex items-center justify-center text-3xl">🚐</div>
        )}
        <div className={`p-4 flex flex-col justify-between ${image ? 'w-2/3' : 'w-full'}`}>
          <div>
            <h5 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
              {title}
            </h5>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{snippet}</p>
          </div>
          <div className="flex items-center text-xs font-bold text-orange-500 mt-2">
            <span className="bg-orange-50 px-2 py-1 rounded-md border border-orange-100">Ver Ficha ➜</span>
          </div>
        </div>
      </div>
    </a>
  );
};

// --- 6. COMPONENTE: DETALLE DEL DÍA ---
const DayDetailView: React.FC<{ day: any }> = ({ day }) => {
  const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split(',')[0].trim();
  
  return (
    <div className={`p-6 rounded-xl h-full border-l-4 shadow-sm transition-all ${day.isDriving ? 'bg-blue-50 border-blue-600' : 'bg-orange-50 border-orange-600'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className={`text-2xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
          {day.isDriving ? '🚙 Etapa de Ruta' : '🏖️ Día de Relax'}
        </h4>
        <span className="text-sm bg-white px-2 py-1 rounded border font-mono text-gray-600">{day.date}</span>
      </div>
      
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
         <span className="truncate max-w-[40%]">{day.from}</span>
         <span className="text-gray-400">➝</span>
         <span className="truncate max-w-[40%]">{day.to}</span>
      </div>

      {day.isDriving && (
        <p className="text-3xl font-extrabold text-green-700 mb-6">
          {typeof day.distance === 'number' ? day.distance.toFixed(0) : 0} <span className="text-sm font-normal text-gray-500">km hoy</span>
        </p>
      )}

      {day.isDriving && day.distance > 0 && (
        <div className="pt-4 border-t border-dashed border-gray-300 mt-2">
          <h5 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
            <span>🌙</span> Pernocta Sugerida en {rawCityName}:
          </h5>
          <Park4NightCard query={`área autocaravana ${rawCityName}`} />
        </div>
      )}
      
      {!day.isDriving && (
         <p className="text-lg text-gray-700 italic border-l-2 border-orange-300 pl-4">
           "Disfruta del entorno, visita {day.to} y recarga energías."
         </p>
      )}
    </div>
  );
};

// --- 7. APP PRINCIPAL ---
export default function Home() {
  const apiKey = getEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
  const isLoaded = useGoogleMapsScript(apiKey);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const markersRef = useRef<any[]>([]);

  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [mapBounds, setMapBounds] = useState<any>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [tacticalMarkers, setTacticalMarkers] = useState<any[]>([]);
  const [results, setResults] = useState<TripResult>({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });

  const [formData, setFormData] = useState({
    fechaInicio: '', origen: 'Salamanca', fechaRegreso: '', destino: 'Punta Umbria',
    etapas: 'Valencia', consumo: 9.0, precioGasoil: 1.75, kmMaximoDia: 400, evitarPeajes: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('caracola_data');
        if (saved) { try { setFormData(JSON.parse(saved)); } catch(e){} }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('caracola_data', JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance && typeof google !== 'undefined') {
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: { strokeColor: "#2563EB", strokeWeight: 5 }
      });

      setMapInstance(map);
      setDirectionsRenderer(renderer);
    }
  }, [isLoaded, mapInstance]);

  useEffect(() => {
    if (directionsRenderer && directionsResponse) {
      directionsRenderer.setDirections(directionsResponse);
    }
  }, [directionsResponse, directionsRenderer]);

  useEffect(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (mapInstance && tacticalMarkers.length > 0) {
      tacticalMarkers.forEach(p => {
        const marker = new google.maps.Marker({
          position: p,
          map: mapInstance,
          title: p.title,
          label: { text: "P", color: "white", fontWeight: "bold" }
        });
        markersRef.current.push(marker);
      });
    }
  }, [tacticalMarkers, mapInstance]);

  useEffect(() => {
      if (mapInstance && mapBounds) { setTimeout(() => mapInstance.fitBounds(mapBounds), 500); }
  }, [mapInstance, mapBounds]);

  const geocodeCity = async (cityName: string) => {
    if (typeof google === 'undefined') return null;
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ address: cityName });
      if (res.results.length > 0) return res.results[0].geometry.location.toJSON();
    } catch (e) {} return null;
  };

  const getCityNameForStop = async (lat: number, lng: number) => {
    if (typeof google === 'undefined') return "Parada";
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ location: { lat, lng } });
      if (res.results[0]) {
        const c = res.results[0].address_components.find((x:any)=>x.types.includes("locality")) || res.results[0].address_components.find((x:any)=>x.types.includes("administrative_area_level_2"));
        return c ? c.long_name : "Punto";
      }
    } catch(e) {} return "Parada en Ruta";
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary) return;
    const plan = results.dailyItinerary[idx];
    const [start, end] = await Promise.all([geocodeCity(plan.from), geocodeCity(plan.to)]);
    if (start && end) {
      const b = new google.maps.LatLngBounds();
      b.extend(start); b.extend(end);
      setMapBounds(b);
    }
    setSelectedDayIndex(idx);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: parseFloat(e.target.value) }));
  };

  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setDirectionsResponse(null); setResults({totalDays:null, dailyItinerary:null, error:null}); setTacticalMarkers([]); setSelectedDayIndex(null);

    const ds = new google.maps.DirectionsService();
    const wps = formData.etapas.split(',').filter(s=>s.trim().length>0).map(l => ({ location: l, stopover: true }));

    try {
      const res = await ds.route({
        origin: formData.origen, destination: formData.destino, waypoints: wps,
        travelMode: 'DRIVING', avoidTolls: formData.evitarPeajes
      });
      setDirectionsResponse(res);

      const route = res.routes[0];
      const itinerary: any[] = [];
      const newMarkers: any[] = [];
      let day = 1;
      let date = formData.fechaInicio ? new Date(formData.fechaInicio) : new Date();
      const maxM = formData.kmMaximoDia * 1000;
      const nextDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate()+1); return n; };
      const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

      let legStart = formData.origen;
      let totalDist = 0;

      for (let i=0; i<route.legs.length; i++) {
        const leg = route.legs[i];
        let legAcc = 0; let segStart = legStart;
        let pts = [];
        leg.steps.forEach((s:any) => { if(s.path) pts = pts.concat(s.path); });

        for (let j=0; j<pts.length-1; j++) {
          const d = google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j+1]);
          if (legAcc + d > maxM) {
            const lat = pts[j].lat(); const lng = pts[j+1].lng();
            const city = await getCityNameForStop(lat, lng);
            const title = `📍 Parada Táctica: ${city}`;
            itinerary.push({ day: day++, date: fmt(date), from: segStart, to: title, distance: (legAcc+d)/1000, isDriving: true });
            newMarkers.push({ lat, lng, title });
            date = nextDay(date); legAcc = 0; segStart = title;
          } else { legAcc += d; }
        }
        
        let endName = i === route.legs.length-1 ? formData.destino : "Punto Intermedio";
        if (leg.end_address) endName = leg.end_address.split(',')[0].replace(/\d{5}/, '').trim();

        if (legAcc > 0 || segStart !== endName) {
          itinerary.push({ day, date: fmt(date), from: segStart, to: endName, distance: legAcc/1000, isDriving: true });
          legStart = endName;
          if (i < route.legs.length-1) { day++; date = nextDay(date); }
        }
        totalDist += (leg.distance as any).value;
      }

      const ret = formData.fechaRegreso ? new Date(formData.fechaRegreso) : null;
      if (ret) {
        const stay = Math.ceil((ret.getTime() - date.getTime())/(1000*3600*24));
        for(let k=0; k<stay; k++) { day++; date = nextDay(date); itinerary.push({ day, date: fmt(date), from: formData.destino, to: formData.destino, distance: 0, isDriving: false }); }
      }

      setTacticalMarkers(newMarkers);
      setResults({ totalDays: day, distanceKm: totalDist/1000, totalCost: (totalDist/100000)*formData.consumo*formData.precioGasoil, dailyItinerary: itinerary, error: null });
    } catch (e) { setResults(p => ({...p, error: "No se pudo calcular. Revisa las ciudades."})); }
    finally { setLoading(false); }
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center text-blue-600 font-bold animate-pulse">Cargando Mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-sm">CaraCola 🐌 MODO TEST</h1>
            <p className="text-gray-500 text-lg">Prueba de Integración: Custom Search & Park4Night (Versión Nativa)</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="bg-orange-500 px-6 py-4"><h2 className="text-white font-bold text-lg">⚙️ Configuración</h2></div>
            <form onSubmit={calculateRoute} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Inicio</label><input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Regreso</label><input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Origen</label><input type="text" id="origen" value={formData.origen} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Destino</label><input type="text" id="destino" value={formData.destino} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    <div className="md:col-span-2 lg:col-span-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <label className="flex items-center gap-2 font-bold text-orange-800 mb-2"><input type="checkbox" checked={showWaypoints} onChange={() => setShowWaypoints(!showWaypoints)} /> ➕ Añadir Paradas</label>
                        {showWaypoints && <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} placeholder="Ej: Valencia, Madrid" className="w-full p-3 bg-white border border-orange-200 rounded-lg mt-1"/>}
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between"><label className="font-bold">🛣️ Ritmo</label><span className="bg-orange-100 text-orange-800 font-bold px-2 rounded">{formData.kmMaximoDia} km</span></div>
                        <input type="range" id="kmMaximoDia" min="100" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleSliderChange} className="w-full accent-orange-500"/>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between"><label className="font-bold">⛽ Consumo</label><span className="bg-purple-100 text-purple-800 font-bold px-2 rounded">{formData.consumo} L</span></div>
                        <input type="range" id="consumo" min="5" max="25" step="0.5" value={formData.consumo} onChange={handleSliderChange} className="w-full accent-purple-600"/>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Precio Gasoil</label><input type="number" id="precioGasoil" value={formData.precioGasoil} onChange={handleChange} className="w-full p-3 border rounded-lg" step="0.01"/></div>
                    <div className="flex items-end"><label className="flex items-center gap-2 font-bold cursor-pointer p-3 border rounded-lg w-full"><input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange} /> Evitar Peajes</label></div>
                    <div className="md:col-span-2 lg:col-span-2 flex items-end"><button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 shadow-lg">{loading ? <><IconSpinner /> ...</> : '🚀 Calcular'}</button></div>
                </div>
            </form>
        </div>

        {results.totalCost !== null && (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconCalendar /><div><p className="text-xl font-bold">{results.totalDays}</p><p className="text-xs text-gray-500">Días</p></div></div>
                    <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconMap /><div><p className="text-xl font-bold">{results.distanceKm?.toFixed(0)}</p><p className="text-xs text-gray-500">Km</p></div></div>
                    <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconFuel /><div><p className="text-xl font-bold">{(results.distanceKm! / 100 * formData.consumo).toFixed(0)}</p><p className="text-xs text-gray-500">L</p></div></div>
                    <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconWallet /><div><p className="text-xl font-bold text-green-600">{results.totalCost?.toFixed(0)} €</p><p className="text-xs text-gray-500">Coste</p></div></div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow border p-4 overflow-x-auto flex gap-2">
                        <button onClick={() => {setSelectedDayIndex(null); setMapBounds(null);}} className={`px-4 py-2 rounded-lg font-bold border ${selectedDayIndex === null ? 'bg-orange-600 text-white' : 'bg-white'}`}>Global</button>
                        {results.dailyItinerary?.map((day, i) => (
                            <button key={i} onClick={() => focusMapOnStage(i)} className={`px-4 py-2 rounded-lg font-bold border whitespace-nowrap ${selectedDayIndex === i ? (day.isDriving ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white') : 'bg-white'}`}>
                                {day.isDriving ? '🚗' : '🏖️'} Día {day.day}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative">
                             {/* CONTENEDOR DEL MAPA NATIVO */}
                            <div ref={mapRef} style={containerStyle} />
                        </div>
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow border h-[500px] overflow-y-auto p-4">
                            {selectedDayIndex === null ? (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg mb-4 text-center">Itinerario</h4>
                                    {results.dailyItinerary?.filter(d=>d.isDriving).map((d, i) => (
                                        <div key={i} className="p-3 border rounded hover:bg-gray-50">
                                            <p className="font-bold text-blue-700">Día {d.day}</p>
                                            <p className="text-sm">{d.from.split(',')[0]} ➝ {d.to.replace('📍 Parada Táctica: ', '').split(',')[0]}</p>
                                            <p className="text-xs text-gray-500 text-right">{d.distance.toFixed(0)} km</p>
                                        </div>
                                    ))}
                                </div>
                            ) : ( <DayDetailView day={results.dailyItinerary![selectedDayIndex]} /> )}
                        </div>
                    </div>
                </div>
            </div>
        )}
        {results.error && <div className="p-4 bg-red-100 text-red-700 font-bold text-center rounded">{results.error}</div>}
      </div>
    </main>
  );
}