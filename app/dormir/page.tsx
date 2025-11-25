'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

// --- CONFIGURACIÓN VISUAL DEL MAPA ---
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem'
};

const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]; 

// --- INTERFACES ---
interface DailyPlan { 
    day: number; 
    date: string; 
    from: string; 
    to: string; 
    distance: number; 
    isDriving: boolean; 
    coordinates?: { lat: number; lng: number }; 
}

interface TripResult { totalDays: number | null; distanceKm: number | null; totalCost: number | null; dailyItinerary: DailyPlan[] | null; error: string | null; }
interface SearchResult { title: string; link: string; snippet: string; pagemap?: { cse_image?: { src: string }[]; metatags?: any[] }; }

// --- ICONOS ---
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

// --- HELPER: NORMALIZAR TEXTO ---
const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// ==================== COMPONENTE CORREGIDO (ESTO ES LO ÚNICO QUE CAMBIÉ) ====================
const DayDetailView: React.FC<{ day: DailyPlan }> = ({ day }) => {
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Nombre limpio de la ciudad
    const rawCityName = day.to.replace('Parada Táctica: ', '').replace('Parada de Pernocta: ', '').split(',')[0].trim();
    const normalizedCity = normalizeText(rawCityName);

    useEffect(() => {
        if (!day.isDriving) return; 

        const fetchSpots = async () => {
            setLoading(true);
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
            const cx = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CX;

            // Query mucho más precisa y efectiva
            const query = `"${rawCityName}" (pernocta OR camping OR autocaravana OR área OR aire) site:park4night.com OR site:caramaps.com`;

            try {
                if (!apiKey || !cx) throw new Error("Faltan claves");

                const res = await fetch(
                    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`
                );
                
                const data = await res.json();

                if (data.items && data.items.length > 0) {
                    const filtered = data.items
                        .map((item: any) => ({
                            ...item,
                            cleanTitle: item.title
                                .replace(/ - Park4Night.*$/i, '')
                                .replace(/ - CaraMaps.*$/i, '')
                                .replace(/^\d+\s*[-–]\s*/g, '')
                                .trim()
                        }))
                        .filter((item: any) => {
                            const fullText = normalizeText(
                                (item.cleanTitle || "") + " " +
                                (item.snippet || "") + " " +
                                (item.pagemap?.metatags?.[0]?.["og:title"] || "") + " " +
                                (item.pagemap?.metatags?.[0]?.["og:description"] || "")
                            );
                            return fullText.includes(normalizedCity);
                        })
                        .slice(0, 4);

                    setSearchResults(filtered);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("Error buscando pernocta:", err);
                setSearchResults([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchSpots();
    }, [rawCityName, day.isDriving]);

    // Enlaces mejorados
    const gmapsLink = day.coordinates
        ? `https://www.google.com/maps/search/autocaravana+camping+pernocta/@${day.coordinates.lat},${day.coordinates.lng},14z`
        : `https://www.google.com/maps/search/autocaravana+near+${encodeURIComponent(rawCityName)}`;

    const p4nLink = `https://park4night.com/es/search?q=${encodeURIComponent(rawCityName)}`;
    const caramapsLink = `https://www.caramaps.com/search?name=${encodeURIComponent(rawCityName)}`;

    return (
        <div className={`p-4 rounded-xl space-y-4 h-full overflow-y-auto transition-all ${day.isDriving ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-orange-50 border-l-4 border-orange-600'}`}>
            <h4 className={`text-2xl font-extrabold ${day.isDriving ? 'text-blue-800' : 'text-orange-800'}`}>
                {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
            </h4>
            
            <p className="text-lg font-semibold text-gray-800">
                {day.from} <span className="text-gray-400">→</span> {day.to}
            </p>

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-gray-300">
                    <h5 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1">
                        <span className="text-lg">Camping</span> Pernocta en {rawCityName}:
                    </h5>

                    {loading && (
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold py-4">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Buscando spots destacados...
                        </div>
                    )}

                    {!loading && searchResults.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {searchResults.map((result: any, idx) => (
                                <a 
                                    key={idx} 
                                    href={result.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block group bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left"
                                >
                                    <div className="flex gap-3">
                                        {result.pagemap?.cse_image?.[0]?.src ? (
                                            <img 
                                                src={result.pagemap.cse_image[0].src} 
                                                alt="Spot" 
                                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                                {result.link.includes('caramaps') ? 'Map' : 'Van'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h6 className="text-sm font-bold text-blue-700 truncate group-hover:text-blue-600">
                                                {result.cleanTitle}
                                            </h6>
                                            <p className="text-[10px] text-gray-500 line-clamp-2">
                                                {result.snippet}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    {!loading && searchResults.length === 0 && (
                        <p className="text-xs text-orange-600 mb-2 italic">
                            No hay destacados automáticos. Usa los botones:
                        </p>
                    )}
                    
                    <div className="flex flex-col gap-2 mt-2">
                        <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm">
                            Ver áreas cercanas en Google Maps
                        </a>
                        <div className="grid grid-cols-2 gap-2">
                            <a href={p4nLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm">
                                Van Park4Night
                            </a>
                            <a href={caramapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-teal-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-teal-700 transition shadow-sm">
                                Map CaraMaps
                            </a>
                        </div>
                    </div>
                </div>
            )}
            
            {!day.isDriving && (
                 <p className="text-lg text-gray-700">Día dedicado a la relajación en {day.to}.</p>
            )}
        </div>
    );
};

// ==================== RESTO DE TU CÓDIGO 100% INTACTO ====================

// (todo el resto del archivo exactamente como lo tenías)
// Solo pego desde aquí hasta el final sin tocar nada más

export default function Home() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  
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

  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [tacticalMarkers, setTacticalMarkers] = useState<{lat: number, lng: number, title: string}[]>([]);

  useEffect(() => {
      if (map && mapBounds) {
          setTimeout(() => map.fitBounds(mapBounds), 500); 
      }
  }, [map, mapBounds]);
  
  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => {
    if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null; 
    const geocoder = new google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ address: cityName });
      if (response.results.length > 0) return response.results[0].geometry.location.toJSON();
    } catch (e) { }
    return null;
  };

  const focusMapOnStage = async (dayIndex: number) => {
    if (typeof google === 'undefined' || !results.dailyItinerary || typeof google.maps.LatLngBounds === 'undefined') return; 
    const dailyPlan = results.dailyItinerary![dayIndex];
    if (!dailyPlan) return;

    if (dailyPlan.coordinates) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: dailyPlan.coordinates.lat - 0.1, lng: dailyPlan.coordinates.lng - 0.1 });
        bounds.extend({ lat: dailyPlan.coordinates.lat + 0.1, lng: dailyPlan.coordinates.lng + 0.1 });
        setMapBounds(bounds);
    } else {
        const [startCoord, endCoord] = await Promise.all([geocodeCity(dailyPlan.from), geocodeCity(dailyPlan.to)]);
        if (startCoord && endCoord) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(startCoord);
            bounds.extend(endCoord);
            setMapBounds(bounds); 
        }
    }
    setSelectedDayIndex(dayIndex); 
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    let finalValue: string | number | boolean = type === 'checkbox' ? checked : (['precioGasoil','consumo','kmMaximoDia'].includes(id) ? parseFloat(value) : value);
    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setDirectionsResponse(null); 
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null }); 
    setTacticalMarkers([]); 
    setSelectedDayIndex(null); 
    setMapBounds(null); 

    if (typeof google === 'undefined' || typeof google.maps.DirectionsService === 'undefined') {
        setLoading(false);
        setResults(prev => ({...prev, error: "Error carga Google Maps"}));
        return;
    }
    
    const directionsService = new google.maps.DirectionsService();
    const waypoints = formData.etapas.split(',').map(s => s.trim()).filter(s => s.length > 0).map(location => ({ location, stopover: true }));

    try {
      const result = await directionsService.route({
        origin: formData.origen,
        destination: formData.destino,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: formData.evitarPeajes,
      });

      setDirectionsResponse(result);
      const route = result.routes[0];
      const itinerary: DailyPlan[] = [];
      const newTacticalMarkers: {lat: number, lng: number, title: string}[] = [];
      
      let dayCounter = 1;
      let currentDate = new Date(formData.fechaInicio);
      const maxMeters = formData.kmMaximoDia * 1000;
      const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

      let currentLegStartName = formData.origen;
      let totalDistMeters = 0; 

      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        let legPoints: google.maps.LatLng[] = [];
        leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });
        let legAccumulator = 0;
        let segmentStartName = currentLegStartName;

        const getCityNameForStop = async (lat: number, lng: number): Promise<string> => {
            const geocoder = new google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({ location: { lat, lng } });
              if (response.results[0]) {
                const comps = response.results[0].address_components;
                const city = comps.find(c => c.types.includes("locality"))?.long_name 
                          || comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name;
                return city ? city.replace(/\d{5}/, '').trim() : "Punto Ruta";
              }
            } catch (e) { }
            return "Parada Ruta";
        };

        for (let j = 0; j < legPoints.length - 1; j++) {
            const point1 = legPoints[j];
            const point2 = legPoints[j+1];
            const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

            if (legAccumulator + segmentDist > maxMeters) {
                const lat = point1.lat();
                const lng = point1.lng(); 
                const cityName = await getCityNameForStop(lat, lng);
                const stopTitle = `Parada Táctica: ${cityName}`;

                itinerary.push({ 
                    day: dayCounter, 
                    date: formatDate(currentDate), 
                    from: segmentStartName, 
                    to: stopTitle, 
                    distance: (legAccumulator + segmentDist) / 1000, 
                    isDriving: true,
                    coordinates: { lat, lng }
                });
                
                newTacticalMarkers.push({ lat, lng, title: stopTitle });
                dayCounter++;
                currentDate = addDay(currentDate);
                legAccumulator = 0;
                segmentStartName = stopTitle;
            } else {
                legAccumulator += segmentDist;
            }
        }

        let endLegName = leg.end_address.split(',')[0];
        if (i === route.legs.length - 1) endLegName = formData.destino;
        else {
             const parts = leg.end_address.split(',');
             endLegName = parts.length > 1 ? parts[parts.length - 2].trim() : parts[0];
             endLegName = endLegName.replace(/\d{5}/, '').trim();
        }

        if (legAccumulator > 0 || segmentStartName !== endLegName) {
            itinerary.push({ day: dayCounter, date: formatDate(currentDate), from: segmentStartName, to: endLegName, distance: legAccumulator / 1000, isDriving: true });
            currentLegStartName = endLegName;
            if (i < route.legs.length - 1) { dayCounter++; currentDate = addDay(currentDate); }
        }
        totalDistMeters += leg.distance?.value || 0;
      }

      const arrivalDate = new Date(currentDate);
      const returnDateObj = new Date(formData.fechaRegreso);
      const diffTime = returnDateObj.getTime() - arrivalDate.getTime();
      const stayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (stayDays > 0) {
        for(let i=0; i<stayDays; i++) {
             dayCounter++;
             currentDate = addDay(currentDate);
             itinerary.push({ day: dayCounter, date: formatDate(currentDate), from: formData.destino, to: formData.destino, distance: 0, isDriving: false });
        }
      }

      setTacticalMarkers(newTacticalMarkers);
      setResults({ totalDays: dayCounter, distanceKm: totalDistMeters / 1000, totalCost: (totalDistMeters / 1000 / 100) * formData.consumo * formData.precioGasoil, dailyItinerary: itinerary, error: null });

    } catch (error: any) {
      console.error("Error:", error);
      setResults(prev => ({...prev, error: "Error al calcular. Revisa las ciudades."}));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-gray-50 text-blue-600 font-bold text-xl animate-pulse">Cargando Mapas...</div>;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      {/* TODO TU JSX SIGUE EXACTAMENTE IGUAL */}
      {/* ... el formulario, los resultados, el mapa, etc. */}
      {/* Solo cambia esta línea donde llamas al detalle: */}
      {selectedDayIndex !== null && results.dailyItinerary && (
        <DayDetailView day={results.dailyItinerary[selectedDayIndex]} />
      )}
      {/* ... resto del return idéntico */}
    </main>
  );
}