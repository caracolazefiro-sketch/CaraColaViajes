'use client';

import React, { useState, useEffect, useRef } from 'react';

// === CONFIGURACIÓN ===
const API_KEY = "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0";
const CX_ID = "9022e72d0fcbd4093";
const MIN_QUALITY_SCORE = 3.75;
const CENTER_POINT = { lat: 40.416775, lng: -3.703790 };

// === DECLARACIONES GLOBALES ===
declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

// === ICONOS (incluido el Spinner que faltaba) ===
const IconCalendar = () => <span className="text-2xl mr-2">Calendar</span>;
const IconMap = () => <span className="text-2xl mr-2">Map</span>;
const IconFuel = () => <span className="text-2xl mr-2">Fuel</span>;
const IconWallet = () => <span className="text-2xl mr-2">Wallet</span>;
const IconSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// === HOOK DE CARGA DE GOOGLE MAPS (INFALIBLE) ===
const useGoogleMapsScript = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          setIsLoaded(true);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);

    window.initMap = () => {
      setIsLoaded(true);
    };

    // Fallback por si el callback falla
    const fallback = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(fallback);
        setIsLoaded(true);
      }
    }, 500);

    return () => {
      clearInterval(fallback);
      delete window.initMap;
    };
  }, [apiKey]);

  return isLoaded;
};

// === INTERFACES ===
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

// === SMART SPOT CARD (Park4Night) ===
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
          const text = `${item.title || ""} ${item.snippet || ""}`;
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
          title: `Explorar mapa de ${city}`,
          link: fallbackUrl,
          snippet: "Ver todas las opciones en Park4Night",
          image: null,
          rating: 0,
          displayRating: "",
          type: "Búsqueda Manual"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBestSpot();
  }, [city, coordinates]);

  if (loading) return <div className="animate-pulse h-28 bg-gray-100 rounded-xl border flex items-center justify-center text-xs text-gray-400 mt-3">Buscando...</div>;
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
        {!isManual && bestSpot.rating > 0 && <div className={`absolute bottom-0 right-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-lg ${badgeColor}`}>Star {bestSpot.displayRating}</div>}
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

