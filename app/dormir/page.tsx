'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- 1. CONFIGURACIÓN ---
// Declaración para evitar errores de TypeScript con 'google' global
declare const google: any;

const CX_ID = "9022e72d0fcbd4093"; // Tu Buscador CSE
const MIN_QUALITY_SCORE = 3.75; // Nota de corte para mostrar tarjetas

// Coordenadas iniciales (Madrid)
const CENTER_POINT = { lat: 40.416775, lng: -3.703790 };

// Estilos del contenedor del mapa
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
  minHeight: '600px',
  backgroundColor: '#e5e7eb'
};

// --- 2. INTERFACES ---
interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; 
  displayRating: string; 
  type: string;
}

interface DailyPlan { 
    day: number; 
    date: string; 
    from: string; 
    to: string; 
    distance: number; 
    isDriving: boolean; 
    // Coordenadas exactas para el enlace de P4N
    coordinates?: { lat: number, lng: number }; 
}

interface TripResult { 
    totalDays: number | null; 
    distanceKm: number | null; 
    totalCost: number | null; 
    dailyItinerary: DailyPlan[] | null; 
    error: string | null; 
}

// --- 3. ICONOS SVG ---
const IconCalendar = () => (<svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconSpinner = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

// --- 4. HOOK DE CARGA NATIVA (EL SALVAVIDAS) ---
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    
    // Comprobamos si ya está cargado
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    // Comprobamos si el script ya está insertado
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // Pequeño polling por si el script existe pero no ha terminado de cargar
      const check = setInterval(() => {
          if ((window as any).google) {
              setIsLoaded(true);
              clearInterval(check);
          }
      }, 200);
      return;
    }

    // Inyección manual del script
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

