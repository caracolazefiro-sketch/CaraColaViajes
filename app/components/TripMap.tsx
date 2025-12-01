'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../types';
import { MARKER_ICONS, ICONS_ITINERARY } from '../constants';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };

const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconSearch = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const IconX = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

// Helper component for InfoWindow image with error handling
const InfoWindowImage = ({ place }: { place: PlaceWithDistance }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!place.photoUrl || place.photoUrl.trim() === '' || imageError) {
        return (
            <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-4xl text-gray-300 rounded-t-lg">
                {place.type === 'search' ? '🟣' : place.type === 'camping' ? '🚐' : place.type === 'restaurant' ? '🍳' : '📍'}
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
    t?: (key: string) => string;
}

export default function TripMap({
    setMap, mapBounds, directionsResponse, dailyItinerary, places, toggles, 
    selectedDayIndex, hoveredPlace, setHoveredPlace, onPlaceClick, onAddPlace,
    onSearch, onClearSearch, mapInstance, t
}: TripMapProps) {

    const [searchQuery, setSearchQuery] = useState('');
    
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
            <GoogleMap 
                mapContainerStyle={containerStyle} center={center} zoom={6} 
                onLoad={handleMapLoad} 
                options={{ 
                    zoomControl: true, streetViewControl: false, mapTypeControl: true, fullscreenControl: true,
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
                    return uniqueRender.map((spot, i) => (
                        spot.geometry?.location && (
                            <Marker 
                                key={`${type}-${i}`} 
                                position={spot.geometry.location} 
                                icon={{ url: MARKER_ICONS[type], scaledSize: new window.google.maps.Size(30, 30) }} 
                                label={{ text: isSaved(spot.place_id) ? "✓" : '', color: "white", fontWeight: "bold", fontSize: "10px" }} 
                                title={spot.name}
                                onClick={() => setHoveredPlace(spot)}
                                onMouseOver={() => setHoveredPlace(spot)}
                                onMouseOut={() => setHoveredPlace(null)}
                            />
                        )
                    ));
                })}
                
                {hoveredPlace && hoveredPlace.geometry?.location && (
                    <InfoWindow position={hoveredPlace.geometry.location} onCloseClick={() => setHoveredPlace(null)} options={{ disableAutoPan: false, pixelOffset: new google.maps.Size(0, -35) }}>
                        <div className="p-0 w-[220px] overflow-hidden font-sans">
                            <InfoWindowImage place={hoveredPlace} />
                            <div className="p-3 bg-white">
                                <h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight line-clamp-2">{hoveredPlace.name}</h6>
                                <div className="flex items-center gap-2 text-xs text-orange-500 font-bold mb-2"><span>{hoveredPlace.rating ? `★ ${hoveredPlace.rating}` : 'Sin valoración'}</span></div>
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
            </GoogleMap>
        </div>
    );
}