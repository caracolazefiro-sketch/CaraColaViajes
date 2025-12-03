'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../types';
import { ICONS_ITINERARY } from '../constants';
import { createMarkerIcon, ServiceIcons } from './ServiceIcons';
import StarRating from './StarRating';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };

const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconSearch = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const IconX = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

// Helper component for InfoWindow image with error handling
const InfoWindowImage = ({ place }: { place: PlaceWithDistance }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!place.photoUrl || place.photoUrl.trim() === '' || imageError) {
        const Icon = ServiceIcons[place.type as keyof typeof ServiceIcons] || ServiceIcons.custom;
        return (
            <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-400 rounded-t-lg">
                <Icon size={48} />
            </div>
        );
    }
    
    // Usar img nativo para URLs de Google Maps PhotoService que no funcionan con Next.js Image
    return (
        <img 
            src={place.photoUrl} 
            alt={place.name || 'Lugar'} 
            className="w-full h-28 object-cover rounded-t-lg"
            onError={() => setImageError(true)}
        />
    );
};

interface TripMapProps {
    setMap: (map: google.maps.Map | null) => void;
    mapBounds: google.maps.LatLngBounds | null;
    directionsResponse: google.maps.DirectionsResult | null;
    dailyItinerary: DailyPlan[] | null;
    places: Record<ServiceType, PlaceWithDistance[]>;
    toggles: Record<ServiceType, boolean>;
    selectedDayIndex: number | null;
    hoveredPlace: PlaceWithDistance | null;
    setHoveredPlace: (place: PlaceWithDistance | null) => void;
    onPlaceClick: (place: PlaceWithDistance) => void;
    onAddPlace: (place: PlaceWithDistance) => void;
    onSearch: (query: string, lat: number, lng: number) => void;
    onClearSearch: () => void;
    mapInstance: google.maps.Map | null;
    minRating?: number;
    setMinRating?: (rating: number) => void;
    searchRadius?: number;
    setSearchRadius?: (radius: number) => void;
    sortBy?: 'score' | 'distance' | 'rating';
    setSortBy?: (sort: 'score' | 'distance' | 'rating') => void;
    t?: (key: string) => string;
}

