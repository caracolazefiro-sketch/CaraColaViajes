'use client';

import React from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../types';
import { MARKER_ICONS, ICONS_ITINERARY } from '../constants';

// Estilos internos del mapa
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };

// Icono Añadir
const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


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
    onPlaceClick: (place: PlaceWithDistance) => void; // Abre enlace externo
    onAddPlace: (place: PlaceWithDistance) => void;   // NUEVO: Captura el sitio
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
    onPlaceClick,
    onAddPlace // NUEVO
}: TripMapProps) {

    // Helper para verificar si un sitio está guardado (para pintarlo diferente y ocultar el botón de añadir)
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
                            suppressMarkers: false 
                        }} 
                    />
                )}
                
                {/* 2. MARCADORES DE ETAPAS */}
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
                                label={{ 
                                    text: isSaved(spot.place_id) ? "✓" : (i + 1).toString(), 
                                    color: "white", 
                                    fontWeight: "bold", 
                                    fontSize: "10px" 
                                }}
                                title={spot.name}
                                onClick={() => setHoveredPlace(spot)} // Al hacer click, abrimos el InfoWindow (antes era onPlaceClick directo)
                                // onMouseOver y onMouseOut quitados para evitar comportamiento errático con el click
                            />
                        )
                    ));
                })}

                {/* 4. VENTANA DE INFORMACIÓN INTERACTIVA */}
                {hoveredPlace && hoveredPlace.geometry?.location && (
                    <InfoWindow
                        position={hoveredPlace.geometry.location}
                        onCloseClick={() => setHoveredPlace(null)}
                        options={{ disableAutoPan: false, pixelOffset: new google.maps.Size(0, -35) }}
                    >
                        <div className="p-0 w-[220px] overflow-hidden font-sans">
                            {hoveredPlace.photoUrl ? (
                                <img src={hoveredPlace.photoUrl} alt={hoveredPlace.name} className="w-full h-28 object-cover rounded-t-lg" />
                            ) : (
                                <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-4xl text-gray-300">
                                    📍
                                </div>
                            )}
                            <div className="p-3 bg-white">
                                <h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight line-clamp-2">{hoveredPlace.name}</h6>
                                
                                <div className="flex items-center gap-2 text-xs text-orange-500 font-bold mb-2">
                                    <span>{hoveredPlace.rating ? `★ ${hoveredPlace.rating}` : 'Sin valoración'}</span>
                                    {hoveredPlace.user_ratings_total && <span className="text-gray-400 font-normal">({hoveredPlace.user_ratings_total})</span>}
                                </div>

                                <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{hoveredPlace.vicinity}</p>
                                
                                <div className="flex gap-2">
                                    {/* BOTÓN AÑADIR (Solo si no está guardado y hay día seleccionado) */}
                                    {selectedDayIndex !== null && !isSaved(hoveredPlace.place_id) && (
                                        <button 
                                            onClick={() => { onAddPlace(hoveredPlace); setHoveredPlace(null); }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <IconPlusCircle /> Añadir
                                        </button>
                                    )}
                                    
                                    {/* BOTÓN VER EN MAPS */}
                                    <button 
                                        onClick={() => onPlaceClick(hoveredPlace)}
                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold py-1.5 rounded border border-blue-200 transition-colors"
                                    >
                                        Ver en Google
                                    </button>
                                </div>

                                {selectedDayIndex === null && (
                                    <p className="text-[9px] text-red-500 mt-2 text-center italic">Selecciona un día para añadir sitios.</p>
                                )}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}