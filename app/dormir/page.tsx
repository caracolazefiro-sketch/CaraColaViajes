'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- 1. CONFIGURACIÓN ---
declare const google: any;
const CX_ID = "9022e72d0fcbd4093"; 
const MIN_QUALITY_SCORE = 3.8;

// Coordenadas por defecto (Madrid)
const CENTER = { lat: 40.416775, lng: -3.703790 };

// Estilos del contenedor
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
  minHeight: '600px',
  backgroundColor: '#e5e7eb'
};

// --- 2. INTERFACES ---
interface DailyPlan { 
  day: number; 
  date: string; 
  from: string; 
  to: string; 
  distance: number; 
  isDriving: boolean;
  coordinates?: { lat: number, lng: number }; 
}

interface SpotData {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
  rating: number; 
  displayRating: string;
  type: string;
}

interface TripResult { 
    totalDays: number | null; 
    distanceKm: number | null; 
    totalCost: number | null; 
    dailyItinerary: DailyPlan[] | null; 
    error: string | null; 
}

// --- 3. HOOK DE CARGA (NATIVO) ---
// Este hook inyecta el script de Google Maps sin necesitar librerías externas
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
      // Si ya existe, asumimos que cargará pronto
      const check = setInterval(() => {
          if((window as any).google) {
              setIsLoaded(true);
              clearInterval(check);
          }
      }, 500);
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

// --- 4. COMPONENTE: TARJETA INTELIGENTE ---
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
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const query = `site:park4night.com "${city}"`; 
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.items || json.items.length === 0) throw new Error("No results");

        const candidates: SpotData[] = json.items.map((item: any) => {
             let rating = 0;
             const text = item.title + " " + item.snippet;
             const match = text.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
             if (match) rating = parseFloat(match[1].replace(',', '.'));
             else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);

             let type = "Spot";
             const lower = text.toLowerCase();
             if (lower.includes("área") || lower.includes("area")) type = "Área AC";
             else if (lower.includes("parking")) type = "Parking";
             
             const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
             const title = item.title.replace(/ - park4night/i, '').replace(/\(\d+\)/, '').trim();
             let link = item.link.replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

             return { title, link, snippet: item.snippet, image: img, rating, displayRating: rating.toFixed(1), type };
        });

        const topPick = candidates
            .filter(s => s.rating >= MIN_QUALITY_SCORE)
            .sort((a, b) => b.rating - a.rating)[0];

        if (topPick) setBestSpot(topPick);
        else throw new Error("Low quality");

      } catch (e) {
        setIsFallback(true);
        let fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}`;
        if (coordinates) fallbackUrl += `&lat=${coordinates.lat}&lng=${coordinates.lng}&z=14`;
        
        setBestSpot({
            title: `Ver mapa de ${city}`,
            link: fallbackUrl,
            snippet: "Explora todas las opciones en el mapa interactivo.",
            image: null, rating: 0, displayRating: "", type: "Búsqueda Manual"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBestSpot();
  }, [city, coordinates]);

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl border flex items-center justify-center text-xs text-gray-400 mt-2">Buscando...</div>;
  if (!bestSpot) return null;

  const badgeColor = bestSpot.rating >= 4.5 ? "bg-green-600" : "bg-green-500";
  const isManual = bestSpot.type === "Búsqueda Manual";

  return (
    <a href={bestSpot.link} target="_blank" rel="noopener noreferrer" className={`flex bg-white border-2 ${isManual ? 'border-blue-200' : 'border-gray-200'} rounded-xl overflow-hidden hover:shadow-lg transition-all mt-3 h-28 no-underline group`}>
       <div className={`w-28 flex-shrink-0 relative ${isManual ? 'bg-blue-50' : 'bg-gray-200'}`}>
          {bestSpot.image && !isManual ? (
              <img src={bestSpot.image} alt="spot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">{isManual ? '🌍' : '🌲'}</div>
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
                   {isManual ? 'Ver Mapa P4N ➜' : 'Ver Ficha ➜'}
               </span>
           </div>
       </div>
    </a>
  );
};

// --- 5. DETALLE DÍA ---
const DayDetailView: React.FC<{ day: DailyPlan }> = ({ day }) => {
  const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split(',')[0].trim();
  return (
    <div className={`p-5 rounded-xl h-full border-l-4 shadow-sm transition-all ${day.isDriving ? 'bg-blue-50 border-blue-600' : 'bg-orange-50 border-orange-600'}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>{day.isDriving ? '🚙 Etapa' : '🏖️ Relax'}</h4>
        <span className="text-xs bg-white px-2 py-1 rounded border font-mono text-gray-600">{day.date}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
         <span className="truncate max-w-[45%]">{day.from.split(',')[0]}</span><span className="text-gray-400">➝</span><span className="truncate max-w-[45%]">{day.to.split(',')[0]}</span>
      </div>
      {day.isDriving && <p className="text-2xl font-extrabold text-gray-700 mb-4">{day.distance.toFixed(0)} <span className="text-xs font-normal text-gray-500">km</span></p>}
      {day.isDriving && day.distance > 0 && (
        <div className="pt-3 border-t border-dashed border-gray-300">
          <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><span>🌙</span> Recomendado en {rawCityName}:</h5>
          <SmartSpotCard city={rawCityName} coordinates={day.coordinates} />
        </div>
      )}
    </div>
  );
};

