'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';

// --- CONFIGURACIÓN VISUAL ---
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// --- ICONOS MAPA ---
const MARKER_ICONS: Record<string, string> = {
    camping: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",      // Rojo
    restaurant: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",   // Azul
    water: "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",        // Azul claro
    gas: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",          // Naranja
    supermarket: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",  // Verde
    laundry: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",      // Morado
    tourism: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"       // Amarillo
};

const ICONS_ITINERARY = {
    startEnd: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    tactical: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
};

// --- INTERFACES ---
interface Coordinates { lat: number; lng: number; }
type ServiceType = 'camping' | 'restaurant' | 'water' | 'gas' | 'supermarket' | 'laundry' | 'tourism';

interface PlaceWithDistance {
    name?: string;
    rating?: number;
    user_ratings_total?: number; // Número de votos
    vicinity?: string;
    place_id?: string;
    opening_hours?: { isOpen?: () => boolean; open_now?: boolean }; // Google a veces lo manda así o asá
    geometry?: { location?: any; };
    distanceFromCenter?: number;
    type?: ServiceType;
}

interface DailyPlan {
    day: number; date: string; from: string; to: string; distance: number; isDriving: boolean;
    coordinates?: Coordinates; type: 'overnight' | 'tactical' | 'start' | 'end';
    savedPlaces?: PlaceWithDistance[];
}

interface TripResult {
    totalDays: number | null; distanceKm: number | null; totalCost: number | null;
    dailyItinerary: DailyPlan[] | null; error: string | null;
}

// --- ICONOS SVG UI ---
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