// === VISTA DETALLE DEL DÍA ===
const DayDetailView = ({ day }: { day: DailyPlan }) => {
  const cityName = day.to.replace('Parada Táctica: ', '').split(',')[0].trim();

  return (
    <div className={`p-4 rounded-xl space-y-4 h-full ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
      <div className="flex justify-between items-center">
        <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
          {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
        </h4>
        <span className="text-xs bg-white px-2 py-1 rounded border font-mono text-gray-600">{day.date}</span>
      </div>
      <p className="text-md font-semibold text-gray-800">
        {day.from.split(',')[0]} → {day.to.split(',')[0]}
      </p>
      {day.isDriving && <p className="text-xl font-extrabold text-green-700">{day.distance.toFixed(0)} km</p>}
      {day.isDriving && day.distance > 0 && (
        <div className="pt-3 border-t border-dashed border-gray-300">
          <h5 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
            <span className="text-lg">Moon</span> Recomendación en {cityName}:
          </h5>
          <SmartSpotCard city={cityName} coordinates={day.coordinates} />
        </div>
      )}
      {!day.isDriving && <p className="text-lg text-gray-700 italic border-l-2 border-orange-300 pl-4">"Disfruta de {cityName} y recarga energías."</p>}
    </div>
  );
};

// === COMPONENTE PRINCIPAL ===
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
    if (!isLoaded || !mapRef.current || mapInstance || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: CENTER_POINT, zoom: 6,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });

    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#EA580C", strokeWeight: 6 },
    });

    setMapInstance(map);
    setDirectionsRenderer(renderer);

    // Forzar resize
    setTimeout(() => window.google.maps.event.trigger(map, 'resize'), 500);
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
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstance,
          title: p.title,
          label: { text: "P", color: "white", fontWeight: "bold" },
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#EA580C", fillOpacity: 1, strokeWeight: 3, strokeColor: "#fff" }
        });
        markersRef.current.push(marker);
      });
    }
  }, [tacticalMarkers, mapInstance]);

  // Geocoding helpers
  const geocodeCity = async (city: string) => {
    if (!window.google) return null;
    const geocoder = new window.google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ address: city });
      return res.results[0]?.geometry.location.toJSON() || null;
    } catch { return null; }
  };

  const getStopInfo = async (lat: number, lng: number) => {
    if (!window.google) return { name: "Parada", coords: { lat, lng } };
    const geocoder = new window.google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ location: { lat, lng } });
      const locality = res.results[0].address_components.find((c: any) => c.types.includes("locality") || c.types.includes("administrative_area_level_2"));
      return { name: locality?.long_name || "Parada", coords: { lat, lng } };
    } catch { return { name: "Parada", coords: { lat, lng } }; }
  };

  const focusMapOnStage = async (idx: number) => {
    if (!results.dailyItinerary || !mapInstance) return;
    const plan = results.dailyItinerary[idx];
    let start = plan.coordinates || await geocodeCity(plan.from);
    let end = results.dailyItinerary[idx + 1]?.coordinates || await geocodeCity(plan.to);
    if (start && end) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(start);
      bounds.extend(end);
      mapInstance.fitBounds(bounds);
    }
    setSelectedDayIndex(idx);
  };

  // Cálculo de ruta
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !window.google) return;

    setLoading(true);
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
    setTacticalMarkers([]);
    setSelectedDayIndex(null);

    const ds = new window.google.maps.DirectionsService();
    const wps = formData.etapas.split(',').map(s => s.trim()).filter(Boolean).map(l => ({ location: l, stopover: true }));

    try {
      const res: any = await new Promise((resolve, reject) => {
        ds.route({
          origin: formData.origen,
          destination: formData.destino,
          waypoints: wps,
          travelMode: window.google.maps.TravelMode.DRIVING,
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
          const d = window.google.maps.geometry.spherical.computeDistanceBetween(pts[j], pts[j + 1]);
          if (legAcc + d > maxM) {
            const fraction = (maxM - legAcc) / d;
            const stop = window.google.maps.geometry.spherical.interpolate(pts[j], pts[j + 1], fraction);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, kmMaximoDia: parseFloat(e.target.value) }));
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center text-center bg-gray-50">
        <div>
          <div className="text-6xl mb-4">Map</div>
          <h2 className="text-3xl font-bold text-blue-600">Cargando mapas...</h2>
          <p className="text-gray-500 mt-2">Esto toma unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CaraCola Viajes Slow Travel</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <form onSubmit={calculateRoute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <input type="text" placeholder="Origen" id="origen" value={formData.origen} onChange={handleChange} className="p-3 border rounded-lg" required />
            <input type="text" placeholder="Destino" id="destino" value={formData.destino} onChange={Change} className="p-3 border rounded-lg" required />
            <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="p-3 border rounded-lg" required />
            <input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="p-3 border rounded-lg" />

            <input type="number" placeholder="Consumo L/100km" id="consumo" value={formData.consumo} onChange={handleChange} step="0.1" className="p-3 border rounded-lg" />
            <input type="number" placeholder="Precio gasoil €/L" id="precioGasoil" value={formData.precioGasoil} onChange={handleChange} step="0.01" className="p-3 border rounded-lg" />

            <div className="lg:col-span-4 flex items-center gap-4">
              <span className="font-bold">Máx {formData.kmMaximoDia} km/día</span>
              <input type="range" id="kmMaximoDia" min="200" max="800" step="50" value={formData.kmMaximoDia} onChange={handleSliderChange} className="flex-1" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.evitarPeajes} onChange={handleChange} id="evitarPeajes" /> Sin peajes</label>
            </div>

            <div className="lg:col-span-4">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-3 text-lg">
                {loading ? <>Calculating Route<IconSpinner /></> : 'CALCULAR RUTA PERFECTA'}
              </button>
            </div>
          </form>

          {showWaypoints && (
            <div className="mt-4">
              <input type="text" placeholder="Paradas intermedias (ej: Valencia, Madrid)" id="etapas" value={formData.etapas} onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
          )}
        </div>

        {results.dailyItinerary && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 lg:h-screen bg-gray-200 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-screen">
              {selectedDayIndex === null ? (
                results.dailyItinerary.map((day, i) => (
                  <div key={i} onClick={() => focusMapOnStage(i)} className="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer border-l-4 border-orange-500">
                    <div className="flex justify-between">
                      <strong>Día {day.day} • {day.date}</strong>
                      {day.isDriving && <span className="text-green-600 font-bold">{day.distance.toFixed(0)} km</span>}
                    </div>
                    <p className="text-sm mt-1">{day.to.includes('Parada') ? day.to : `Estancia en ${day.to.split(',')[0]}`}</p>
                  </div>
                ))
              ) : (
                <div>
                  <button onClick={() => setSelectedDayIndex(null)} className="mb-4 text-blue-600 font-bold">← Volver al itinerario</button>
                  <DayDetailView day={results.dailyItinerary[selectedDayIndex]} />
                </div>
              )}
            </div>
          </div>
        )}

        {results.error && <div className="bg-red-100 text-red-700 p-6 rounded-xl text-center font-bold text-lg">{results.error}</div>}
      </div>
    </main>
  );
}
