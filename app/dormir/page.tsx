'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURACIÓN ---
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Tu clave (funciona)
const CX_ID = "9022e72d0fcbd4093";
const MIN_QUALITY_SCORE = 3.75;
const CENTER_POINT = { lat: 40.416775, lng: -3.703790 };

// Type guards
declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

// --- HOOK INFALIBLE (nueva versión: poller + retry + logs) ---
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Clave API faltante');
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadScript = () => {
      // Ya cargado?
      if (window.google?.maps) {
        console.log('✅ Google Maps ya cargado');
        setIsLoaded(true);
        return true;
      }

      // Script ya existe?
      const existing = document.getElementById('google-maps-script');
      if (existing) {
        console.log('⏳ Esperando script existente...');
        intervalId = setInterval(() => {
          if (window.google?.maps) {
            console.log('✅ Script existente cargado');
            setIsLoaded(true);
            if (intervalId) clearInterval(intervalId);
            return;
          }
        }, 200);
        return false;
      }

      // Inyectar nuevo script
      console.log('🚀 Inyectando script Google Maps...');
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap&v=3.exp&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = () => {
        console.log('🎉 Callback initMap disparado');
        setIsLoaded(true);
      };

      // Fallback: poller si callback falla (común en Next.js)
      intervalId = setInterval(() => {
        if (window.google?.maps) {
          console.log('✅ Poller detectó carga');
          setIsLoaded(true);
          if (intervalId) clearInterval(intervalId);
        }
      }, 500);

      // Timeout: retry completo si no carga en 15s
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout: retrying script load');
        if (intervalId) clearInterval(intervalId);
        document.head.removeChild(script);
        loadScript(); // Retry
      }, 15000);

      return false;
    };

    loadScript();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      delete (window as any).initMap;
    };
  }, [apiKey]);

  return { isLoaded, error };
};

// --- ICONOS (simplificados para evitar issues con emojis en algunos browsers) ---
const IconCalendar = () => <span className="text-2xl mr-2">📅</span>;
const IconMap = () => <span className="text-2xl mr-2">🗺️</span>;
const IconFuel = () => <span className="text-2xl mr-2">⛽</span>;
const IconWallet = () => <span className="text-2xl mr-2">💶</span>;

// --- INTERFACES (sin cambios) ---
interface SpotData {
  title: string; link: string; snippet: string; image: string | null;
  rating: number; displayRating: string; type: string;
}

interface DailyPlan {
  day: number; date: string; from: string; to: string;
  distance: number; isDriving: boolean;
  coordinates?: { lat: number; lng: number };
}

interface TripResult {
  totalDays: number | null; distanceKm: number | null; totalCost: number | null;
  dailyItinerary: DailyPlan[] | null; error: string | null;
}

