'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

// --- CONFIGURACIÓN VISUAL ---
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// --- ICONOS MAPA ---
const ICON_URL_CAMPING = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";   // Rojo
const ICON_URL_RESTAURANT = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"; // Azul
const ICONS_ITINERARY = {
    startEnd: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    tactical: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
};

// --- INTERFACES ---
interface Coordinates { lat: number; lng: number; }
interface DailyPlan {
    day: number; date: string; from: string; to: string; distance: number; isDriving: boolean;
    coordinates?: Coordinates; type: 'overnight' | 'tactical' | 'start' | 'end';
}
interface TripResult {
    totalDays: number | null; distanceKm: number | null; totalCost: number | null;
    dailyItinerary: DailyPlan[] | null; error: string | null;
}
interface PlaceWithDistance {
    name?: string;
    rating?: number;
    vicinity?: string;
    place_id?: string;
    geometry?: { location?: any; };
    distanceFromCenter?: number;
    type?: 'camping' | 'restaurant';
}

// --- ICONOS SVG ---
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

// --- COMPONENTE: LISTA DE SPOTS Y SERVICIOS ---
const DaySpotsList: React.FC<{
    day: DailyPlan,
    campings: PlaceWithDistance[],
    restaurants: PlaceWithDistance[],
    loadingCampings: boolean,
    loadingRestaurants: boolean,
    showRestaurants: boolean,
    onToggleRestaurants: () => void,
}> = ({ day, campings, restaurants, loadingCampings, loadingRestaurants, showRestaurants, onToggleRestaurants }) => {
    const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split('|')[0].trim();

    return (
        <div className={`p-4 rounded-xl space-y-4 h-full overflow-y-auto transition-all ${day.isDriving ? 'bg-red-50 border-l-4 border-red-600' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-red-800' : 'text-orange-800'}`}>
                        {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
                    </h4>
                    <p className="text-md font-semibold text-gray-800">
                        {day.from.split('|')[0]} <span className="text-gray-400">➝</span> {rawCityName}
                    </p>
                </div>
            </div>

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-red-200">

                    {/* --- BARRA DE HERRAMIENTAS (SERVICIOS) --- */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-200 flex items-center gap-1 cursor-default shadow-sm">
                            <span>🚐</span> Pernocta ({campings.length})
                        </div>
                        <button
                            onClick={onToggleRestaurants}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shadow-sm
                            ${showRestaurants
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                            <span>🍳</span> Restaurantes
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* LISTA 1: SPOTS */}
                        <div>
                            <h5 className="text-xs font-bold text-red-800 mb-2 border-b border-red-100 pb-1">
                                Áreas y Campings Cercanos
                            </h5>

                            {loadingCampings && <p className="text-xs text-red-500 animate-pulse">Buscando áreas...</p>}

                            {!loadingCampings && campings.length > 0 && (
                                <div className="space-y-2">
                                    {campings.map((spot, idx) => (
                                        <div
                                            key={`camp-${idx}`}
                                            className="group bg-white p-2 rounded border border-red-200 hover:border-red-400 cursor-pointer transition-all flex gap-2 items-center shadow-sm"
                                            onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                        >
                                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-600">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h6 className="text-xs font-bold text-gray-800 truncate group-hover:text-red-600">{spot.name}</h6>
                                                <span className="text-[10px] text-gray-400 truncate block">{spot.vicinity?.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!loadingCampings && campings.length === 0 && <p className="text-xs text-gray-400 italic">No hay campings cercanos.</p>}
                        </div>

                        {/* LISTA 2: RESTAURANTES (CON CONTADOR VISIBLE) */}
                        {showRestaurants && (
                            <div className="animate-fadeIn">
                                <div className="flex items-center justify-between mb-2 border-b border-blue-100 pb-1">
                                    <h5 className="text-xs font-bold text-blue-800">Restaurantes Cercanos</h5>
                                    {!loadingRestaurants && (
                                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {restaurants.length}
                                        </span>
                                    )}
                                </div>

                                {loadingRestaurants && <p className="text-xs text-blue-500 animate-pulse">Buscando comida...</p>}

                                {!loadingRestaurants && restaurants.length > 0 && (
                                    <div className="space-y-2">
                                        {restaurants.map((spot, idx) => (
                                            <div
                                                key={`rest-${idx}`}
                                                className="group bg-white p-2 rounded border border-blue-200 hover:border-blue-400 cursor-pointer transition-all flex gap-2 items-center shadow-sm"
                                                onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                            >
                                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-blue-600">
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h6 className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600">{spot.name}</h6>
                                                    <div className="flex items-center gap-2">
                                                        {spot.rating && <span className="text-[10px] font-bold text-orange-500">★ {spot.rating}</span>}
                                                        <span className="text-[10px] text-gray-400 truncate">{spot.vicinity?.split(',')[0]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!loadingRestaurants && restaurants.length === 0 && <p className="text-xs text-gray-400 italic">No hay restaurantes cerca.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {!day.isDriving && <p className="text-sm text-gray-700">Día de relax en {rawCityName}.</p>}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function Home() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
        language: 'es'
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

    // --- ESTADOS MULTI-CAPA ---
    const [campings, setCampings] = useState<PlaceWithDistance[]>([]);
    const [restaurants, setRestaurants] = useState<PlaceWithDistance[]>([]);
    const [loadingCampings, setLoadingCampings] = useState(false);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [showRestaurants, setShowRestaurants] = useState(false);

    const [formData, setFormData] = useState({
        fechaInicio: new Date().toISOString().split('T')[0],
        origen: 'Salamanca',
        fechaRegreso: '',
        destino: 'Punta Umbria',
        etapas: 'Valencia',
        consumo: 10.0,
        precioGasoil: 1.60,
        kmMaximoDia: 400,
        evitarPeajes: false,
    });

    const [results, setResults] = useState<TripResult>({
        totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null
    });

    const [loading, setLoading] = useState(false);
    const [showWaypoints, setShowWaypoints] = useState(true);

    useEffect(() => { if (!showWaypoints) setFormData(prev => ({ ...prev, etapas: '' })); }, [showWaypoints]);

    useEffect(() => {
        if (results.distanceKm !== null) {
            const liters = (results.distanceKm / 100) * formData.consumo;
            const newCost = liters * formData.precioGasoil;
            setResults(prev => ({ ...prev, totalCost: newCost }));
        }
    }, [formData.consumo, formData.precioGasoil, results.distanceKm]);

    // --- ARREGLO CLAVE: ZOOM GENERAL ---
    useEffect(() => {
        if (map) {
            if (mapBounds) {
                setTimeout(() => map.fitBounds(mapBounds), 500);
            } else if (directionsResponse && selectedDayIndex === null) {
                // Si estamos en VISTA GENERAL, hacemos zoom a toda la ruta
                const routeBounds = directionsResponse.routes[0].bounds;
                setTimeout(() => map.fitBounds(routeBounds), 500);
            }
        }
    }, [map, mapBounds, directionsResponse, selectedDayIndex]);

    const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => {
        if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null;
        const geocoder = new google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({ address: cityName });
            if (response.results.length > 0) return response.results[0].geometry.location.toJSON();
        } catch (e) { }
        return null;
    };

    const searchPlaces = useCallback((location: Coordinates, type: 'camping' | 'restaurant') => {
        if (!map || typeof google === 'undefined') return;

        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(location.lat, location.lng);

        let keywords = 'camping OR "area autocaravanas" OR "rv park" OR "parking caravanas"';
        let radius = 20000;

        if (type === 'restaurant') {
            keywords = 'restaurante OR comida OR bar';
            radius = 5000;
        }

        const request: google.maps.places.PlaceSearchRequest = {
            location: centerPoint, radius, keyword: keywords
        };

        if (type === 'camping') setLoadingCampings(true);
        else setLoadingRestaurants(true);

        service.nearbySearch(request, (results, status) => {
            if (type === 'camping') setLoadingCampings(false);
            else setLoadingRestaurants(false);

            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const spotsWithDistance: PlaceWithDistance[] = results.map(spot => {
                    let dist = 999999;
                    if (spot.geometry?.location) {
                        dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);
                    }
                    return {
                        name: spot.name,
                        rating: spot.rating,
                        vicinity: spot.vicinity,
                        place_id: spot.place_id,
                        geometry: spot.geometry,
                        distanceFromCenter: dist,
                        type: type
                    };
                });
                spotsWithDistance.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0));

                if (type === 'camping') setCampings(spotsWithDistance);
                else setRestaurants(spotsWithDistance);
            } else {
                if (type === 'camping') setCampings([]);
                else setRestaurants([]);
            }
        });
    }, [map]);

    const handleToggleRestaurants = () => {
        const newState = !showRestaurants;
        setShowRestaurants(newState);
        if (newState && selectedDayIndex !== null && results.dailyItinerary) {
            const day = results.dailyItinerary[selectedDayIndex];
            if (day.coordinates) {
                searchPlaces(day.coordinates, 'restaurant');
            } else {
                const cleanTo = day.to.replace('📍 Parada Táctica: ', '').split('|')[0];
                geocodeCity(cleanTo).then(coord => { if (coord) searchPlaces(coord, 'restaurant'); });
            }
        }
    };

    const focusMapOnStage = async (dayIndex: number) => {
        if (typeof google === 'undefined' || !results.dailyItinerary) return;

        const dailyPlan = results.dailyItinerary[dayIndex];
        if (!dailyPlan) return;

        setSelectedDayIndex(dayIndex);
        setShowRestaurants(false);
        setRestaurants([]);

        if (dailyPlan.coordinates) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: dailyPlan.coordinates.lat + 0.4, lng: dailyPlan.coordinates.lng + 0.4 });
            bounds.extend({ lat: dailyPlan.coordinates.lat - 0.4, lng: dailyPlan.coordinates.lng - 0.4 });
            setMapBounds(bounds);
            searchPlaces(dailyPlan.coordinates, 'camping');
        } else {
            setCampings([]);
            const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
            const coord = await geocodeCity(cleanTo);
            if (coord) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend({ lat: coord.lat + 0.4, lng: coord.lng + 0.4 });
                bounds.extend({ lat: coord.lat - 0.4, lng: coord.lng - 0.4 });
                setMapBounds(bounds);
                searchPlaces(coord, 'camping');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        let finalValue: string | number | boolean = type === 'checkbox' ? checked : (['precioGasoil', 'consumo', 'kmMaximoDia'].includes(id) ? parseFloat(value) : value);
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleReturnHome = () => {
        setFormData(prev => ({ ...prev, origen: prev.destino, destino: prev.origen }));
    };

    const calculateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setDirectionsResponse(null);
        setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
        setSelectedDayIndex(null);
        setCampings([]); setRestaurants([]); setShowRestaurants(false);

        if (typeof google === 'undefined' || typeof google.maps.DirectionsService === 'undefined') {
            setLoading(false);
            setResults(prev => ({ ...prev, error: "Error carga Google Maps" }));
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
                leg.steps.forEach(step => { if (step.path) legPoints = legPoints.concat(step.path); });
                let legAccumulator = 0;
                let segmentStartName = currentLegStartName;

                const getCityAndProvince = async (lat: number, lng: number): Promise<string> => {
                    const geocoder = new google.maps.Geocoder();
                    try {
                        const response = await geocoder.geocode({ location: { lat, lng } });
                        if (response.results[0]) {
                            const comps = response.results[0].address_components;
                            const city = comps.find(c => c.types.includes("locality"))?.long_name || comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "Punto Ruta";
                            const province = comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name;
                            return (province && city !== province) ? `${city}|${province}` : city;
                        }
                    } catch (e) { }
                    return "Parada Ruta";
                };

                for (let j = 0; j < legPoints.length - 1; j++) {
                    const point1 = legPoints[j];
                    const point2 = legPoints[j + 1];
                    const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

                    if (legAccumulator + segmentDist > maxMeters) {
                        const lat = point1.lat();
                        const lng = point2.lng();
                        const locationString = await getCityAndProvince(lat, lng);
                        const stopTitle = `📍 Parada Táctica: ${locationString}`;

                        itinerary.push({
                            day: dayCounter, date: formatDate(currentDate), from: segmentStartName, to: stopTitle, distance: (legAccumulator + segmentDist) / 1000, isDriving: true,
                            coordinates: { lat, lng }, type: 'tactical'
                        });
                        dayCounter++;
                        currentDate = addDay(currentDate);
                        legAccumulator = 0;
                        segmentStartName = locationString;
                    } else {
                        legAccumulator += segmentDist;
                    }
                }

                let endLegName = leg.end_address.split(',')[0];
                if (i === route.legs.length - 1) endLegName = formData.destino;

                if (legAccumulator > 0 || segmentStartName !== endLegName) {
                    const isFinalDest = i === route.legs.length - 1;
                    itinerary.push({
                        day: dayCounter, date: formatDate(currentDate), from: segmentStartName, to: endLegName, distance: legAccumulator / 1000, isDriving: true,
                        coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() }, type: isFinalDest ? 'end' : 'overnight'
                    });
                    currentLegStartName = endLegName;
                    if (i < route.legs.length - 1) { dayCounter++; currentDate = addDay(currentDate); }
                }
                totalDistMeters += leg.distance?.value || 0;
            }

            const arrivalDate = new Date(currentDate);
            const returnDateObj = new Date(formData.fechaRegreso);
            if (formData.fechaRegreso) {
                const diffTime = returnDateObj.getTime() - arrivalDate.getTime();
                const stayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (stayDays > 0) {
                    for (let i = 0; i < stayDays; i++) {
                        dayCounter++;
                        currentDate = addDay(currentDate);
                        itinerary.push({ day: dayCounter, date: formatDate(currentDate), from: formData.destino, to: formData.destino, distance: 0, isDriving: false, type: 'end' });
                    }
                }
            }

            const liters = (totalDistMeters / 1000 / 100) * formData.consumo;
            setResults({ totalDays: dayCounter, distanceKm: totalDistMeters / 1000, totalCost: liters * formData.precioGasoil, dailyItinerary: itinerary, error: null });

        } catch (error: any) {
            console.error("Error:", error);
            setResults(prev => ({ ...prev, error: "Error al calcular. Revisa las ciudades." }));
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 font-bold text-xl animate-pulse">Cargando CaraCola...</div>;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
            <div className="w-full max-w-6xl space-y-6">

                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-red-600 drop-shadow-sm tracking-tight">
                        CaraCola Viajes 🐌
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base">Tu ruta en autocaravana, paso a paso.</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
                    <div className="bg-red-600 px-4 py-3">
                        <h2 className="text-white font-bold text-base flex items-center gap-2">⚙️ Configura tu Ruta</h2>
                    </div>

                    <form onSubmit={calculateRoute} className="p-5 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Inicio</label>
                                <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Regreso (Opcional)</label>
                                <input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Origen</label>
                                    <button type="button" onClick={handleReturnHome} className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer" title="Intercambiar Origen y Destino">🔄 Vuelta a Casa</button>
                                </div>
                                <input type="text" id="origen" value={formData.origen} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-300" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Destino</label>
                                <input type="text" id="destino" value={formData.destino} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-300" required />
                            </div>

                            <div className="md:col-span-2 lg:col-span-4 bg-red-50 p-3 rounded border border-red-100">
                                <label className="flex items-center gap-2 cursor-pointer text-red-800 font-bold text-xs mb-1 select-none">
                                    <input type="checkbox" className="text-red-600 rounded focus:ring-red-500" checked={showWaypoints} onChange={() => setShowWaypoints(!showWaypoints)} />
                                    ➕ Añadir Paradas Intermedias
                                </label>
                                {showWaypoints && (
                                    <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} placeholder="Ej: Valencia, Madrid" className="w-full px-3 py-2 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-red-500 outline-none" />
                                )}
                            </div>

                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Ritmo (Km/día)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.kmMaximoDia} km</span></div>
                                    <input type="range" id="kmMaximoDia" min="100" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Consumo (L/100)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.consumo} L</span></div>
                                    <input type="range" id="consumo" min="5" max="25" step="0.1" value={formData.consumo} onChange={handleChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Precio Diésel (€/L)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.precioGasoil} €</span></div>
                                    <input type="range" id="precioGasoil" min="1.00" max="2.50" step="0.01" value={formData.precioGasoil} onChange={handleChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
                                </div>
                            </div>

                            <div className="md:col-span-4 flex flex-col md:flex-row items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-bold text-xs bg-gray-50 px-4 py-3 rounded border border-gray-200 w-full md:w-auto justify-center h-full">
                                    <input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange} className="text-red-600 rounded focus:ring-red-500" />
                                    🚫 Evitar Peajes
                                </label>
                                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded font-bold text-sm hover:from-red-700 hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50">
                                    {loading ? 'Calculando Ruta...' : '🚀 Calcular Itinerario'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {results.totalCost !== null && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-red-50 rounded-full"><IconCalendar /></div><div><p className="text-xl font-extrabold text-gray-800">{results.totalDays}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Días</p></div></div>
                            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-blue-50 rounded-full"><IconMap /></div><div><p className="text-xl font-extrabold text-gray-800">{results.distanceKm?.toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Km</p></div></div>
                            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-purple-50 rounded-full"><IconFuel /></div><div><p className="text-xl font-extrabold text-gray-800">{((results.distanceKm! / 100) * formData.consumo).toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Litros</p></div></div>
                            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-green-50 rounded-full"><IconWallet /></div><div><p className="text-xl font-extrabold text-green-600">{results.totalCost?.toFixed(0)} €</p><p className="text-[10px] text-gray-500 font-bold uppercase">Coste</p></div></div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                                <h3 className="font-bold text-gray-700 text-sm mb-3">Selecciona una Etapa:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setSelectedDayIndex(null); setMapBounds(null); setCampings([]); setRestaurants([]); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedDayIndex === null ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}
                                    >
                                        🌎 General
                                    </button>
                                    {results.dailyItinerary?.map((day, index) => (
                                        <button
                                            key={index}
                                            onClick={() => focusMapOnStage(index)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${selectedDayIndex === index ? 'bg-red-600 text-white border-red-600 shadow-md' : (day.isDriving ? 'bg-white text-gray-700 border-gray-200 hover:border-red-300' : 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300')}`}
                                        >
                                            <span>{day.isDriving ? '🚐' : '🏖️'}</span>
                                            Día {day.day}: {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative">
                                    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6} onLoad={map => { setMap(map); if (mapBounds) map.fitBounds(mapBounds); }}>
                                        {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ strokeColor: "#DC2626", strokeWeight: 4 }} />}

                                        {results.dailyItinerary?.map((day, i) => day.coordinates && (
                                            <Marker
                                                key={`itinerary-${i}`}
                                                position={day.coordinates}
                                                icon={day.type === 'tactical' ? ICONS_ITINERARY.tactical : ICONS_ITINERARY.startEnd}
                                                title={day.to}
                                            />
                                        ))}

                                        {campings.map((spot, i) => spot.geometry?.location && (
                                            <Marker
                                                key={`camp-${i}`}
                                                position={spot.geometry.location}
                                                icon={ICON_URL_CAMPING}
                                                label={{ text: (i + 1).toString(), color: "white", fontWeight: "bold", fontSize: "10px" }}
                                                title={spot.name}
                                                onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                            />
                                        ))}

                                        {showRestaurants && restaurants.map((spot, i) => spot.geometry?.location && (
                                            <Marker
                                                key={`rest-${i}`}
                                                position={spot.geometry.location}
                                                icon={ICON_URL_RESTAURANT}
                                                label={{ text: (i + 1).toString(), color: "white", fontWeight: "bold", fontSize: "10px" }}
                                                title={spot.name}
                                                onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                            />
                                        ))}
                                    </GoogleMap>
                                </div>

                                <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                                    <div className='p-0 h-full overflow-hidden'>
                                        {selectedDayIndex === null ? (
                                            <div className="text-center pt-8 overflow-y-auto h-full p-4">
                                                <h4 className="text-xl font-extrabold text-red-600 mb-1">Itinerario Completo</h4>
                                                <div className="text-sm font-bold text-gray-700 mb-2 bg-red-50 inline-block px-3 py-1 rounded-full">
                                                    {formData.origen} ➝ {formData.destino}
                                                </div>
                                                <p className="text-xs text-gray-400 mb-4">Haz clic en una fila para ver detalles 👇</p>

                                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                                    <table className="min-w-full text-xs text-left">
                                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase"><tr><th className="px-3 py-2">Día</th><th className="px-3 py-2 text-right">Km</th></tr></thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {results.dailyItinerary?.map((day, index) => (
                                                                <tr
                                                                    key={index}
                                                                    onClick={() => focusMapOnStage(index)}
                                                                    className="hover:bg-red-50 transition cursor-pointer"
                                                                >
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium text-gray-700 flex items-center gap-1">
                                                                            <span className="text-base">{day.isDriving ? '🚐' : '🏖️'}</span>
                                                                            <span>Día {day.day}</span>
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                                            {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right font-mono text-gray-500 text-xs align-top pt-3">
                                                                        {day.isDriving ? `${day.distance.toFixed(0)} km` : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <DaySpotsList
                                                day={results.dailyItinerary![selectedDayIndex]}
                                                campings={campings}
                                                restaurants={restaurants}
                                                loadingCampings={loadingCampings}
                                                loadingRestaurants={loadingRestaurants}
                                                showRestaurants={showRestaurants}
                                                onToggleRestaurants={handleToggleRestaurants}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {results.error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-center font-bold">⚠️ {results.error}</div>}
            </div>
        </main>
    );
}