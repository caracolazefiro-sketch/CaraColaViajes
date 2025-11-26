'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

// --- CONFIGURACIÓN VISUAL ---
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// --- ICONOS MAPA ---
const ICONS = {
    startEnd: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    overnight: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    tactical: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    spot: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png"
};

// --- INTERFACES (MODIFICADAS PARA EVITAR ERROR DE BUILD 'google is undefined') ---
interface Coordinates { lat: number; lng: number; }
interface DailyPlan {
    day: number; date: string; from: string; to: string; distance: number; isDriving: boolean;
    coordinates?: Coordinates; type: 'overnight' | 'tactical' | 'start' | 'end';
}
interface TripResult {
    totalDays: number | null; distanceKm: number | null; totalCost: number | null;
    dailyItinerary: DailyPlan[] | null; error: string | null;
}

// Definimos una interfaz manual para los spots en lugar de depender de google.maps.places.PlaceResult
// Esto evita que el servidor falle al compilar.
interface PlaceWithDistance {
    name?: string;
    rating?: number;
    vicinity?: string;
    place_id?: string;
    geometry?: {
        location?: any; // Usamos any para no pelear con tipos de Google en el build
    };
    distanceFromCenter?: number; // en metros
}

// --- ICONOS SVG ---
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

// --- COMPONENTE: LISTA DE SPOTS ---
const DaySpotsList: React.FC<{
    day: DailyPlan,
    spots: PlaceWithDistance[],
    isLoading: boolean,
    onCategoryChange: (cat: 'camping' | 'restaurant') => void,
    currentCategory: 'camping' | 'restaurant'
}> = ({ day, spots, isLoading, onCategoryChange, currentCategory }) => {
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
                    {/* SELECTOR DE CATEGORÍA */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => onCategoryChange('camping')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${currentCategory === 'camping' ? 'bg-red-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-red-50'}`}
                        >
                            🚐 Pernocta
                        </button>
                        <button
                            onClick={() => onCategoryChange('restaurant')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${currentCategory === 'restaurant' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-blue-50'}`}
                        >
                            🍳 Comer
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-gray-600">
                            {currentCategory === 'camping' ? 'Áreas cercanas (20km):' : 'Restaurantes cercanos:'}
                        </h5>
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold">
                            {spots.length}
                        </span>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-70">
                            <div className={`w-6 h-6 border-2 ${currentCategory === 'camping' ? 'border-red-600' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
                            <p className="text-xs text-gray-500 font-medium">Buscando...</p>
                        </div>
                    )}

                    {!isLoading && spots.length > 0 && (
                        <div className="space-y-2">
                            {spots.map((spot, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-white p-2 rounded border border-gray-200 hover:border-red-400 cursor-pointer transition-all flex gap-2 items-center"
                                    onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                >
                                    {/* NÚMERO IDENTIFICATIVO */}
                                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${currentCategory === 'camping' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                        {idx + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h6 className="text-xs font-bold text-gray-800 truncate group-hover:text-red-600">{spot.name}</h6>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <div className="flex items-center gap-1">
                                                {spot.rating && <span className="text-[10px] font-bold text-orange-500">★ {spot.rating}</span>}
                                                <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{spot.vicinity?.split(',')[0]}</span>
                                            </div>
                                            {/* DISTANCIA CALCULADA */}
                                            {spot.distanceFromCenter !== undefined && (
                                                <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
                                                    📍 {(spot.distanceFromCenter / 1000).toFixed(1)}km
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && spots.length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-2">No hay resultados en esta zona.</p>
                    )}
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

    // --- ESTADOS BÚSQUEDA ---
    // Usamos la interfaz segura PlaceWithDistance en el estado
    const [nearbySpots, setNearbySpots] = useState<PlaceWithDistance[]>([]);
    const [loadingSpots, setLoadingSpots] = useState(false);
    const [spotCategory, setSpotCategory] = useState<'camping' | 'restaurant'>('camping');

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

    useEffect(() => { if (map && mapBounds) setTimeout(() => map.fitBounds(mapBounds), 500); }, [map, mapBounds]);

    const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => {
        if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null;
        const geocoder = new google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({ address: cityName });
            if (response.results.length > 0) return response.results[0].geometry.location.toJSON();
        } catch (e) { }
        return null;
    };

    // --- FUNCIÓN DE BÚSQUEDA ---
    const searchNearbySpots = useCallback((location: Coordinates, category: 'camping' | 'restaurant') => {
        if (!map || typeof google === 'undefined') return;

        setLoadingSpots(true);
        setNearbySpots([]);

        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(location.lat, location.lng);

        let keywords = 'camping OR "area autocaravanas" OR "rv park" OR "parking caravanas"';
        let radius = 20000;

        if (category === 'restaurant') {
            keywords = 'restaurante OR comida OR bar';
            radius = 5000;
        }

        const request: google.maps.places.PlaceSearchRequest = {
            location: centerPoint,
            radius: radius,
            keyword: keywords
        };

        service.nearbySearch(request, (results, status) => {
            setLoadingSpots(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {

                // Mapeamos los resultados de Google al formato seguro "PlaceWithDistance"
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
                        distanceFromCenter: dist
                    };
                });

                spotsWithDistance.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0));
                setNearbySpots(spotsWithDistance);
            } else {
                setNearbySpots([]);
            }
        });
    }, [map]);

    const handleCategoryChange = (newCat: 'camping' | 'restaurant') => {
        setSpotCategory(newCat);
        if (selectedDayIndex !== null && results.dailyItinerary) {
            const day = results.dailyItinerary[selectedDayIndex];
            if (day.coordinates) {
                searchNearbySpots(day.coordinates, newCat);
            } else {
                const cleanTo = day.to.replace('📍 Parada Táctica: ', '').split('|')[0];
                geocodeCity(cleanTo).then(coord => {
                    if (coord) searchNearbySpots(coord, newCat);
                });
            }
        }
    };

    const focusMapOnStage = async (dayIndex: number) => {
        if (typeof google === 'undefined' || !results.dailyItinerary) return;

        const dailyPlan = results.dailyItinerary[dayIndex];
        if (!dailyPlan) return;

        setSelectedDayIndex(dayIndex);
        setSpotCategory('camping');

        if (dailyPlan.coordinates) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: dailyPlan.coordinates.lat + 0.4, lng: dailyPlan.coordinates.lng + 0.4 });
            bounds.extend({ lat: dailyPlan.coordinates.lat - 0.4, lng: dailyPlan.coordinates.lng - 0.4 });
            setMapBounds(bounds);
            searchNearbySpots(dailyPlan.coordinates, 'camping');
        } else {
            setNearbySpots([]);
            const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
            const coord = await geocodeCity(cleanTo);
            if (coord) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend({ lat: coord.lat + 0.4, lng: coord.lng + 0.4 });
                bounds.extend({ lat: coord.lat - 0.4, lng: coord.lng - 0.4 });
                setMapBounds(bounds);
                searchNearbySpots(coord, 'camping');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        let finalValue: string | number | boolean = type === 'checkbox' ? checked : (['precioGasoil', 'consumo', 'kmMaximoDia'].includes(id) ? parseFloat(value) : value);
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleReturnHome = () => {
        setFormData(prev => ({
            ...prev,
            origen: prev.destino,
            destino: prev.origen,
        }));
    };

    const calculateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setDirectionsResponse(null);
        setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });
        setSelectedDayIndex(null);
        setNearbySpots([]);

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
                                    <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} placeholder="Ej: Valencia, Madrid" className="w-full px-3 py-2 bg-white border border-red-200 rounded text-xs focus:ring-1 focus:ring-red-500 outline-none" />
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
                                        onClick={() => { setSelectedDayIndex(null); setMapBounds(null); setNearbySpots([]); }}
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
                                                icon={day.type === 'tactical' ? ICONS.tactical : day.type === 'overnight' ? ICONS.overnight : ICONS.startEnd}
                                                title={day.to}
                                            />
                                        ))}

                                        {nearbySpots.map((spot, i) => spot.geometry?.location && (
                                            <Marker
                                                key={`spot-${i}`}
                                                position={spot.geometry.location}
                                                label={{
                                                    text: (i + 1).toString(),
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "12px"
                                                }}
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
                                                <p className="text-xs text-gray-400 mb-4">Haz clic en una pestaña arriba 👆</p>
                                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                                    <table className="min-w-full text-xs text-left">
                                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase"><tr><th className="px-3 py-2">Día</th><th className="px-3 py-2 text-right">Km</th></tr></thead>
                                                        <tbody className="divide-y divide-gray-100">{results.dailyItinerary?.filter(d => d.isDriving).map((day, i) => (<tr key={i} className="hover:bg-red-50 transition"><td className="px-3 py-2 font-medium text-gray-700">Día {day.day}</td><td className="px-3 py-2 text-right font-mono text-gray-500">{day.distance.toFixed(0)}</td></tr>))}</tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <DaySpotsList
                                                day={results.dailyItinerary![selectedDayIndex]}
                                                spots={nearbySpots}
                                                isLoading={loadingSpots}
                                                onCategoryChange={handleCategoryChange}
                                                currentCategory={spotCategory}
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