// --- SMART SPOT CARD (sin cambios) ---
const SmartSpotCard = ({ city, coordinates }: { city: string; coordinates?: { lat: number; lng: number } }) => {
  const [bestSpot, setBestSpot] = useState<SpotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    const fetchBestSpot = async () => {
      setLoading(true);
      try {
        const query = `site:park4night.com "${city}"`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('CSE API error');
        const json = await res.json();

        if (!json.items?.length) throw new Error("No results");

        const candidates: SpotData[] = json.items.map((item: any) => {
          let rating = 0;
          const text = `${item.title || ""} ${item.snippet || ""}`;
          const match = text.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
          if (match) rating = parseFloat(match[1].replace(',', '.'));
          else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
            rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
          }
          if (isNaN(rating)) rating = 0;

          const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
          const title = (item.title || "").replace(/ - park4night/i, '').replace(/\(\d+\)/, '').trim();
          let link = (item.link || "").replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

          return { title, link, snippet: item.snippet || "", image: img, rating, displayRating: rating.toFixed(1), type: "Spot" };
        });

        const topPick = candidates
          .filter(s => s.rating >= MIN_QUALITY_SCORE)
          .sort((a, b) => b.rating - a.rating)[0];

        if (topPick) {
          setBestSpot(topPick);
        } else {
          throw new Error("Low quality");
        }
      } catch (e) {
        let fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}`;
        if (coordinates) fallbackUrl += `&lat=${coordinates.lat}&lng=${coordinates.lng}&z=14`;
        setBestSpot({
          title: `Explorar mapa de ${city}`,
          link: fallbackUrl,
          snippet: "Ver todas las opciones disponibles en el mapa interactivo.",
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
               <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">{bestSpot.snippet.replace(/(\d[\.,]\d+\/5)/g, '')}</p>
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

// --- VISTA DETALLE DEL DÍA (sin cambios) ---
const DayDetailView = ({ day }: { day: DailyPlan }) => {
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
            
            {day.isDriving && typeof day.distance === 'number' && (
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
                   "Disfruta del entorno, visita {rawCityName} y recarga energías."
                 </p>
            )}
        </div>
    );
};

// --- APP PRINCIPAL ---
export default function Home() {
  const { isLoaded, error: loadError } = useGoogleMapsScript(API_KEY);
  
  // Refs y Estados
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [tacticalMarkers, setTacticalMarkers] = useState<any[]>([]);
  const [results, setResults] = useState<TripResult>({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });

  const [formData, setFormData] = useState({
    fechaInicio: '', origen: 'Salamanca', fechaRegreso: '', destino: 'Punta Umbria',
    etapas: 'Valencia', consumo: 9.0, precioGasoil: 1.75, kmMaximoDia: 400, evitarPeajes: false,
  });

  // Persistencia (sin cambios)
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

  // Inicializar Mapa (con retry en resize)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstance) return;

    console.log('🗺️ Inicializando mapa...');
    const map = new (window.google.maps.Map)(mapRef.current, {
      center: CENTER_POINT, zoom: 6,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    const renderer = new (window.google.maps.DirectionsRenderer)({ 
        map, 
        suppressMarkers: false,
        polylineOptions: { strokeColor: "#EA580C", strokeWeight: 5 }
    });
    setMapInstance(map);
    setDirectionsRenderer(renderer);

    // Forzar resize después de mount
    setTimeout(() => {
      if (window.google) window.google.maps.event.trigger(map, 'resize');
      console.log('🔄 Resize forzado');
    }, 300);
  }, [isLoaded, mapInstance]);

  // Actualizar Ruta (sin cambios)
  useEffect(() => {
    if (directionsRenderer && directionsResponse) {
        directionsRenderer.setDirections(directionsResponse);
    }
  }, [directionsResponse, directionsRenderer]);

  // Actualizar Marcadores P (sin cambios, con fix de position)
  useEffect(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (mapInstance && tacticalMarkers.length > 0) {
      tacticalMarkers.forEach(p => {
        const marker = new (window.google.maps.Marker)({
          position: { lat: p.lat, lng: p.lng }, map: mapInstance, title: p.title,
          label: { text: "P", color: "white", fontWeight: "bold" }
        });
        markersRef.current.push(marker);
      });
    }
  }, [tacticalMarkers, mapInstance]);

  // Helpers (con window.google check)
  const geocodeCity = async (cityName: string) => {
    if (!window.google) return null;
    const geocoder = new window.google.maps.Geocoder();
    try {
      const res = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: cityName }, (results: any, status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK) resolve({ results });
          else reject(status);
        });
      });
      if ((res as any).results.length > 0) return (res as any).results[0].geometry.location.toJSON();
    } catch (e) {} 
    return null;
  };

  const getStopInfo = async (lat: number, lng: number) => {
    if (!window.google) return { name: "Parada", coords: { lat, lng } };
    const geocoder = new window.google.maps.Geocoder();
    try {
      const res = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK) resolve({ results });
          else reject(status);
        });
      });
      if ((res as any).results.length > 0) {
        const c = (res as any).results[0].address_components.find((x: any) => x.types.includes("locality")) || (res as any).results[0].address_components.find((x: any) => x.types.includes("administrative_area_level_2"));
        return { name: c ? c.long_name : "Punto", coords: { lat, lng } };
      }
    } catch(e) {} 
    return { name: "Parada", coords: { lat, lng } };
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary || !mapInstance) return;
    const plan = results.dailyItinerary[idx];
    let start = plan.coordinates || await geocodeCity(plan.from);
    let end = results.dailyItinerary[idx+1]?.coordinates || await geocodeCity(plan.to);

    if (start && end) { 
        const b = new window.google.maps.LatLngBounds(); 
        b.extend(start); 
        b.extend(end); 
        mapInstance.fitBounds(b); 
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

  // --- CALCULO DE RUTA (con window.google checks y interpolación) ---
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !window.google) {
      setResults(prev => ({...prev, error: "Mapas no cargados aún. Espera 10s y reintenta."}));
      return;
    }
    setLoading(true); 
    setDirectionsResponse(null); 
    setResults({totalDays:null, distanceKm:null, totalCost:null, dailyItinerary:null, error:null}); 
    setTacticalMarkers([]); 
    setSelectedDayIndex(null);

    const ds = new window.google.maps.DirectionsService();
    const wps = formData.etapas.split(',').filter(s=>s.trim().length>0).map(l => ({ location: l.trim(), stopover: true }));

    try {
      const res = await new Promise((resolve, reject) => {
        ds.route({
          origin: formData.origen, destination: formData.destino, waypoints: wps,
          travelMode: window.google.maps.TravelMode.DRIVING, avoidTolls: formData.evitarPeajes,
        }, (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK) resolve(result);
          else reject(status);
        });
      });
      
      setDirectionsResponse(res);

      const route = (res as any).routes[0];
      const itinerary: DailyPlan[] = [];
      const newTacticalMarkers: any[] = [];
      let day = 1;
      let date = formData.fechaInicio ? new Date(formData.fechaInicio) : new Date();
      const maxM = formData.kmMaximoDia * 1000;
      const nextDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate()+1); return n; };
      const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

      let legStart = formData.origen;
      let totalDist = 0;

      for (let i=0; i<route.legs.length; i++) {
        const leg = route.legs[i];
        let legAcc = 0; let segStart = legStart;
        let pts: any[] = [];
        leg.steps.forEach((s: any) => { if(s.path) pts = pts.concat(s.path); });

        for (let j=0; j<pts.length-1; j++) {
            const d = window.google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j+1]);
            if (legAcc + d > maxM) {
                const remaining = maxM - legAcc;
                const fraction = remaining / d;
                const stopPoint = window.google.maps.geometry.spherical.interpolate(pts[j], pts[j+1], fraction);
                const lat = stopPoint.lat();
                const lng = stopPoint.lng();
                const info = await getStopInfo(lat, lng);
                const title = `📍 Parada Táctica: ${info.name}`;
                
                itinerary.push({
                    day: day++, date: fmt(date), from: segStart, to: title,
                    distance: (legAcc + remaining)/1000, isDriving: true,
                    coordinates: info.coords
                });
                newTacticalMarkers.push({ lat, lng, title });
                date = nextDay(date); 
                legAcc = d - remaining; 
                segStart = title;
            } else { 
                legAcc += d; 
            }
        }
        
        let endName = i===route.legs.length-1 ? formData.destino : "Punto Intermedio";
        if(leg.end_address) endName = leg.end_address.split(',')[0].replace(/\d{5}/, '').trim();
        const endCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };

        if (legAcc > 0 || segStart !== endName) {
            itinerary.push({
                day, date: fmt(date), from: segStart, to: endName,
                distance: legAcc/1000, isDriving: true,
                coordinates: endCoords
            });
            legStart = endName;
            if(i < route.legs.length-1) { day++; date = nextDay(date); }
        }
        totalDist += leg.distance.value;
      }

      const ret = formData.fechaRegreso ? new Date(formData.fechaRegreso) : null;
      if (ret) {
          if (ret < date) {
            throw new Error("Fecha de regreso anterior a la llegada.");
          }
          const stay = Math.ceil((ret.getTime() - date.getTime())/(1000*3600*24));
          for(let k=0; k<stay; k++) { 
              day++; date = nextDay(date); 
              const lastCoords = itinerary[itinerary.length-1]?.coordinates;
              itinerary.push({ day, date: fmt(date), from: formData.destino, to: formData.destino, distance: 0, isDriving: false, coordinates: lastCoords }); 
          }
      }

      setTacticalMarkers(newTacticalMarkers);
      setResults({ totalDays: day, distanceKm: totalDist/1000, totalCost: (totalDist/100000)*formData.consumo*formData.precioGasoil, dailyItinerary: itinerary, error: null });

    } catch (error: any) { 
        console.error(error); 
        setResults(prev => ({...prev, error: error.message || "Error al calcular ruta."})); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- RENDER ---
  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error de carga</h2>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Cargando Mapas...</h2>
          <p className="text-gray-500">Esto toma unos segundos. Si persiste, revisa la consola (F12).</p>
          <div className="mt-4 space-y-1 text-sm text-gray-400">
            <p>• Verifica tu conexión</p>
            <p>• Clave API: OK</p>
            <p>• Retry automático en 15s</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-6xl space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">CaraCola Viajes 🐌</h1>
        
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <form onSubmit={calculateRoute} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">ORIGEN</label><input type="text" id="origen" value={formData.origen} onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">DESTINO</label><input type="text" id="destino" value={formData.destino} onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">FECHA INICIO</label><input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                <div className="flex items-end"><button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition shadow-md">{loading ? <IconSpinner /> : '🚀 CALCULAR'}</button></div>
                
                <div className="md:col-span-4 bg-blue-50 p-3 rounded-lg flex flex-wrap gap-4 items-center">
                    <label className="text-sm font-bold w-32 text-blue-800">Ritmo: {formData.kmMaximoDia} km</label>
                    <input type="range" id="kmMaximoDia" min="200" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleSliderChange} className="flex-grow accent-blue-600"/>
                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium"><input type="checkbox" checked={showWaypoints} onChange={()=>setShowWaypoints(!showWaypoints)}/> +Paradas</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium"><input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange}/> Sin Peajes</label>
                </div>
                {showWaypoints && <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} className="md:col-span-4 p-2 border rounded placeholder-gray-400" placeholder="Paradas intermedias (ej: Valencia, Madrid)"/>}
            </form>
        </div>

        {results.totalDays && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconCalendar/><div><p className="text-xl font-bold">{results.totalDays}</p><p className="text-xs text-gray-500">Días</p></div></div>
                     <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconMap/><div><p className="text-xl font-bold">{results.distanceKm?.toFixed(0)}</p><p className="text-xs text-gray-500">Km</p></div></div>
                     <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconFuel/><div><p className="text-xl font-bold">{(results.distanceKm! / 100 * formData.consumo).toFixed(0)}</p><p className="text-xs text-gray-500">L</p></div></div>
                     <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3"><IconWallet/><div><p className="text-xl font-bold text-green-600">{results.totalCost?.toFixed(0)} €</p><p className="text-xs text-gray-500">Coste</p></div></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[600px] bg-gray-300 rounded-xl overflow-hidden shadow-lg relative border-4 border-white">
                        <div ref={mapRef} className="w-full h-full" />
                    </div>

                    <div className="lg:col-span-1 h-[600px] overflow-y-auto pr-2 space-y-3">
                        {selectedDayIndex === null ? (
                             <>
                                <div className="sticky top-0 bg-gray-100 pb-2 z-10 flex justify-between items-center">
                                    <h3 className="font-bold text-xl text-gray-700">Itinerario</h3>
                                </div>
                                {results.dailyItinerary?.map((day, i) => (
                                    <div key={i} onClick={() => focusMapOnStage(i)} className={`p-3 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-all ${day.isDriving ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-orange-500'}`}>
                                        <p className="font-bold text-gray-800 text-sm flex justify-between">
                                            <span>Día {day.day}: {day.to.replace('📍 Parada Táctica: ', '').split(',')[0]}</span>
                                            <span className="font-normal text-gray-400 text-xs">{day.distance.toFixed(0)} km</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{day.date}</p>
                                    </div>
                                ))}
                             </>
                        ) : (
                             <div>
                                <button onClick={() => {setSelectedDayIndex(null); if(mapInstance) mapInstance.fitBounds(new window.google.maps.LatLngBounds());}} className="mb-3 text-xs font-bold text-blue-600 flex items-center gap-1">⬅ Volver al listado</button>
                                <DayDetailView day={results.dailyItinerary![selectedDayIndex]} />
                             </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        {results.error && <div className="p-4 bg-red-100 text-red-700 text-center rounded font-bold">{results.error}</div>}
      </div>
    </main>
  );
}
