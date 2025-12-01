// app/components/TripMap.tsx
'use client';

import React from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../types';
import { MARKER_ICONS, ICONS_ITINERARY } from '../constants';

// Estilos internos del mapa
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };

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
}

export default function TripMap({
    setMap,
    mapBounds,
    directionsResponse,
    dailyItinerary,
    places,
    toggles,
    selectedDayIndex,
    hoveredPlace,
    setHoveredPlace,
    onPlaceClick
}: TripMapProps) {

    // Helper para verificar si un sitio está guardado (para pintarlo diferente)
    const isSaved = (placeId?: string) => {
        if (!dailyItinerary || selectedDayIndex === null) return false;
        const currentDay = dailyItinerary[selectedDayIndex];
        return currentDay.savedPlaces?.some(p => p.place_id === placeId);
    };

    return (
        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative no-print">
            <GoogleMap 
                mapContainerStyle={containerStyle} 
                center={center} 
                zoom={6} 
                onLoad={map => { 
                    setMap(map); 
                    if (mapBounds) map.fitBounds(mapBounds); 
                }}
            >
                {/* 1. LÍNEA DE RUTA AZUL/ROJA */}
                {directionsResponse && (
                    <DirectionsRenderer 
                        directions={directionsResponse} 
                        options={{ 
                            polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4 },
                            suppressMarkers: false // Dejamos los marcadores A/B por defecto de Google para origen/destino global
                        }} 
                    />
                )}
                
                {/* 2. MARCADORES DE ETAPAS (Inicio/Fin de cada día) */}
                {dailyItinerary?.map((day, i) => day.coordinates && (
                    <Marker 
                        key={`itinerary-${i}`}
                        position={day.coordinates}
                        icon={day.type === 'tactical' ? ICONS_ITINERARY.tactical : ICONS_ITINERARY.startEnd}
                        title={day.to}
                        label={{ text: `${i+1}`, color: "white", fontSize: "10px", fontWeight: "bold" }}
                    />
                ))}

                {/* 3. MARCADORES DE SITIOS (POIs) */}
                {Object.keys(places).map((key) => {
                    const type = key as ServiceType;
                    
                    // Lógica de filtrado visual (copiada de page.tsx)
                    const savedDay = selectedDayIndex !== null ? dailyItinerary![selectedDayIndex] : null;
                    const savedOfType = savedDay?.savedPlaces?.filter(s => s.type === type) || [];
                    let listToRender: PlaceWithDistance[] = [];

                    if (toggles[type] || type === 'camping') {
                        if (savedOfType.length > 0 && type !== 'tourism') listToRender = savedOfType; 
                        else if (type === 'custom') listToRender = savedOfType; 
                        else listToRender = [...savedOfType, ...places[type]];
                    } else {
                        listToRender = savedOfType;
                    }

                    // Evitar duplicados visuales
                    const uniqueRender = listToRender.filter((v,i,a)=>a.findIndex(t=>(t.place_id === v.place_id))===i);
                    
                    return uniqueRender.map((spot, i) => (
                        spot.geometry?.location && (
                            <Marker 
                                key={`${type}-${i}`} 
                                position={spot.geometry.location} 
                                icon={{
                                    url: MARKER_ICONS[type],
                                    scaledSize: new window.google.maps.Size(30, 30)
                                }}
                                // Si está guardado, le ponemos un "Check", si no, un número
                                label={{ 
                                    text: isSaved(spot.place_id) ? "✓" : (i + 1).toString(), 
                                    color: "white", 
                                    fontWeight: "bold", 
                                    fontSize: "10px" 
                                }}
                                title={spot.name}
                                onClick={() => onPlaceClick(spot)}
                                onMouseOver={() => setHoveredPlace(spot)}
                                onMouseOut={() => setHoveredPlace(null)}
                            />
                        )
                    ));
                })}

                {/* 4. VENTANA DE INFORMACIÓN (HOVER) */}
                {hoveredPlace && hoveredPlace.geometry?.location && (
                    <InfoWindow
                        position={hoveredPlace.geometry.location}
                        onCloseClick={() => setHoveredPlace(null)}
                        options={{ disableAutoPan: true, pixelOffset: new google.maps.Size(0, -35) }}
                    >
                        <div className="p-0 w-[200px] overflow-hidden">
                            {hoveredPlace.photoUrl ? (
                                <img src={hoveredPlace.photoUrl} alt={hoveredPlace.name} className="w-full h-24 object-cover rounded-t-lg" />
                            ) : (
                                <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-4xl">
                                    {/* Icono gigante si no hay foto */}
                                    {hoveredPlace.type === 'custom' ? '⭐' :
                                     hoveredPlace.type === 'camping' ? '🚐' :
                                     hoveredPlace.type === 'restaurant' ? '🍳' :
                                     hoveredPlace.type === 'water' ? '💧' :
                                     hoveredPlace.type === 'gas' ? '⛽' :
                                     hoveredPlace.type === 'supermarket' ? '🛒' :
                                     hoveredPlace.type === 'laundry' ? '🧺' :
                                     hoveredPlace.type === 'tourism' ? '📷' : '📍'}
                                </div>
                            )}
                            <div className="p-2 bg-white">
                                <h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight">{hoveredPlace.name}</h6>
                                <div className="flex items-center gap-1 text-xs text-orange-500 font-bold mb-1">
                                    {hoveredPlace.rating ? `★ ${hoveredPlace.rating}` : 'Sin valoración'}
                                    {hoveredPlace.user_ratings_total && <span className="text-gray-400 font-normal">({hoveredPlace.user_ratings_total})</span>}
                                </div>
                                <p className="text-[10px] text-gray-500 line-clamp-2">{hoveredPlace.vicinity}</p>
                                {hoveredPlace.opening_hours?.open_now !== undefined && (
                                    <p className={`text-[10px] font-bold mt-1 ${hoveredPlace.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                        {hoveredPlace.opening_hours.open_now ? '● Abierto' : '● Cerrado'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}