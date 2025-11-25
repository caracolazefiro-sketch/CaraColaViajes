'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURACIÓN ---
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0"; // Funciona si tienes Maps JavaScript API habilitada
const CX_ID = "9022e72d0fcbd4093";
const MIN_QUALITY_SCORE = 3.75;
const CENTER_POINT = { lat: 40.416775, lng: -3.703790 };

declare const google: any;

// Declaración global para el callback
declare global {
  interface Window {
    initMap?: () => void;
  }
}

// --- HOOK MEJORADO (evita doble carga y funciona en Next.js) ---
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    // Ya cargado
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Script ya inyectado
    if (document.getElementById('google-maps-script')) {
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          setIsLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return;
    }

    // Carga única con callback
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);

    window.initMap = () => {
      setIsLoaded(true);
    };

    return () => {
      delete window.initMap;
    };
  }, [apiKey]);

  return isLoaded;
};

// --- ICONOS ---
const IconCalendar = () => <span className="text-2xl mr-2">Calendar</span>;
const IconMap = () => <span className="text-2xl mr-2">Map</span>;
const IconFuel = () => <span className="text-2xl mr-2">Fuel</span>;
const IconWallet = () => <span className="text-2xl mr-2">Wallet</span>;

// --- INTERFACES ---
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

// --- SMART SPOT CARD (sin cambios importantes) ---
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
        const json = await res.json();

        if (!json.items?.length) throw new Error("No results");

        const candidates = json.items.map((item: any) => {
          let rating = 0;
          const text = (item.title || "") + " " + (item.snippet || "");
          const match = text.match(/(\d[\.,]?\d{0,2})\s?\/\s?5/);
          if (match) rating = parseFloat(match[1].replace(',', '.'));
          else if (item.pagemap?.aggregaterating?.[0]?.ratingvalue) {
            rating = parseFloat(item.pagemap.aggregaterating[0].ratingvalue);
          }

          const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
          const title = (item.title || "").replace(/ - park4night/i, '').replace(/\(\d+\)/, '').trim();
          let link = (item.link || "").replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

          return { title, link, snippet: item.snippet || "", image: img, rating, displayRating: rating.toFixed(1), type: "Spot" };
        });

        const topPick = candidates
          .filter((s: any) => s.rating >= MIN_QUALITY_SCORE)
          .sort((a: any, b: any) => b.rating - a.rating)[0];

        if (topPick) setBestSpot(topPick);
        else throw new Error("Low quality");
      } catch {
        let fallbackUrl = `https://park4night.com/es/search?q=${encodeURIComponent(city)}`;
        if (coordinates) fallbackUrl += `&lat=${coordinates.lat}&lng=${coordinates.lng}&z=14`;
        setBestSpot({
          title: `Explorar mapa de ${city}`, link: fallbackUrl, snippet: "Ver todas las opciones en Park4Night", image: null,
          rating: 0, displayRating: "", type: "Búsqueda Manual"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBestSpot();
  }, [city, coordinates]);

  if (loading) return <div className="h-28 bg-gray-100 rounded-xl border animate-pulse flex items-center justify-center text-xs text-gray-400 mt-3">Analizando...</div>;
  if (!bestSpot) return null;

  const isManual = bestSpot.type === "Búsqueda Manual";
  const badgeColor = bestSpot.rating >= 4.5 ? "bg-green-600" : "bg-green-500";

  return (
    <a href={bestSpot.link} target="_blank" rel="noopener noreferrer"
       className={`flex bg-white border-2 ${isManual ? 'border-blue-200' : 'border-gray-200'} rounded-xl overflow-hidden hover:shadow-lg transition-all mt-3 h-28 no-underline group`}>
      <div className={`w-28 flex-shrink-0 relative ${isManual ? 'bg-blue-50' : 'bg-gray-200'}`}>
        {bestSpot.image && !isManual ? (
          <img src={bestSpot.image} alt="spot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">{isManual ? 'World' : 'Tree'}</div>
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
            {isManual ? 'Buscar en Park4Night' : 'Ver Ficha'}
          </span>
        </div>
      </div>
    </a>
  );
};

// --- VISTA DETALLE DÍA ---
const DayDetailView = ({ day }: { day: DailyPlan }) => {
  const city = day.to.replace('Parada Táctica: ', '').split(',')[0].trim();
  return (
    <div className={`p-4 rounded-xl space-y-4 h-full ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
      <div className="flex justify-between items-center">
        <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
          {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
        </h4>
        <span className="text-xs bg-white px-2 py-1 rounded border font-mono text-gray-600">{day.date}</span>
      </div>
      <p className="text-md font-semibold text-gray-800">
        {day.from.split(',')[0]} <span className="text-gray-400">→</span> {day.to.split(',')[0]}
      </p>
      {day.isDriving && <p className="text-xl font-extrabold text-green-700">{day.distance.toFixed(0)} km</p>}
      {day.isDriving && day.distance > 0 && (
        <div className="pt-3 border-t border-dashed border-gray-300">
          <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
            <span className="text-lg">Moon</span> Recomendación en {city}:
          </h5>
          <SmartSpotCard city={city} coordinates={day.coordinates} />
        </div>
      )}
      {!day.isDriving && <p className="text-lg text-gray-700 italic border-l-2 border-orange-300 pl-4">"Disfruta de {city} y recarga energías."</p>}
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function Home() {
  const isLoaded = useGoogleMapsScript(API_KEY);
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

  // Persistencia
  useEffect(() => {
    const saved = localStorage.getItem('caracola_data');
    if (saved) try { setFormData(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('caracola_data', JSON.stringify(formData));
  }, [formData]);

  // Inicializar mapa
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstance) return;

    const map = new google.maps.Map(mapRef.current, {
      center: CENTER_POINT, zoom: 6,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });

    const renderer = new google.maps.DirectionsRenderer({
      map, suppressMarkers: false,
      polylineOptions: { strokeColor: "#EA580C", strokeWeight: 6 },
    });

    setMapInstance(map);
    setDirectionsRenderer(renderer);

    // Forzar resize
    setTimeout(() => google.maps.event.trigger(map, "resize"), 200);
  }, [isLoaded, mapInstance]);

  // Renderizar ruta
  useEffect(() => {
    if (directionsRenderer && directionsResponse) {
      directionsRenderer.setDirections(directionsResponse);
    }
  }, [directionsResponse, directionsRenderer]);

  // Marcadores P
  useEffect(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (mapInstance && tacticalMarkers.length > 0) {
      tacticalMarkers.forEach(p => {
        const marker = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstance,
          title: p.title,
          label: { text: "P", color: "white", fontWeight: "bold", fontSize: "14px" },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#EA580C", fillOpacity: 1, strokeWeight: 3, strokeColor: "#fff" }
        });
        markersRef.current.push(marker);
      });
    }
  }, [tacticalMarkers, mapInstance]);

  // Helpers
  const geocodeCity = async (city: string) => {
    if (!google) return null;
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ address: city });
      return res.results[0]?.geometry.location.toJSON() || null;
    } catch { return null; }
  };

  const getStopInfo = async (lat: number, lng: number) => {
    if (!google) return { name: "Parada", coords: { lat, lng } };
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ location: { lat, lng } });
      const locality = res.results[0].address_components.find((c: any) => c.types.includes("locality") || c.types.includes("administrative_area_level_2"));
      return { name: locality?.long_name || "Parada", coords: { lat, lng } };
    } catch { return { name: "Parada", coords: { lat, lng } }; }
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary) return;
    const plan = results.dailyItinerary[idx];
    let start = plan.coordinates || await geocodeCity(plan.from);
    let end = results.dailyItinerary[idx + 1]?.coordinates || await geocodeCity(plan.to);
    if (start && end && mapInstance) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(start);
      bounds.extend(end);
      mapInstance.fitBounds(bounds);
    }
    setSelectedDayIndex(idx);
  };

  // Cálculo de ruta
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !google) return setResults({ ...results, error: "Mapas no cargados" });
    setLoading(true);
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
    setTacticalMarkers([]);
    setSelectedDayIndex(null);

    const ds = new google.maps.DirectionsService();
    const wps = formData.etapas.split(',').map(s => s.trim()).filter(Boolean).map(l => ({ location: l, stopover: true }));

    try {
      const res: any = await new Promise((resolve, reject) => {
        ds.route({
          origin: formData.origen,
          destination: formData.destino,
          waypoints: wps,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidTolls: formData.evitarPeajes,
        }, (result, status) => {
          status === 'OK' ? resolve(result) : reject(status);
        });
      });

      setDirectionsResponse(res);
      const route = res.routes[0];
      const itinerary: DailyPlan[] = [];
      const markers: any[] = [];
      let day = 1;
      let date = formData.fechaInicio ? new Date(formData.fechaInicio) : new Date();
      const maxM = formData.kmMaximoDia * 1000;
      const nextDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };
      const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      let legStart = formData.origen;
      let totalDist = 0;

      for (const leg of route.legs) {
        let legAcc = 0;
        let segStart = legStart;
        const pts: any[] = [];
        leg.steps.forEach((s: any) => s.path && pts.push(...s.path));

        for (let j = 0; j < pts.length - 1; j++) {
          const d = google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j + 1]);
          if (legAcc + d > maxM) {
            const fraction = (maxM - legAcc) / d;
            const stop = google.maps.geometry.spherical.interpolate(pts[j], pts[j + 1], fraction);
            const info = await getStopInfo(stop.lat(), stop.lng());
            const title = `Parada Táctica: ${info.name}`;
            itinerary.push({
              day: day++, date: fmt(date), from: segStart, to: title,
              distance: (legAcc + (maxM - legAcc)) / 1000, isDriving: true,
              coordinates: info.coords
            });
            markers.push({ lat: stop.lat(), lng: stop.lng(), title });
            date = nextDay(date);
            legAcc = d - (maxM - legAcc);
            segStart = title;
          } else {
            legAcc += d;
          }
        }

        const endName = leg.end_address.split(',')[0].replace(/\d{5}/, '').trim();
        const endCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };
        if (legAcc > 0) {
          itinerary.push({
            day, date: fmt(date), from: segStart, to: endName,
            distance: legAcc / 1000, isDriving: true, coordinates: endCoords
          });
          if (leg !== route.legs[route.legs.length - 1]) { day++; date = nextDay(date); }
        }
        legStart = endName;
        totalDist += leg.distance.value;
      }

      // Días de estancia
      if (formData.fechaRegreso) {
        const ret = new Date(formData.fechaRegreso);
        const stay = Math.max(0, Math.ceil((ret.getTime() - date.getTime()) / (86400 * 1000)));
        const lastCoords = itinerary[itinerary.length - 1]?.coordinates;
        for (let i = 0; i < stay; i++) {
          date = nextDay(date);
          itinerary.push({
            day: day++, date: fmt(date), from: formData.destino, to: formData.destino,
            distance: 0, isDriving: false, coordinates: lastCoords
          });
        }
      }

      setTacticalMarkers(markers);
      setResults({
        totalDays: day - 1,
        distanceKm: totalDist / 1000,
        totalCost: (totalDist / 100000) * formData.consumo * formData.precioGasoil,
        dailyItinerary: itinerary,
        error: null
      });

    } catch (err: any) {
      setResults({ ...results, error: "Error al calcular ruta: " + err });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center text-2xl font-bold text-blue-600">Cargando mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CaraCola Viajes</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <form onSubmit={calculateRoute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" placeholder="Origen" id="origen" value={formData.origen} onChange={e => setFormData({ ...formData, origen: e.target.value })} className="p-3 border rounded-lg" required />
            <input type="text" placeholder="Destino" id="destino" value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} className="p-3 border rounded-lg" required />
            <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} className="p-3 border rounded-lg" />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Calculando...' : 'CALCULAR RUTA'}
            </button>

            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold">Ritmo: {formData.kmMaximoDia} km/día</span>
                <input type="range" min="200" max="800" step="50" value={formData.kmMaximoDia} onChange={e => setFormData({ ...formData, kmMaximoDia: +e.target.value })} className="flex-1" />
                <label><input type="checkbox" checked={formData.evitarPeajes} onChange={e => setFormData({ ...formData, evitarPeajes: e.target.checked })} /> Sin peajes</label>
              </div>
              {showWaypoints && <input type="text" placeholder="Paradas intermedias (separadas por comas)" id="etapas" value={formData.etapas} onChange={e => setFormData({ ...formData, etapas: e.target.value })} className="w-full p-3 border rounded-lg" />}
            </div>
          </form>
        </div>

        {results.dailyItinerary && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 lg:h-full bg-gray-200 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-screen">
              {selectedDayIndex === null ? (
                results.dailyItinerary.map((day, i) => (
                  <div key={i} onClick={() => focusMapOnStage(i)} className="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer border-l-4 border-orange-500">
                    <div className="flex justify-between">
                      <strong>Día {day.day}</strong>
                      <span className="text-sm text-gray-500">{day.date}</span>
                    </div>
                    <p className="text-sm">{day.to.split(':')[1]?.trim() || day.to}</p>
                    {day.isDriving && <span className="text-green-600 font-bold">{day.distance.toFixed(0)} km</span>}
                  </div>
                ))
              ) : (
                <div>
                  <button onClick={() => setSelectedDayIndex(null)} className="text-blue-600 mb-4">← Volver</button>
                  <DayDetailView day={results.dailyItinerary[selectedDayIndex]} />
                </div>
              )}
            </div>
          </div>
        )}

        {results.error && <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center font-bold">{results.error}</div>}
      </div>
    </main>
  );
}