// --- 6. APP PRINCIPAL (NATIVA) ---
export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const isLoaded = useGoogleMapsScript(apiKey);
  
  // Referencias Nativas
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const markersRef = useRef<any[]>([]);

  const [results, setResults] = useState<TripResult>({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    fechaInicio: '', origen: 'Salamanca', fechaRegreso: '', destino: 'Punta Umbria',
    etapas: 'Valencia', consumo: 9.0, precioGasoil: 1.75, kmMaximoDia: 400, evitarPeajes: false,
  });

  // Persistencia
  useEffect(() => { const s = localStorage.getItem('caracola_data'); if (s) try { setFormData(JSON.parse(s)); } catch(e){} }, []);
  useEffect(() => { localStorage.setItem('caracola_data', JSON.stringify(formData)); }, [formData]);

  // MAPA (Inicialización)
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance && typeof google !== 'undefined') {
      const map = new google.maps.Map(mapRef.current, { center: CENTER, zoom: 6 });
      const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: false, polylineOptions: { strokeColor: "#2563EB", strokeWeight: 5 } });
      setMapInstance(map);
      setDirectionsRenderer(renderer);
    }
  }, [isLoaded, mapInstance]);

  // HELPERS
  const geocodeCity = async (city: string) => {
    if (!mapInstance) return null;
    const geocoder = new google.maps.Geocoder();
    try { const res = await geocoder.geocode({ address: city }); if(res.results[0]) return res.results[0].geometry.location.toJSON(); } catch(e){} return null;
  };

  const getStopInfo = async (lat: number, lng: number) => {
    if (!mapInstance) return { name: "Parada", coords: { lat, lng } };
    const geocoder = new google.maps.Geocoder();
    try { 
        const res = await geocoder.geocode({ location: { lat, lng } }); 
        if (res.results[0]) { 
            const c = res.results[0].address_components.find((x:any)=>x.types.includes("locality"));
            return { name: c ? c.long_name : "Punto", coords: { lat, lng } }; 
        } 
    } catch(e) {} 
    return { name: "Parada", coords: { lat, lng } };
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary || !mapInstance) return;
    const plan = results.dailyItinerary[idx];
    let start = plan.coordinates; 
    let end = results.dailyItinerary[idx+1]?.coordinates;

    if(!start) start = await geocodeCity(plan.from);
    if(!end) end = await geocodeCity(plan.to);

    if (start && end) { const b = new google.maps.LatLngBounds(); b.extend(start); b.extend(end); mapInstance.fitBounds(b); }
    setSelectedDayIndex(idx);
  };

  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setResults({totalDays:null, distanceKm:null, totalCost:null, dailyItinerary:null, error:null}); setSelectedDayIndex(null);

    const ds = new google.maps.DirectionsService();
    const wps = formData.etapas.split(',').filter(s=>s.trim()).map(l => ({ location: l, stopover: true }));

    try {
      const res = await ds.route({
        origin: formData.origen, destination: formData.destino, waypoints: wps,
        travelMode: 'DRIVING', avoidTolls: formData.evitarPeajes
      });
      
      if (directionsRenderer) directionsRenderer.setDirections(res);

      const route = res.routes[0];
      const itinerary: DailyPlan[] = [];
      const newMarkers: any[] = [];
      let day = 1;
      let date = formData.fechaInicio ? new Date(formData.fechaInicio) : new Date();
      const maxM = formData.kmMaximoDia * 1000;
      const fmt = (d: Date) => d.toLocaleDateString('es-ES');
      const nextDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate()+1); return n; };

      let legStart = formData.origen;
      let totalDist = 0;

      // Borrar marcadores viejos
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      for (let i=0; i<route.legs.length; i++) {
        const leg = route.legs[i];
        let legAcc = 0; let segStart = legStart;
        let pts = [];
        leg.steps.forEach((s:any) => { if(s.path) pts = pts.concat(s.path); });

        for (let j=0; j<pts.length-1; j++) {
          const d = google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j+1]);
          if (legAcc + d > maxM) {
            const lat = pts[j].lat(); const lng = pts[j+1].lng();
            const info = await getStopInfo(lat, lng);
            const title = `📍 Parada Táctica: ${info.name}`;
            itinerary.push({ 
                day: day++, date: fmt(date), from: segStart, to: title, 
                distance: (legAcc+d)/1000, isDriving: true, coordinates: info.coords 
            });
            
            // Marcador Nativo
            const m = new google.maps.Marker({ position: info.coords, map: mapInstance, title, label: {text:"P", color:"white"} });
            markersRef.current.push(m);

            date = nextDay(date); legAcc = 0; segStart = title;
          } else { legAcc += d; }
        }
        
        let endName = i === route.legs.length-1 ? formData.destino : "Punto Intermedio";
        if(leg.end_address) endName = leg.end_address.split(',')[0].replace(/\d{5}/, '').trim();
        const endCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };

        if (legAcc > 0 || segStart !== endName) {
          itinerary.push({ day, date: fmt(date), from: segStart, to: endName, distance: legAcc/1000, isDriving: true, coordinates: endCoords });
          legStart = endName;
          if (i < route.legs.length-1) { day++; date = nextDay(date); }
        }
        totalDist += leg.distance.value;
      }

      const ret = formData.fechaRegreso ? new Date(formData.fechaRegreso) : null;
      if (ret) {
        const stay = Math.ceil((ret.getTime() - date.getTime())/(1000*3600*24));
        for(let k=0; k<stay; k++) { day++; date = nextDay(date); itinerary.push({ day, date: fmt(date), from: formData.destino, to: formData.destino, distance: 0, isDriving: false }); }
      }

      setResults({ totalDays: day, distanceKm: totalDist/1000, totalCost: (totalDist/100000)*formData.consumo*formData.precioGasoil, dailyItinerary: itinerary, error: null });

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleInput = (e: any) => { const {id, value, type, checked} = e.target; setFormData(p => ({...p, [id]: type==='checkbox'?checked:value})); };
  const handleSlider = (e: any) => { setFormData(p => ({...p, [e.target.id]: parseFloat(e.target.value)})); };

  if (!isLoaded) return <div className="flex h-screen justify-center items-center text-blue-600 animate-pulse font-bold">Cargando Mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-blue-600">CaraCola 🐌 MODO TEST</h1>
        
        <div className="bg-white rounded-xl shadow p-6">
            <form onSubmit={calculateRoute} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleInput} className="p-2 border rounded"/>
                <input type="text" id="origen" value={formData.origen} onChange={handleInput} className="p-2 border rounded" placeholder="Origen" required/>
                <input type="text" id="destino" value={formData.destino} onChange={handleInput} className="p-2 border rounded" placeholder="Destino" required/>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold rounded hover:bg-blue-700">{loading ? '...' : 'Calcular'}</button>
                
                <div className="md:col-span-4 flex flex-wrap gap-4 bg-blue-50 p-3 rounded items-center">
                    <label className="text-sm font-bold w-32">Ritmo: {formData.kmMaximoDia} km</label>
                    <input type="range" id="kmMaximoDia" min="100" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleSlider} className="flex-grow"/>
                    <label className="flex items-center gap-2 text-sm font-bold text-blue-800 cursor-pointer"><input type="checkbox" checked={showWaypoints} onChange={()=>setShowWaypoints(!showWaypoints)}/> +Paradas</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleInput}/> Sin Peajes</label>
                </div>
                {showWaypoints && <input type="text" id="etapas" value={formData.etapas} onChange={handleInput} className="md:col-span-4 p-2 border rounded" placeholder="Paradas intermedias (ej: Valencia)"/>}
            </form>
        </div>

        {results.dailyItinerary && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[600px] bg-gray-300 rounded-xl overflow-hidden shadow relative border-4 border-white">
                    <div ref={mapRef} style={containerStyle} />
                </div>
                <div className="lg:col-span-1 h-[600px] overflow-y-auto space-y-3 pr-2">
                    <div className="sticky top-0 bg-gray-100 py-2 z-10 flex justify-between items-center">
                        <h3 className="font-bold text-xl text-gray-700">Itinerario</h3>
                        <button onClick={()=>{setSelectedDayIndex(null); if(mapInstance) mapInstance.fitBounds(new google.maps.LatLngBounds());}} className="text-xs bg-white border px-2 py-1 rounded shadow">Ver Todo</button>
                    </div>
                    {selectedDayIndex === null ? (
                        results.dailyItinerary.map((day, i) => (
                            <div key={i} onClick={() => focusMapOnStage(i)} className="p-3 bg-white border rounded cursor-pointer hover:shadow-md transition-all">
                                <p className="font-bold text-blue-700">Día {day.day} <span className="font-normal text-gray-500 text-xs ml-2">{day.date}</span></p>
                                <p className="text-sm text-gray-600">{day.from.split(',')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split(',')[0]}</p>
                                {day.isDriving && <p className="text-xs text-gray-400 text-right mt-1">{day.distance.toFixed(0)} km</p>}
                            </div>
                        ))
                    ) : (
                        <DayDetailView day={results.dailyItinerary[selectedDayIndex]} />
                    )}
                </div>
            </div>
        )}
      </div>
    </main>
  );
}