export default function TripMap({
    setMap, mapBounds, directionsResponse, dailyItinerary, places, toggles, 
    selectedDayIndex, hoveredPlace, setHoveredPlace, onPlaceClick, onAddPlace,
    onSearch, onClearSearch, mapInstance, t, minRating = 0, setMinRating, searchRadius = 50, setSearchRadius, sortBy = 'score', setSortBy
}: TripMapProps) {

    const [searchQuery, setSearchQuery] = useState('');
    const [clickedGooglePlace, setClickedGooglePlace] = useState<PlaceWithDistance | null>(null);
    
    // CONTROL DE INTERACCIÓN (SISTEMA VS HUMANO)
    const hasUserInteracted = useRef(false);
    const isProgrammaticMove = useRef(false);

    // Listener para el mapa
    const handleMapLoad = (map: google.maps.Map) => {
        setMap(map);
        
        map.addListener('dragstart', () => { 
            hasUserInteracted.current = true; 
        });
        
        map.addListener('zoom_changed', () => { 
            if (!isProgrammaticMove.current) {
                hasUserInteracted.current = true; 
            }
        });

        // Listener para clicks en POIs de Google Maps
        map.addListener('click', (e: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
            // @ts-expect-error - placeId existe en IconMouseEvent
            if (e.placeId) {
                e.stop(); // Prevenir el InfoWindow por defecto de Google
                
                const service = new google.maps.places.PlacesService(map);
                // @ts-expect-error - Type mismatch in Google Maps API
                service.getDetails({ placeId: e.placeId }, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        // Convertir a nuestro formato
                        const lat = place.geometry?.location?.lat();
                        const lng = place.geometry?.location?.lng();
                        
                        if (lat && lng) {
                            let photoUrl: string | undefined;
                            if (place.photos && place.photos.length > 0) {
                                try {
                                    photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
                                } catch (err) {
                                    console.warn('Error getting photo URL:', err);
                                }
                            }

                            const placeData: PlaceWithDistance = {
                                place_id: place.place_id || '',
                                name: place.name || 'Lugar sin nombre',
                                vicinity: place.formatted_address || place.vicinity || '',
                                geometry: {
                                    location: { lat, lng }
                                },
                                rating: place.rating,
                                user_ratings_total: place.user_ratings_total,
                                type: 'found', // Marcado como "found" - descubierto en el mapa
                                types: place.types,
                                photoUrl,
                                distanceFromCenter: 0 // No calculamos distancia para clicks en mapa
                            };

                            setClickedGooglePlace(placeData);
                        }
                    }
                });
            }
        });
    };

    // Efecto para controlar el FitBounds (El Único Conductor)
    useEffect(() => {
        if (!mapInstance) return;

        const applyBounds = (bounds: google.maps.LatLngBounds) => {
            isProgrammaticMove.current = true;
            mapInstance.fitBounds(bounds);
            
            // Pequeño timeout para liberar el candado
            setTimeout(() => {
                isProgrammaticMove.current = false;
                // Si hemos forzado un movimiento (ej: Botón General), reseteamos la "memoria" de interacción
                // para que futuros cambios automáticos sigan funcionando hasta que el usuario toque de nuevo.
                if (mapBounds || selectedDayIndex === null) {
                    hasUserInteracted.current = false; 
                }
            }, 800);
        };

        // CASO 1: Límites explícitos (Día específico o General forzado)
        if (mapBounds) {
            applyBounds(mapBounds);
        } 
        // CASO 2: Carga inicial o reset suave (Solo si no ha tocado el mapa)
        else if (directionsResponse && !hasUserInteracted.current && selectedDayIndex === null) {
            const routeBounds = directionsResponse.routes[0].bounds;
            if (routeBounds) applyBounds(routeBounds);
        }
    }, [mapInstance, mapBounds, directionsResponse, selectedDayIndex]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim() || !mapInstance) return;
        const c = mapInstance.getCenter();
        if (c) onSearch(searchQuery, c.lat(), c.lng());
    };

    const isSaved = (placeId?: string) => {
        if (!dailyItinerary || selectedDayIndex === null) return false;
        return dailyItinerary[selectedDayIndex].savedPlaces?.some(p => p.place_id === placeId);
    };

    const searchPlaceholder = t ? t('MAP_SEARCH_PLACEHOLDER') : 'Buscar en esta zona...';

    // Generamos una clave única para forzar el repintado de la ruta si cambia
    // Usamos el polyline codificado como ID único de la ruta
    const routeKey = directionsResponse?.routes?.[0]?.overview_polyline || 'no-route';

    return (
        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative no-print group">
            <div className="absolute top-4 right-12 z-10 bg-white rounded-lg shadow-xl flex items-center p-1 w-64 border border-gray-200 transition-opacity opacity-90 hover:opacity-100">
                <form onSubmit={handleSearchSubmit} className="flex items-center flex-1">
                    <button type="submit" className="p-2 text-gray-400 hover:text-blue-500"><IconSearch /></button>
                    <input 
                        type="text" 
                        placeholder={searchPlaceholder} 
                        className="w-full text-xs outline-none text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
                {places.search && places.search.length > 0 && (
                    <button onClick={() => { setSearchQuery(''); onClearSearch(); }} className="p-2 text-gray-300 hover:text-red-500"><IconX /></button>
                )}
            </div>

            {/* Filter Sliders - Flotantes en esquina superior derecha */}
            {setMinRating && setSearchRadius && setSortBy && (
                <div className="absolute top-4 right-72 z-10 bg-white rounded-lg shadow-xl p-3 border border-gray-200 space-y-2 w-56 transition-opacity opacity-90 hover:opacity-100">
                    {/* Rating Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-700">⭐ Rating</label>
                            <span className="text-xs font-bold text-yellow-600">{minRating.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={minRating}
                            onChange={(e) => setMinRating(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-300 rounded appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(minRating / 5) * 100}%, #e5e7eb ${(minRating / 5) * 100}%, #e5e7eb 100%)`,
                            }}
                        />
                    </div>

                    {/* Radio Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-700">📍 Radio</label>
                            <span className="text-xs font-bold text-blue-600">{searchRadius}km</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-300 rounded appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((searchRadius - 5) / 45) * 100}%, #e5e7eb ${((searchRadius - 5) / 45) * 100}%, #e5e7eb 100%)`,
                            }}
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Sort</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'score' | 'distance' | 'rating')}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="score">📊 Score</option>
                            <option value="distance">📍 Dist</option>
                            <option value="rating">⭐ Rate</option>
                        </select>
                    </div>
                </div>
            )}

            <GoogleMap 
                mapContainerStyle={containerStyle} center={center} zoom={6} 
                onLoad={handleMapLoad}
                onClick={(e) => {
                    // Solo cerrar InfoWindow si NO es un click en POI de Google
                    // @ts-expect-error - placeId not in standard types
                    if (!e.placeId) {
                        setHoveredPlace(null);
                        setClickedGooglePlace(null);
                    }
                }}
                options={{ 
                    zoomControl: true, 
                    streetViewControl: false, 
                    mapTypeControl: true, 
                    fullscreenControl: true,
                    scaleControl: true,
                    mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_LEFT },
                    fullscreenControlOptions: { position: google.maps.ControlPosition.BOTTOM_LEFT },
                    zoomControlOptions: { position: google.maps.ControlPosition.LEFT_TOP }
                }}
            >
                {directionsResponse && (
                    <DirectionsRenderer 
                        key={routeKey} // 🔑 CLAVE MAESTRA: Fuerza repintado si cambia la ruta
                        directions={directionsResponse} 
                        options={{ 
                            polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4 }, 
                            suppressMarkers: false,
                            preserveViewport: true // 🛑 PROHIBIDO TOCAR EL ZOOM: Nosotros mandamos
                        }} 
                    />
                )}
                
                {dailyItinerary?.map((day, i) => day.coordinates && (
                    <Marker key={`itinerary-${i}`} position={day.coordinates} icon={day.type === 'tactical' ? ICONS_ITINERARY.tactical : ICONS_ITINERARY.startEnd} title={day.to} label={{ text: `${i+1}`, color: "white", fontSize: "10px", fontWeight: "bold" }} />
                ))}
                
                {Object.keys(places).map((key) => {
                    const type = key as ServiceType;
                    const savedDay = selectedDayIndex !== null ? dailyItinerary![selectedDayIndex] : null;
                    const savedOfType = savedDay?.savedPlaces?.filter(s => s.type === type) || [];
                    
                    // Mostrar lugares guardados SIEMPRE, incluso si toggle OFF
                    // Mostrar resultados de búsqueda solo si toggle ON
                    let listToRender: PlaceWithDistance[] = [];
                    if (savedOfType.length > 0) {
                        // Lugares guardados siempre visibles
                        listToRender = [...savedOfType];
                    }
                    if (toggles[type]) {
                        // Añadir resultados de búsqueda si toggle ON
                        if (type === 'custom') {
                            listToRender = savedOfType;
                        } else if (type === 'search') {
                            listToRender = places.search || [];
                        } else {
                            listToRender = [...savedOfType, ...places[type]];
                        }
                    }
                    
                    if (type === 'search' && listToRender.length === 0) return null;
                    const uniqueRender = listToRender.filter((v,i,a)=>a.findIndex(t=>(t.place_id === v.place_id))===i);
                    return uniqueRender.map((spot, i) => {
                        const saved = isSaved(spot.place_id);
                        return spot.geometry?.location && (
                            <Marker 
                                key={`${type}-${i}`} 
                                position={spot.geometry.location} 
                                icon={{ url: createMarkerIcon(type), scaledSize: new window.google.maps.Size(24, 24) }} 
                                label={saved ? { 
                                    text: "✓", 
                                    color: "#16A34A", 
                                    fontWeight: "bold", 
                                    fontSize: "16px",
                                    className: "marker-label"
                                } : undefined}
                                title={spot.name}
                                onClick={() => setHoveredPlace(spot)}
                                onMouseOver={() => setHoveredPlace(spot)}
                            />
                        );
                    });
                })}
                
                {hoveredPlace && hoveredPlace.geometry?.location && (
                    <InfoWindow position={hoveredPlace.geometry.location} onCloseClick={() => setHoveredPlace(null)} options={{ disableAutoPan: false, pixelOffset: new google.maps.Size(0, -20) }}>
                        <div className="p-0 w-[220px] overflow-hidden font-sans">
                            <InfoWindowImage place={hoveredPlace} />
                            <div className="p-3 bg-white">
                                <h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight line-clamp-2">{hoveredPlace.name}</h6>
                                {hoveredPlace.rating ? (
                                    <div className="mb-2"><StarRating rating={hoveredPlace.rating} showNumber size={14} /></div>
                                ) : (
                                    <div className="text-xs text-gray-400 mb-2">Sin valoración</div>
                                )}
                                <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{hoveredPlace.vicinity}</p>
                                <div className="flex gap-2">
                                    {selectedDayIndex !== null && !isSaved(hoveredPlace.place_id) && (<button onClick={() => { onAddPlace(hoveredPlace); setHoveredPlace(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"><IconPlusCircle /> Añadir</button>)}
                                    <button onClick={() => onPlaceClick(hoveredPlace)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold py-1.5 rounded border border-blue-200 transition-colors">Ver en Google</button>
                                </div>
                                {selectedDayIndex === null && <p className="text-[9px] text-red-500 mt-2 text-center italic">Selecciona un día para añadir.</p>}
                            </div>
                        </div>
                    </InfoWindow>
                )}

                {clickedGooglePlace && clickedGooglePlace.geometry?.location && (
                    <InfoWindow position={clickedGooglePlace.geometry.location} onCloseClick={() => setClickedGooglePlace(null)} options={{ disableAutoPan: false, pixelOffset: new google.maps.Size(0, 0) }}>
                        <div className="p-0 w-[220px] overflow-hidden font-sans">
                            <InfoWindowImage place={clickedGooglePlace} />
                            <div className="p-3 bg-white">
                                <h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight line-clamp-2">{clickedGooglePlace.name}</h6>
                                {clickedGooglePlace.rating ? (
                                    <div className="mb-2"><StarRating rating={clickedGooglePlace.rating} showNumber size={14} /></div>
                                ) : (
                                    <div className="text-xs text-gray-400 mb-2">Sin valoración</div>
                                )}
                                <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{clickedGooglePlace.vicinity}</p>
                                <div className="flex gap-2">
                                    {selectedDayIndex !== null && !isSaved(clickedGooglePlace.place_id) && (<button onClick={() => { onAddPlace(clickedGooglePlace); setClickedGooglePlace(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"><IconPlusCircle /> Añadir</button>)}
                                    <button onClick={() => onPlaceClick(clickedGooglePlace)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold py-1.5 rounded border border-blue-200 transition-colors">Ver en Google</button>
                                </div>
                                {selectedDayIndex === null && <p className="text-[9px] text-red-500 mt-2 text-center italic">Selecciona un día para añadir.</p>}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}