// --- COMPONENTE: LISTA DE SPOTS Y SERVICIOS ---
const DaySpotsList: React.FC<{
    day: DailyPlan,
    places: Record<ServiceType, PlaceWithDistance[]>,
    loading: Record<ServiceType, boolean>,
    toggles: Record<ServiceType, boolean>,
    onToggle: (type: ServiceType) => void,
    onAddPlace: (place: PlaceWithDistance) => void,
    onRemovePlace: (placeId: string) => void,
    onHover: (place: PlaceWithDistance | null) => void // NUEVO: Prop para el hover
}> = ({ day, places, loading, toggles, onToggle, onAddPlace, onRemovePlace, onHover }) => {

    const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split('|')[0].trim();
    const saved = day.savedPlaces || [];
    const isSaved = (id?: string) => id ? saved.some(p => p.place_id === id) : false;

    const ServiceButton = ({ type, icon, label }: { type: ServiceType, icon: string, label: string }) => (
        <button
            onClick={() => onToggle(type)}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 shadow-sm flex-grow justify-center
            ${toggles[type] ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
            <span>{icon}</span> {label}
        </button>
    );

    const ServiceList = ({ type, title, colorClass, icon, markerColor }: { type: ServiceType, title: string, colorClass: string, icon: string, markerColor: string }) => {
        if (!toggles[type] && type !== 'camping') return null;

        const savedOfType = saved.find(s => s.type === type);
        let list = places[type];

        if (savedOfType && type !== 'tourism') {
            list = [savedOfType];
        }

        const isLoading = loading[type];

        return (
            <div className="animate-fadeIn mt-4">
                <h5 className={`text-xs font-bold ${colorClass} mb-2 border-b border-gray-100 pb-1 flex justify-between items-center`}>
                    <span className="flex items-center gap-1"><span>{icon}</span> {title}</span>
                    {!isLoading && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{list.length}</span>}
                </h5>

                {isLoading && <p className="text-[10px] text-gray-400 animate-pulse">Buscando...</p>}

                {!isLoading && list.length > 0 && (
                    <div className="space-y-2">
                        {list.map((spot, idx) => (
                            <div
                                key={`${type}-${idx}`}
                                className={`group bg-white p-2 rounded border ${isSaved(spot.place_id) ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200'} hover:border-blue-400 transition-all flex gap-2 items-center shadow-sm`}
                                onMouseEnter={() => onHover(spot)} // 🖱️ HOVER ENTRA
                                onMouseLeave={() => onHover(null)} // 🖱️ HOVER SALE
                            >
                                <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${markerColor}`}>
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}>
                                    <h6 className="text-xs font-bold text-gray-800 truncate">{spot.name}</h6>
                                    <div className="flex items-center gap-2">
                                        {spot.rating && <span className="text-[10px] font-bold text-orange-500">★ {spot.rating}</span>}
                                        <span className="text-[10px] text-gray-400 truncate">{spot.vicinity?.split(',')[0]}</span>
                                    </div>
                                </div>
                                <button onClick={() => isSaved(spot.place_id) ? (spot.place_id && onRemovePlace(spot.place_id)) : onAddPlace(spot)} className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${isSaved(spot.place_id) ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'}`}>
                                    {isSaved(spot.place_id) ? 'Borrar' : 'Elegir'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && list.length === 0 && <p className="text-[10px] text-gray-400 italic">Sin resultados.</p>}
                {savedOfType && type !== 'tourism' && (
                    <p className="text-[9px] text-green-600 mt-1 italic text-center">Has elegido este sitio. Borra para ver más.</p>
                )}
            </div>
        );
    };

    return (
        <div className={`p-4 rounded-xl space-y-4 h-full overflow-y-auto transition-all ${day.isDriving ? 'bg-red-50 border-l-4 border-red-600' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
            <div>
                <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-red-800' : 'text-orange-800'}`}>
                    {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
                </h4>
                <p className="text-md font-semibold text-gray-800">
                    {day.from.split('|')[0]} <span className="text-gray-400">➝</span> {rawCityName}
                </p>
            </div>

            {saved.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-green-500 shadow-md animate-fadeIn">
                    <h5 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1 border-b border-green-200 pb-1"><span>✅</span> MI PLAN PARA HOY:</h5>
                    <div className="space-y-1">
                        {saved.map((place, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-green-50 p-1.5 rounded" onMouseEnter={() => onHover(place)} onMouseLeave={() => onHover(null)}>
                                <div className="truncate flex-1 mr-2 flex items-center gap-2">
                                    <span className="font-bold text-lg">
                                        {place.type === 'camping' ? '🚐' : place.type === 'restaurant' ? '🍳' : place.type === 'water' ? '💧' : place.type === 'gas' ? '⛽' : place.type === 'supermarket' ? '🛒' : place.type === 'laundry' ? '🧺' : place.type === 'tourism' ? '📷' : '📍'}
                                    </span>
                                    <span className="font-medium text-green-900 truncate">{place.name}</span>
                                </div>
                                <button onClick={() => place.place_id && onRemovePlace(place.place_id)} className="text-red-400 hover:text-red-600"><IconTrash /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-red-200">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <div className="px-2 py-1.5 rounded-lg bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 flex items-center gap-1 cursor-default shadow-sm flex-grow justify-center">
                            <span>🚐</span> Spots
                        </div>
                        <ServiceButton type="water" icon="💧" label="Aguas" />
                        <ServiceButton type="gas" icon="⛽" label="Gasolineras" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <ServiceButton type="restaurant" icon="🍳" label="Comer" />
                        <ServiceButton type="supermarket" icon="🛒" label="Super" />
                        <ServiceButton type="laundry" icon="🧺" label="Lavar" />
                        <ServiceButton type="tourism" icon="📷" label="Turismo" />
                    </div>

                    <div className="space-y-2">
                        <ServiceList type="camping" title="Áreas y Campings" colorClass="text-red-800" icon="🚐" markerColor="bg-red-600" />
                        <ServiceList type="water" title="Cambio de Aguas" colorClass="text-cyan-600" icon="💧" markerColor="bg-cyan-500" />
                        <ServiceList type="gas" title="Gasolineras" colorClass="text-orange-600" icon="⛽" markerColor="bg-orange-500" />
                        <ServiceList type="restaurant" title="Restaurantes" colorClass="text-blue-800" icon="🍳" markerColor="bg-blue-600" />
                        <ServiceList type="supermarket" title="Supermercados" colorClass="text-green-700" icon="🛒" markerColor="bg-green-600" />
                        <ServiceList type="laundry" title="Lavanderías" colorClass="text-purple-700" icon="🧺" markerColor="bg-purple-600" />
                        <ServiceList type="tourism" title="Turismo y Visitas" colorClass="text-yellow-600" icon="📷" markerColor="bg-yellow-500" />
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
    // NUEVO ESTADO: HOVERED PLACE
    const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);

    // ESTADO UNIFICADO
    const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
        camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: []
    });
    const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false
    });
    const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
        camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false
    });

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

    useEffect(() => {
        if (map) {
            if (mapBounds) {
                setTimeout(() => map.fitBounds(mapBounds), 500);
            } else if (directionsResponse && selectedDayIndex === null) {
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

    const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
        if (!map || typeof google === 'undefined') return;

        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(location.lat, location.lng);

        let keywords = '';
        let radius = 10000;

        switch (type) {
            case 'camping': keywords = 'camping OR "area autocaravanas" OR "rv park" OR "parking caravanas"'; radius = 20000; break;
            case 'restaurant': keywords = 'restaurante OR comida OR bar'; radius = 5000; break;
            case 'water': keywords = '"punto limpio autocaravanas" OR "rv dump station" OR "area servicio autocaravanas"'; radius = 15000; break;
            case 'gas': keywords = 'gasolinera OR "estacion servicio"'; radius = 10000; break;
            case 'supermarket': keywords = 'supermercado OR "tienda alimentacion"'; radius = 5000; break;
            case 'laundry': keywords = 'lavanderia OR "laundry"'; radius = 10000; break;
            case 'tourism': keywords = 'turismo OR monumento OR museo OR "punto interes"'; radius = 10000; break;
        }

        const request: google.maps.places.PlaceSearchRequest = { location: centerPoint, radius, keyword: keywords };

        setLoadingPlaces(prev => ({ ...prev, [type]: true }));

        service.nearbySearch(request, (results, status) => {
            setLoadingPlaces(prev => ({ ...prev, [type]: false }));
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const spotsWithDistance: PlaceWithDistance[] = results.map(spot => {
                    let dist = 999999;
                    if (spot.geometry?.location) {
                        dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);
                    }
                    return {
                        name: spot.name, rating: spot.rating, vicinity: spot.vicinity, place_id: spot.place_id,
                        geometry: spot.geometry, distanceFromCenter: dist, type,
                        opening_hours: spot.opening_hours as any, // Cast rapido
                        user_ratings_total: spot.user_ratings_total
                    };
                });
                spotsWithDistance.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0));
                setPlaces(prev => ({ ...prev, [type]: spotsWithDistance }));
            } else {
                setPlaces(prev => ({ ...prev, [type]: [] }));
            }
        });
    }, [map]);

    const handleToggle = (type: ServiceType) => {
        const newState = !toggles[type];
        setToggles(prev => ({ ...prev, [type]: newState }));
        if (newState && selectedDayIndex !== null && results.dailyItinerary) {
            const day = results.dailyItinerary[selectedDayIndex];
            if (day.coordinates) {
                searchPlaces(day.coordinates, type);
            } else {
                const cleanTo = day.to.replace('📍 Parada Táctica: ', '').split('|')[0];
                geocodeCity(cleanTo).then(coord => { if (coord) searchPlaces(coord, type); });
            }
        }
    };

    const handleAddPlace = (place: PlaceWithDistance) => {
        if (selectedDayIndex === null || !results.dailyItinerary) return;
        const updatedItinerary = [...results.dailyItinerary];
        const currentDay = updatedItinerary[selectedDayIndex];
        if (!currentDay.savedPlaces) currentDay.savedPlaces = [];
        if (!currentDay.savedPlaces.some(p => p.place_id === place.place_id)) {
            currentDay.savedPlaces.push(place);
            setResults({ ...results, dailyItinerary: updatedItinerary });
        }
    };

    const handleRemovePlace = (placeId: string) => {
        if (selectedDayIndex === null || !results.dailyItinerary) return;
        const updatedItinerary = [...results.dailyItinerary];
        const currentDay = updatedItinerary[selectedDayIndex];
        if (currentDay.savedPlaces) {
            currentDay.savedPlaces = currentDay.savedPlaces.filter(p => p.place_id !== placeId);
            setResults({ ...results, dailyItinerary: updatedItinerary });
        }
    };

    const focusMapOnStage = async (dayIndex: number) => {
        if (typeof google === 'undefined' || !results.dailyItinerary) return;
        const dailyPlan = results.dailyItinerary[dayIndex];
        if (!dailyPlan) return;
        setSelectedDayIndex(dayIndex);
        setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false });
        setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [] });

        if (dailyPlan.coordinates) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: dailyPlan.coordinates.lat + 0.4, lng: dailyPlan.coordinates.lng + 0.4 });
            bounds.extend({ lat: dailyPlan.coordinates.lat - 0.4, lng: dailyPlan.coordinates.lng - 0.4 });
            setMapBounds(bounds);
            searchPlaces(dailyPlan.coordinates, 'camping');
        } else {
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
        setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false });
        setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [] });

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
                            coordinates: { lat, lng }, type: 'tactical', savedPlaces: []
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
                        coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() }, type: isFinalDest ? 'end' : 'overnight', savedPlaces: []
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
                        itinerary.push({ day: dayCounter, date: formatDate(currentDate), from: formData.destino, to: formData.destino, distance: 0, isDriving: false, type: 'end', savedPlaces: [] });
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

                {/* --- HEADER CARACOLA CON LOGO --- */}
                <div className="text-center space-y-4 mb-6 flex flex-col items-center">
                    <img
                        src="/logo.jpg"
                        alt="CaraCola Viajes"
                        className="h-24 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                    />
                    <p className="text-gray-500 text-sm md:text-base font-medium">
                        Tu ruta en autocaravana, paso a paso.
                    </p>
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
                                        onClick={() => { setSelectedDayIndex(null); setMapBounds(null); setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false }); setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [] }); setHoveredPlace(null); }}
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

                                        {Object.keys(places).map((key) => {
                                            const type = key as ServiceType;
                                            if (!toggles[type] && type !== 'camping') return null;

                                            const savedDay = results.dailyItinerary![selectedDayIndex!];
                                            const savedOfType = savedDay?.savedPlaces?.filter(s => s.type === type) || [];

                                            let searchList: PlaceWithDistance[] = [];
                                            if (toggles[type] || type === 'camping') {
                                                if (savedOfType.length > 0 && type !== 'tourism') {
                                                    searchList = [];
                                                } else {
                                                    searchList = places[type];
                                                }
                                            }

                                            const toRender = [...savedOfType, ...searchList];
                                            const uniqueRender = toRender.filter((v, i, a) => a.findIndex(t => (t.place_id === v.place_id)) === i);

                                            return uniqueRender.map((spot, i) => (
                                                spot.geometry?.location && (
                                                    <Marker
                                                        key={`${type}-${i}`}
                                                        position={spot.geometry.location}
                                                        icon={MARKER_ICONS[type]}
                                                        label={{
                                                            text: savedOfType.some(s => s.place_id === spot.place_id) ? "✓" : (i + 1).toString(),
                                                            color: "white",
                                                            fontWeight: "bold",
                                                            fontSize: "10px"
                                                        }}
                                                        title={spot.name}
                                                        onClick={() => spot.place_id && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                                        onMouseOver={() => setHoveredPlace(spot)}
                                                        onMouseOut={() => setHoveredPlace(null)}
                                                    />
                                                )
                                            ));
                                        })}

                                        {/* --- INFO WINDOW (BOCADILLO) AL HACER HOVER --- */}
                                        {hoveredPlace && hoveredPlace.geometry?.location && (
                                            <InfoWindow
                                                position={hoveredPlace.geometry.location}
                                                onCloseClick={() => setHoveredPlace(null)}
                                                options={{ disableAutoPan: true, pixelOffset: new google.maps.Size(0, -30) }}
                                            >
                                                <div className="p-1 min-w-[150px]">
                                                    <h6 className="font-bold text-sm text-gray-800 mb-1">{hoveredPlace.name}</h6>
                                                    <div className="flex items-center gap-1 text-xs text-orange-500 font-bold mb-1">
                                                        {hoveredPlace.rating ? `★ ${hoveredPlace.rating}` : 'Sin valoración'}
                                                        {hoveredPlace.user_ratings_total && <span className="text-gray-400 font-normal">({hoveredPlace.user_ratings_total})</span>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 mb-1">{hoveredPlace.vicinity}</p>
                                                    {hoveredPlace.opening_hours?.open_now !== undefined && (
                                                        <p className={`text-[10px] font-bold ${hoveredPlace.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                                            {hoveredPlace.opening_hours.open_now ? '● Abierto ahora' : '● Cerrado'}
                                                        </p>
                                                    )}
                                                </div>
                                            </InfoWindow>
                                        )}

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

                                                <div className="space-y-3 text-left">
                                                    {results.dailyItinerary?.map((day, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => focusMapOnStage(index)}
                                                            className="border border-gray-200 rounded-lg p-3 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all shadow-sm bg-white"
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-red-700 text-sm flex items-center gap-1">
                                                                    {day.isDriving ? '🚐' : '🏖️'} Día {day.day}
                                                                </span>
                                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {day.isDriving ? `${day.distance.toFixed(0)} km` : 'Relax'}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                                            </div>

                                                            {day.savedPlaces && day.savedPlaces.length > 0 && (
                                                                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                                                    {day.savedPlaces.map((place, i) => (
                                                                        <div key={i} className="text-[10px] text-green-700 flex items-center gap-1">
                                                                            <span>✅</span> {place.name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <DaySpotsList
                                                day={results.dailyItinerary![selectedDayIndex]}
                                                places={places}
                                                loading={loadingPlaces}
                                                toggles={toggles}
                                                onToggle={handleToggle}
                                                onAddPlace={handleAddPlace}
                                                onRemovePlace={handleRemovePlace}
                                                onHover={setHoveredPlace} // Pasamos la función de hover
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