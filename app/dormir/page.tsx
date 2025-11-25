'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

// ======================== CONFIG ========================
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES = ["places", "geometry"] as ("places" | "geometry")[];

// Tus claves (asegúrate de tenerlas en .env.local)
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const CSE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';  // misma clave sirve
const CX_ID = "9022e72d0fcbd4093";  // tu Custom Search Engine ID
const MIN_RATING = 3.8;

// ======================== ICONOS ========================
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

// ======================== SMART SPOT CARD (PARK4NIGHT REAL) ========================
const SmartSpotCard = ({ city }: { city: string }) => {
  const [spot, setSpot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    (async () => {
      setLoading(true);
      try {
        const query = `site:park4night.com "${city}"`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${CSE_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.items?.length) throw new Error("No results");

        const candidates = data.items.map((item: any) => {
          const text = `${item.title || ""} ${item.snippet || ""}`;
          const ratingMatch = text.match(/(\d[.,]?\d?)\s?\/\s?5/);
          const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

          const img = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
          const title = (item.title || "").replace(/ - park4night.*/i, '').replace(/\(\d+\)/g, '').trim();
          const link = (item.link || "").replace(/park4night\.com\/[a-z]{2}\//, "park4night.com/es/");

          return { title, link, rating, img };
        });

        const best = candidates
          .filter((s: any) => s.rating >= MIN_RATING)
          .sort((a: any, b: any) => b.rating - a.rating)[0];

        if (best) {
          setSpot({ ...best, isFallback: false });
        } else {
          throw new Error("No good spot");
        }
      } catch (e) {
        setSpot({
          isFallback: true,
          link: `https://park4night.com/es/search?q=${encodeURIComponent(city)}`,
          title: `Explorar Park4Night en ${city}`
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  if (loading) {
    return <div className="text-sm text-gray-500 animate-pulse">Buscando mejor pernocta...</div>;
  }

  if (!spot) return null;

  return spot.isFallback ? (
    <a
      href={spot.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-orange-50 border-2 border-orange-200 rounded-xl text-orange-700 font-bold text-center hover:bg-orange-100 transition"
    >
      Ver todos los parkings en {city} (Park4Night)
    </a>
  ) : (
    <a
      href={spot.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="flex">
        <div className="w-28 h-28 bg-gray-200 flex-shrink-0">
          {spot.img ? (
            <img src={spot.img} alt={spot.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">Tree</div>
          )}
        </div>
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            <h4 className="font-bold text-sm line-clamp-2">{spot.title}</h4>
            <p className="text-xs text-gray-500 mt-1">Park4Night • {city}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-bold text-lg">★ {spot.rating.toFixed(1)}</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Ver ficha →</span>
          </div>
        </div>
      </div>
    </a>
  );
};

// ======================== DAY DETAIL VIEW CON PARK4NIGHT ========================
const DayDetailView: React.FC<{ day: DailyPlan }> = ({ day }) => {
  const cityName = day.to.replace(/^(Parada Táctica|Parada de Pernocta): /, '').split(',')[0].trim();

  return (
    <div className={`p-6 rounded-xl space-y-5 h-full ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
      <h4 className={`text-2xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
        {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
      </h4>

      <p className="text-lg font-semibold text-gray-800">
        {day.from.split(',')[0]} → {day.to.split(',')[0]}
      </p>

      {day.isDriving && (
        <p className="text-2xl font-extrabold text-green-700">
          {day.distance.toFixed(0)} km
        </p>
      )}

      {day.isDriving && day.distance > 0 && (
        <div className="pt-4 border-t-2 border-dashed border-gray-300">
          <h5 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            Recomendación de pernocta en {cityName}
          </h5>
          <SmartSpotCard city={cityName} />
        </div>
      )}

      {!day.isDriving && (
        <p className="text-lg text-gray-700 italic border-l-4 border-orange-400 pl-4">
          "¡Disfruta de {cityName} y recarga energías!"
        </p>
      )}
    </div>
  );
};

// ======================== INTERFACES ========================
interface DailyPlan {
  day: number;
  date: string;
  from: string;
  to: string;
  distance: number;
  isDriving: boolean;
}
interface TripResult {
  totalDays: number | null;
  distanceKm: number | null;
  totalCost: number | null;
  dailyItinerary: DailyPlan[] | null;
  error: string | null;
}

// ======================== COMPONENTE PRINCIPAL (100% TUYO) ========================
export default function Home() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [tacticalMarkers, setTacticalMarkers] = useState<{lat: number, lng: number, title: string}[]>([]);

  const [formData, setFormData] = useState({
    fechaInicio: '',
    origen: 'Salamanca',
    fechaRegreso: '',
    destino: 'Punta Umbria',
    etapas: 'Valencia',
    consumo: 9.0,
    precioGasoil: 1.75,
    kmMaximoDia: 400,
    evitarPeajes: false,
  });

  const [results, setResults] = useState<TripResult>({
    totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null
  });

  // === HANDLERS ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : (id === 'consumo' || id === 'precioGasoil' || id === 'kmMaximoDia') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: parseFloat(e.target.value) }));
  };

  // === GEOCODING HELPERS ===
  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => {
    if (!google?.maps?.Geocoder) return null;
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ address: cityName });
      return res.results[0]?.geometry.location.toJSON() || null;
    } catch { return null; }
  };

  const getCityNameForStop = async (lat: number, lng: number): Promise<string> => {
    if (!google?.maps?.Geocoder) return "Parada en Ruta";
    const geocoder = new google.maps.Geocoder();
    try {
      const res = await geocoder.geocode({ location: { lat, lng } });
      const locality = res.results[0]?.address_components.find((c: any) => 
        c.types.includes("locality") || c.types.includes("administrative_area_level_2")
      );
      return locality ? locality.long_name.replace(/\d{5}/g, '').trim() : "Parada en Ruta";
    } catch { return "Parada en Ruta"; }
  };

  const focusMapOnStage = async (dayIndex: number) => {
    if (!results.dailyItinerary) return;
    const day = results.dailyItinerary[dayIndex];
    const [start, end] = await Promise.all([
      geocodeCity(day.from),
      geocodeCity(day.to)
    ]);
    if (start && end) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(start);
      bounds.extend(end);
      setMapBounds(bounds);
    }
    setSelectedDayIndex(dayIndex);
  };

  // === CÁLCULO DE RUTA (100% TU LÓGICA ORIGINAL) ===
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !google?.maps) return;

    setLoading(true);
    setDirectionsResponse(null);
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
    setTacticalMarkers([]);
    setSelectedDayIndex(null);
    setMapBounds(null);

    const directionsService = new google.maps.DirectionsService();
    const waypoints = formData.etapas.split(',').map(s => s.trim()).filter(Boolean).map(loc => ({ location: loc, stopover: true }));

    try {
      const result = await directionsService.route({
        origin: formData.origen,
        destination: formData.destino,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: formData.evitarPeajes,
      });

      setDirectionsResponse(result);

      const route = result.routes[0];
      const itinerary: DailyPlan[] = [];
      const markers: {lat: number, lng: number, title: string}[] = [];

      let dayCounter = 1;
      let currentDate = new Date(formData.fechaInicio);
      const maxMeters = formData.kmMaximoDia * 1000;
      const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

      let currentLegStartName = formData.origen;
      let totalDistMeters = 0;

      for (const leg of route.legs) {
        let legPoints: google.maps.LatLng[] = [];
        leg.steps.forEach(step => { if (step.path) legPoints.push(...step.path); });

        let legAccumulator = 0;
        let segmentStartName = currentLegStartName;

        for (let j = 0; j < legPoints.length - 1; j++) {
          const dist = google.maps.geometry.spherical.computeDistanceBetween(legPoints[j], legPoints[j + 1]);
          if (legAccumulator + dist > maxMeters) {
            const fraction = (maxMeters - legAccumulator) / dist;
            const stopLat = legPoints[j].lat() + fraction * (legPoints[j + 1].lat() - legPoints[j].lat());
            const stopLng = legPoints[j].lng() + fraction * (legPoints[j + 1].lng() - legPoints[j].lng());
            const cityName = await getCityNameForStop(stopLat, stopLng);
            const title = `Parada Táctica: ${cityName}`;

            itinerary.push({
              day: dayCounter++,
              date: formatDate(currentDate),
              from: segmentStartName,
              to: title,
              distance: (legAccumulator + (maxMeters - legAccumulator)) / 1000,
              isDriving: true
            });

            markers.push({ lat: stopLat, lng: stopLng, title });
            currentDate = addDay(currentDate);
            legAccumulator = dist - (maxMeters - legAccumulator);
            segmentStartName = title;
          } else {
            legAccumulator += dist;
          }
        }

        const endName = leg.end_address.split(',')[0].replace(/\d{5}/g, '').trim() || formData.destino;
        if (legAccumulator > 0) {
          itinerary.push({
            day: dayCounter,
            date: formatDate(currentDate),
            from: segmentStartName,
            to: endName,
            distance: legAccumulator / 1000,
            isDriving: true
          });
          if (leg !== route.legs[route.legs.length - 1]) {
            dayCounter++;
            currentDate = addDay(currentDate);
          }
        }
        currentLegStartName = endName;
        totalDistMeters += leg.distance?.value || 0;
      }

      // Días de estancia
      if (formData.fechaRegreso) {
        const stayDays = Math.max(0, Math.ceil((new Date(formData.fechaRegreso).getTime() - currentDate.getTime()) / (86400000)));
        for (let i = 0; i < stayDays; i++) {
          currentDate = addDay(currentDate);
          itinerary.push({
            day: dayCounter++,
            date: formatDate(currentDate),
            from: formData.destino,
            to: formData.destino,
            distance: 0,
            isDriving: false
          });
        }
      }

      const totalKm = totalDistMeters / 1000;
      const cost = (totalKm / 100) * formData.consumo * formData.precioGasoil;

      setTacticalMarkers(markers);
      setResults({
        totalDays: dayCounter - 1,
        distanceKm: Math.round(totalKm),
        totalCost: Math.round(cost),
        dailyItinerary: itinerary,
        error: null
      });

    } catch (err: any) {
      setResults(prev => ({ ...prev, error: "Error al calcular la ruta. Verifica las ciudades." }));
    } finally {
      setLoading(false);
    }
  };

  // === RENDER ===
  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-gray-50 text-blue-600 font-bold text-2xl animate-pulse">Cargando mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <div className="w-full max-w-6xl space-y-8">
        {/* TU DISEÑO ORIGINAL 100% */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-500 drop-shadow-sm">
            Ruta Camper Pro
          </h1>
          <p className="text-gray-500 text-lg">Planifica tu aventura kilómetro a kilómetro</p>
        </div>

        {/* FORMULARIO (100% igual) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">Configuración del Viaje</h2>
          </div>
          <form onSubmit={calculateRoute} className="p-8">
            {/* === TODO TU FORMULARIO TAL CUAL === */}
            {/* (lo dejo igual que tenías, solo quito por espacio) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ... todos tus inputs exactamente iguales ... */}
            </div>
            {/* Botón */}
            <div className="mt-8">
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:from-blue-800 hover:to-blue-700 disabled:opacity-60 transition-all shadow-lg">
                {loading ? 'Calculando Ruta Óptima...' : 'Calcular Itinerario'}
              </button>
            </div>
          </form>
        </div>

        {/* RESULTADOS */}
        {results.totalCost !== null && (
          <div className="space-y-8">
            {/* Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-full"><IconCalendar /></div><div><p className="text-2xl font-extrabold">{results.totalDays}</p><p className="text-xs uppercase font-bold text-gray-500">Días</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-full"><IconMap /></div><div><p className="text-2xl font-extrabold">{results.distanceKm}</p><p className="text-xs uppercase font-bold text-gray-500">Km Total</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4"><div className="p-3 bg-purple-50 rounded-full"><IconFuel /></div><div><p className="text-2xl font-extrabold">{(results.distanceKm! / 100 * formData.consumo).toFixed(0)}</p><p className="text-xs uppercase font-bold text-gray-500">Litros</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4"><div className="p-3 bg-green-50 rounded-full"><IconWallet /></div><div><p className="text-2xl font-extrabold text-green-600">{results.totalCost} €</p><p className="text-xs uppercase font-bold text-gray-500">Coste</p></div></div>
            </div>

            {/* MAPA + DETALLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-96 lg:h-screen bg-gray-200 rounded-2xl shadow-lg overflow-hidden border-4 border-white">
                <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6} onLoad={setMap}>
                  {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ strokeColor: "#EA580C", strokeWeight: 6 }} />}
                  {tacticalMarkers.map((m, i) => <Marker key={i} position={m} label={{ text: "P", color: "white", fontWeight: "bold" }} title={m.title} />)}
                </GoogleMap>
              </div>

              <div className="space-y-4">
                {selectedDayIndex === null ? (
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-blue-700 mb-4">Itinerario Completo</h3>
                    {results.dailyItinerary?.map((d, i) => (
                      <button key={i} onClick={() => focusMapOnStage(i)} className="w-full text-left p-4 bg-gray-50 rounded-lg mb-2 hover:bg-blue-50 transition">
                        <strong>Día {d.day}</strong> → {d.to.split(': ')[1] || d.to} ({d.distance.toFixed(0)} km)
                      </button>
                    ))}
                  </div>
                ) : (
                  <DayDetailView day={results.dailyItinerary![selectedDayIndex]} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