// --- 5. COMPONENTE: TARJETA PARK4NIGHT (INTEGRADA) ---
const SmartSpotCard = ({ city, coordinates }: { city: string, coordinates?: { lat: number, lng: number } }) => {
  const [bestSpot, setBestSpot] = useState<SpotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!city) return;

    const fetchBestSpot = async () => {
      setLoading(true);
      setIsFallback(false);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        if (!apiKey) return;

        // 1. BÚSQUEDA DE CALIDAD (site:park4night.com + ciudad)
        const query = `site:park4night.com "${city}"`; 
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.items || json.items.length === 0) throw new Error("No results");

        // 2. PROCESAMIENTO Y RANKING (Algoritmo v4)
        const candidates: SpotData[] = json.items.map((item: any) => {
             let rating = 0;
             const text = (item.title || "") + " " + (item.snippet || "");
             
             const match = text.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
             if (match) rating = parseFloat(match[1].replace(',', '.'));
             else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
                 rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
             }

             let type = "Spot";
             const lower = text.toLowerCase();
             if (lower.includes("área") || lower.includes("area")) type = "Área AC";
             else if (lower.includes("parking")) type = "Parking";
             else if (lower.includes("camping")) type = "Camping";

             const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
             const title = (item.title || "").replace(/ - park4night/i, '').replace(/\(\d+\)/, '').trim();
             
             // Forzar enlace español
             let link = item.link || "";
             link = link.replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

             return { title, link, snippet: item.snippet, image: img, rating, displayRating: rating.toFixed(1), type };
        });

        // 3. SELECCIÓN DEL MEJOR (Solo > 3.75)
        const topPick = candidates
            .filter(s => s.rating >= MIN_QUALITY_SCORE)
            .sort((a, b) => b.rating - a.rating)[0];

        if (topPick) {
            setBestSpot(topPick);
        } else {
            throw new Error("Low quality");
        }

      } catch (e) {
        // FALLBACK: URL PRECISA CON COORDENADAS
        setIsFallback(true);
        let fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}`;
        if (coordinates) {
             fallbackUrl += `&lat=${coordinates.lat}&lng=${coordinates.lng}&z=14`;
        }
        
        setBestSpot({
            title: `Ver mapa de ${city}`,
            link: fallbackUrl,
            snippet: "Explora todas las opciones disponibles en el mapa interactivo.",
            image: null, rating: 0, displayRating: "", type: "Búsqueda Manual"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBestSpot();
  }, [city, coordinates]);

  if (loading) return <div className="animate-pulse h-28 bg-gray-100 rounded-xl border flex items-center justify-center text-xs text-gray-400 mt-3">Analizando...</div>;
  if (!bestSpot) return null;

  const badgeColor = bestSpot.rating >= 4.5 ? "bg-green-600" : "bg-green-500";
  const isManual = bestSpot.type === "Búsqueda Manual";

  return (
    <a href={bestSpot.link} target="_blank" rel="noopener noreferrer" className={`flex bg-white border-2 ${isManual ? 'border-blue-200' : 'border-gray-200'} rounded-xl overflow-hidden hover:shadow-lg transition-all mt-3 h-28 no-underline group`}>
       <div className={`w-28 flex-shrink-0 relative ${isManual ? 'bg-blue-50' : 'bg-gray-200'}`}>
          {bestSpot.image && !isManual ? (
              <img src={bestSpot.image} alt="spot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">{isManual ? '🌍' : '🌲'}</div>
          )}
          {!isManual && bestSpot.rating > 0 && <div className={`absolute bottom-0 right-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-lg ${badgeColor}`}>⭐ {bestSpot.displayRating}</div>}
       </div>
       <div className="p-3 flex flex-col justify-between w-full overflow-hidden">
           <div>
               <h5 className={`font-bold text-sm line-clamp-1 ${isManual ? 'text-blue-700' : 'text-gray-800'}`}>{bestSpot.title}</h5>
               <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                   {bestSpot.snippet.replace(/(\d[\.,]\d+\/5)/g, '')}
               </p>
           </div>
           <div className="flex justify-end">
               <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${isManual ? 'bg-blue-600 text-white border-blue-600' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                   {isManual ? 'Buscar en Park4Night ➜' : 'Ver Ficha ➜'}
               </span>
           </div>
       </div>
    </a>
  );
};

// --- 6. COMPONENTE DETALLE DEL DÍA ---
const DayDetailView: React.FC<{ day: DailyPlan }> = ({ day }) => {
    const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split(',')[0].trim();
    
    return (
        <div className={`p-4 rounded-xl space-y-4 h-full transition-all ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
            <div className="flex justify-between items-center">
                <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
                    {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
                </h4>
                <span className="text-xs bg-white px-2 py-1 rounded border font-mono text-gray-600">{day.date}</span>
            </div>
            
            <p className="text-md font-semibold text-gray-800">
                {day.from.split(',')[0]} <span className="text-gray-400">➝</span> {day.to.split(',')[0]}
            </p>
            {day.isDriving && (
                <p className="text-xl font-extrabold text-green-700">
                    {day.distance.toFixed(0)} km
                </p>
            )}

            {day.isDriving && day.distance > 0 && (
                <div className="pt-3 border-t border-dashed border-gray-300">
                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <span className="text-lg">🌙</span> Recomendación en {rawCityName}:
                    </h5>
                    <SmartSpotCard city={rawCityName} coordinates={day.coordinates} />
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

// --- 7. APP PRINCIPAL (NATIVA) ---
export default function Home() {
  // Uso de variable de entorno segura
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const isLoaded = useGoogleMapsScript(apiKey);
  
  // Referencias Nativas
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const markersRef = useRef<any[]>([]);

  // Estados
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

  // Persistencia
  useEffect(() => {
    const saved = localStorage.getItem('caracola_data');
    if (saved) { try { setFormData(JSON.parse(saved)); } catch(e){} }
  }, []);

  useEffect(() => {
    localStorage.setItem('caracola_data', JSON.stringify(formData));
  }, [formData]);

  // Inicializar Mapa Nativo
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance && typeof google !== 'undefined') {
      const map = new google.maps.Map(mapRef.current, {
        center: CENTER_POINT,
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

  // Actualizar Mapa
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

  // Zoom Automático
  useEffect(() => {
      if (mapInstance && mapBounds) { setTimeout(() => mapInstance.fitBounds(mapBounds), 500); }
  }, [mapInstance, mapBounds]);

  // Helpers Geocoding
  const geocodeCity = async (cityName: string) => {
    if (typeof google === 'undefined') return null;
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ address: cityName });
      if (res.results.length > 0) return res.results[0].geometry.location.toJSON();
    } catch (e) {} return null;
  };

  // Helper para obtener nombre Y coordenadas de un punto
  const getStopInfo = async (lat: number, lng: number) => {
    if (typeof google === 'undefined') return { name: "Parada", coords: { lat, lng } };
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ location: { lat, lng } });
      if (res.results.length > 0) {
        const c = res.results[0].address_components.find((x:any)=>x.types.includes("locality")) || res.results[0].address_components.find((x:any)=>x.types.includes("administrative_area_level_2"));
        // Devolvemos nombre y coordenadas originales para mayor precisión
        return { name: c ? c.long_name : "Punto", coords: { lat, lng } };
      }
    } catch(e) {} 
    return { name: "Parada", coords: { lat, lng } };
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary) return;
    const plan = results.dailyItinerary[idx];
    let start = plan.coordinates;
    let end = results.dailyItinerary[idx+1]?.coordinates;

    if (!start) start = await geocodeCity(plan.from);
    if (!end) end = await geocodeCity(plan.to);

    if (start && end) {
      const b = new google.maps.LatLngBounds();
      b.extend(start); b.extend(end);
      if (mapInstance) mapInstance.fitBounds(b);
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

  // --- CÁLCULO DE RUTA (CON COORDENADAS) ---
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setDirectionsResponse(null); setResults({totalDays:null, distanceKm:null, totalCost:null, dailyItinerary:null, error:null}); setTacticalMarkers([]); setSelectedDayIndex(null);

    const ds = new google.maps.DirectionsService();
    const wps = formData.etapas.split(',').filter(s=>s.trim().length>0).map(l => ({ location: l, stopover: true }));

    try {
      const res = await ds.route({
        origin: formData.origen, destination: formData.destino, waypoints: wps,
        travelMode: google.maps.TravelMode.DRIVING, avoidTolls: formData.evitarPeajes,
      });
      setDirectionsResponse(res);

      const route = res.routes[0];
      const itinerary: DailyPlan[] = [];
      const newTacticalMarkers: any[] = [];
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
        let pts: any[] = [];
        leg.steps.forEach((s:any) => { if(s.path) pts = pts.concat(s.path); });

        for (let j=0; j<pts.length-1; j++) {
            const d = google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j+1]);
            if (legAcc + d > maxM) {
                const lat = pts[j].lat(); const lng = pts[j+1].lng();
                // Obtenemos info detallada y coordenadas
                const info = await getStopInfo(lat, lng);
                const title = `📍 Parada Táctica: ${info.name}`;
                
                itinerary.push({
                    day: day++, date: fmt(date), from: segStart, to: title,
                    distance: (legAcc+d)/1000, isDriving: true,
                    coordinates: info.coords // Guardamos coords para P4N
                });
                newTacticalMarkers.push({ lat, lng, title });
                date = nextDay(date); legAcc = 0; segStart = title;
            } else { legAcc += d; }
        }
        
        let endName = i === route.legs.length-1 ? formData.destino : "Punto Intermedio";
        if(leg.end_address) endName = leg.end_address.split(',')[0].replace(/\d{5}/, '').trim();
        const endCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };

        if (legAcc > 0 || segStart !== endName) {
            itinerary.push({
                day, date: fmt(date), from: segStart, to: endName,
                distance: legAcc/1000, isDriving: true,
                coordinates: endCoords // Guardamos coords para P4N
            });
            legStart = endName;
            if(i < route.legs.length-1) { day++; date = nextDay(date); }
        }
        totalDist += leg.distance.value;
      }

      const ret = formData.fechaRegreso ? new Date(formData.fechaRegreso) : null;
      if (ret) {
          const stay = Math.ceil((ret.getTime() - date.getTime())/(1000*3600*24));
          for(let k=0; k<stay; k++) { day++; date = nextDay(date); itinerary.push({ day, date: fmt(date), from: formData.destino, to: formData.destino, distance: 0, isDriving: false }); }
      }

      setTacticalMarkers(newTacticalMarkers);
      setResults({ totalDays: day, distanceKm: totalDist/1000, totalCost: (totalDist/100000)*formData.consumo*formData.precioGasoil, dailyItinerary: itinerary, error: null });

    } catch (error: any) { console.error(error); setResults(prev => ({...prev, error: "Error al calcular ruta."})); } finally { setLoading(false); }
  };

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-gray-50 text-blue-600 font-bold text-xl animate-pulse">Cargando Mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* CABECERA */}
        <div className="text-center space-y-2">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-500 drop-shadow-sm">
                CaraCola Viajes 🐌
            </h1>
            <p className="text-gray-500 text-lg">Planifica tu aventura kilómetro a kilómetro</p>
        </div>
        
        {/* FORMULARIO */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">⚙️ Configuración del Viaje</h2>
            </div>
            
            <form onSubmit={calculateRoute} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Inicio</label><input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Regreso</label><input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Origen</label><input type="text" id="origen" value={formData.origen} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Destino</label><input type="text" id="destino" value={formData.destino} onChange={handleChange} className="w-full p-3 border rounded-lg" required/></div>
                    
                    <div className="md:col-span-2 lg:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="flex items-center gap-2 font-bold text-blue-800 mb-2"><input type="checkbox" checked={showWaypoints} onChange={() => setShowWaypoints(!showWaypoints)} /> ➕ Añadir Paradas</label>
                        {showWaypoints && <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} placeholder="Ej: Valencia, Madrid" className="w-full p-3 bg-white border border-blue-200 rounded-lg mt-1"/>}
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between"><label className="font-bold text-gray-700">🛣️ Ritmo</label><span className="bg-blue-100 text-blue-800 font-bold px-2 rounded">{formData.kmMaximoDia} km</span></div>
                        <input type="range" id="kmMaximoDia" min="100" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleSliderChange} className="w-full accent-blue-600"/>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between"><label className="font-bold text-gray-700">⛽ Consumo</label><span className="bg-purple-100 text-purple-800 font-bold px-2 rounded">{formData.consumo} L</span></div>
                        <input type="range" id="consumo" min="5" max="25" step="0.5" value={formData.consumo} onChange={handleSliderChange} className="w-full accent-purple-600"/>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Precio Gasoil</label><input type="number" id="precioGasoil" value={formData.precioGasoil} onChange={handleChange} className="w-full p-3 border rounded-lg" step="0.01"/></div>
                    <div className="flex items-end"><label className="flex items-center gap-2 font-bold cursor-pointer p-3 border rounded-lg w-full"><input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange} /> Evitar Peajes</label></div>
                    <div className="md:col-span-2 lg:col-span-2 flex items-end"><button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:shadow-lg">{loading ? <><IconSpinner /> ...</> : '🚀 Calcular'}</button></div>
                </div>
            </form>
        </div>

        {/* RESULTADOS */}
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
                        <button onClick={() => {setSelectedDayIndex(null); if(mapInstance) mapInstance.fitBounds(new google.maps.LatLngBounds());}} className={`px-4 py-2 rounded-lg font-bold text-sm border ${selectedDayIndex === null ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>🌎 General</button>
                        {results.dailyItinerary?.map((day, index) => (
                            <button key={index} onClick={() => focusMapOnStage(index)} className={`px-4 py-2 rounded-lg font-bold text-sm border whitespace-nowrap ${selectedDayIndex === index ? (day.isDriving ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white') : 'bg-white'}`}>
                                <span className="mr-1">{day.isDriving ? '🚗' : '🏖️'}</span> Día {day.day}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-2xl shadow-lg border-4 border-white relative overflow-hidden">
                            {/* MAPA NATIVO */}
                            <div ref={mapRef} style={containerStyle} />
                        </div>
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow border h-[500px] overflow-y-auto p-4">
                            {selectedDayIndex === null ? (
                                <div className="text-center pt-8">
                                    <h4 className="text-2xl font-extrabold text-blue-700 mb-2">Itinerario</h4>
                                    <p className="text-gray-500 mb-4">Selecciona un día para ver detalles.</p>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 text-xs font-bold uppercase text-gray-600"><tr><th className="px-4 py-2">Día</th><th className="px-4 py-2 text-right">Km</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">{results.dailyItinerary?.filter(d => d.isDriving).map((d, i) => (
                                            <tr key={i} className="hover:bg-blue-50 cursor-pointer" onClick={() => focusMapOnStage(results.dailyItinerary!.indexOf(d))}>
                                                <td className="px-4 py-2 font-medium">Día {d.day}</td><td className="px-4 py-2 text-right font-mono">{d.distance.toFixed(0)}</td>
                                            </tr>
                                        ))}</tbody></table>
                                    </div>
                                </div>
                            ) : (
                                <DayDetailView day={results.dailyItinerary![selectedDayIndex]} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {results.error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold text-center">⚠️ {results.error}</div>}
      </div>
    </main>
  );
}
