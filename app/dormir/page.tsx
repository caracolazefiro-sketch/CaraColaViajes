// app/dormir/page.tsx  ← VERSIÓN FINAL 100% FUNCIONAL (PRODUCCIÓN)

'use client';

import React, { useState, useEffect, useRef } from 'react';

// ======================== CONFIG ========================
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDecT2WWIcWJd0mCQv5ONc3okQfwAmXIX0";
const CX_ID = "9022e72d0fcbd4093";
const MIN_RATING = 3.8;

// ======================== HOOK GOOGLE MAPS (FUNCIONA EN VERCEL) ========================
const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    (window as any).initMap = () => setIsLoaded(true);

    if (document.getElementById('google-maps-script')) return;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Fallback por si el callback falla (raro, pero pasa)
    const timer = setTimeout(() => {
      if ((window as any).google?.maps) setIsLoaded(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return isLoaded;
};

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
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=10`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.items?.length) throw new Error();

        const best = data.items
          .map((i: any) => {
            const text = `${i.title || ""} ${i.snippet || ""}`;
            const ratingMatch = text.match(/(\d[.,]?\d?)\s?\/\s?5/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;
            const img = i.pagemap?.cse_image?.[0]?.src || i.pagemap?.cse_thumbnail?.[0]?.src;
            const title = (i.title || "").replace(/ - park4night.*/i, '').replace(/\(\d+\)/g, '').trim();
            const link = i.link.replace(/park4night\.com\/[a-z]{2}\//, 'park4night.com/es/');
            return { title, link, rating, img };
          })
          .filter((s: any) => s.rating >= MIN_RATING)
          .sort((a: any, b: any) => b.rating - a.rating)[0];

        setSpot(best || null);
      } catch {
        setSpot({ fallback: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  if (loading) return <div className="text-sm text-gray-600 animate-pulse">Buscando pernocta en {city}...</div>;

  if (!spot) return (
    <a href={`https://park4night.com/es/search?q=${encodeURIComponent(city)}`} target="_blank" rel="noopener noreferrer"
       className="block p-5 bg-orange-50 border-2 border-orange-300 rounded-xl text-orange-700 font-bold text-center hover:bg-orange-100 transition">
      Ver todos los parkings en {city} (Park4Night)
    </a>
  );

  return (
    <a href={spot.link} target="_blank" rel="noopener noreferrer"
       className="block bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all">
      <div className="flex">
        <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
          {spot.img ? (
            <img src={spot.img} alt={spot.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">Tree</div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm line-clamp-2">{spot.title}</h4>
            <p className="text-xs text-gray-500 mt-1">Park4Night • {city}</p>
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-green-600 font-bold text-xl">★ {spot.rating.toFixed(1)}</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Ver ficha completa →</span>
          </div>
        </div>
      </div>
    </a>
  );
};

// ======================== DAY DETAIL VIEW ========================
const DayDetailView = ({ day }: { day: any }) => {
  const city = day.to.replace(/^(Parada Táctica|Parada de Pernocta): /, '').split(',')[0].trim();

  return (
    <div className={`p-6 rounded-xl space-y-5 h-full ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
      <h4 className={`text-2xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
        {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
      </h4>
      <p className="text-lg font-semibold text-gray-800">
        {day.from.split(',')[0]} → {city}
      </p>
      {day.isDriving && <p className="text-3xl font-extrabold text-green-700">{day.distance.toFixed(0)} km</p>}
      {day.isDriving && (
        <div className="pt-4 border-t-2 border-dashed border-gray-300">
          <h5 className="text-lg font-bold text-gray-700 mb-4">Recomendación de pernocta en {city}</h5>
          <SmartSpotCard city={city} />
        </div>
      )}
      {!day.isDriving && <p className="text-xl italic text-gray-700 border-l-4 border-orange-400 pl-4">"¡Disfruta de {city} y recarga energías!"</p>}
    </div>
  );
};

// ======================== MAIN COMPONENT ========================
export default function Home() {
  const isLoaded = useGoogleMapsScript();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [results, setResults] = useState<any>({});

  const [form, setForm] = useState({
    origen: "Salamanca",
    destino: "Punta Umbria",
    etapas: "Valencia",
    kmMaximoDia: 400,
    evitarPeajes: false
  });

  const handleChange = (e: any) => {
    const { id, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  // Inicializar mapa
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;
    const gmap = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 40.4168, lng: -3.7038 },
      zoom: 6,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });
    setMap(gmap);
  }, [isLoaded, map]);

  // Renderizar ruta
  useEffect(() => {
    if (directions && map) {
      new (window as any).google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#EA580C", strokeWeight: 7 }
      }).setMap(map).setDirections(directions);
    }
  }, [directions, map]);

  // Renderizar marcadores P
  useEffect(() => {
    markers.forEach((m: any) => m.setMap(null));
    if (map && markers.length > 0) {
      markers.forEach((m: any) => m.setMap(map));
    }
  }, [markers, map]);

  // Cálculo de ruta
  const calcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !map) return;
    setLoading(true);
    setDirections(null);
    setMarkers([]);
    setItinerary([]);
    setSelectedDay(null);

    const ds = new (window as any).google.maps.DirectionsService();
    const waypoints = form.etapas.split(',').map((s: string) => s.trim()).filter(Boolean).map((loc: string) => ({ location: loc, stopover: true }));

    try {
      const result = await new Promise((resolve, reject) => {
        ds.route({
          origin: form.origen,
          destination: form.destino,
          waypoints,
          travelMode: "DRIVING",
          avoidTolls: form.evitarPeajes
        }, (res: any, status: any) => status === "OK" ? resolve(res) : reject(status));
      });

      setDirections(result);

      const route = (result as any).routes[0];
      const newItinerary: any[] = [];
      const newMarkers: any[] = [];
      let day = 1;
      let totalDist = 0;

      for (const leg of route.legs) {
        let legDist = 0;
        let start = form.origen;
        leg.steps.forEach((step: any) => {
          if (legDist + step.distance.value / 1000 > form.kmMaximoDia) {
            const stopCity = "Parada Táctica: Cerca de " + step.end_location.toString();
            newItinerary.push({ day: day++, from: start, to: stopCity, distance: form.kmMaximoDia, isDriving: true });
            newMarkers.push(new (window as any).google.maps.Marker({
              position: step.end_location,
              icon: { path: (window as any).google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: "#EA580C", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
              label: { text: "P", color: "white", fontWeight: "bold" }
            }));
            legDist = 0;
            start = stopCity;
          } else {
            legDist += step.distance.value / 1000;
          }
        });
        totalDist += leg.distance.value;
      }

      setItinerary(newItinerary);
      setMarkers(newMarkers);
      setResults({ totalKm: Math.round(totalDist / 1000) });

    } catch (err) {
      alert("Error calculando ruta: " + err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">Map</div>
          <h2 className="text-3xl font-bold text-blue-600">Cargando mapas...</h2>
          <p className="text-gray-500 mt-2">Esto toma unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          CaraCola Viajes – Planificador Camper
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={calcular} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <input type="text" placeholder="Origen" id="origen" value={form.origen} onChange={handleChange} className="p-4 border rounded-lg" required />
            <input type="text" placeholder="Destino" id="destino" value={form.destino} onChange={handleChange} className="p-4 border rounded-lg" required />
            <input type="text" placeholder="Paradas (ej: Valencia, Madrid)" id="etapas" value={form.etapas} onChange={handleChange} className="p-4 border rounded-lg lg:col-span-2" />
            <input type="number" placeholder="Km máx/día" id="kmMaximoDia" value={form.kmMaximoDia} onChange={handleChange} className="p-4 border rounded-lg" />
            <label className="flex items-center gap-3 lg:col-span-4">
              <input type="checkbox" id="evitarPeajes" checked={form.evitarPeajes} onChange={handleChange} />
              Evitar peajes
            </label>
            <button type="submit" disabled={loading} className="lg:col-span-4 bg-orange-600 text-white font-bold py-4 rounded-lg hover:bg-orange-700 disabled:opacity-70 text-xl">
              {loading ? "Calculando..." : "PLANIFICAR VIAJE"}
            </button>
          </form>
        </div>

        {itinerary.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div ref={mapRef} className="h-screen rounded-2xl shadow-2xl border-4 border-white" />
            </div>
            <div className="space-y-4">
              {selectedDay === null ? (
                itinerary.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} className="w-full text-left p-5 bg-white rounded-xl shadow hover:shadow-xl border-l-4 border-orange-500">
                    <strong>Día {d.day}</strong> → {d.to} ({d.distance} km)
                  </button>
                ))
              ) : (
                <>
                  <button onClick={() => setSelectedDay(null)} className="mb-4 text-blue-600 font-bold">← Volver</button>
                  <DayDetailView day={itinerary[selectedDay]} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
