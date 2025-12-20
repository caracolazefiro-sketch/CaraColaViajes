'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../types';
import { createMarkerIcon } from './ServiceIcons';
import StarRating from './StarRating';
import { filterAndSort } from '../hooks/useSearchFilters';
import { IconStar, IconMapPin, IconTrendingUp } from '../lib/svgIcons';
import { areasAcLabelForCode } from '../utils/areasacLegend';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };

const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconSearch = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const IconX = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

function parseAreasAcNote(note: string): { header: string; compactHeader: string; codes: string[] } {
    const raw = String(note || '').trim();
    if (!raw) return { header: '', compactHeader: '', codes: [] };
    if (!raw.startsWith('ÁreasAC')) return { header: raw, compactHeader: raw, codes: [] };

    // Example: "ÁreasAC (PU) · Gratis · Todo el año · Servicios: PN, AL, ..."
    const parts = raw.split(' · ').map((s) => s.trim()).filter(Boolean);
    const servicePart = parts.find((p) => /^Servicios:/i.test(p));
    const headerParts = parts.filter((p) => p !== servicePart);

    const codes = servicePart
        ? servicePart
              .replace(/^Servicios:\s*/i, '')
              .split(/,\s*/)
              .map((c) => c.trim())
              .filter(Boolean)
        : [];

    const header = headerParts.join(' · ');

    // Compact header to keep the InfoWindow short.
    // Example full: "ÁreasAC (PU) · Gratis · Todo el año"
    const typeMatch = header.match(/\(([^)]+)\)/);
    const typeCode = typeMatch?.[1]?.trim().toUpperCase();
    const compactFlags: string[] = [];
    if (/Gratis/i.test(header)) compactFlags.push('Gratis');
    if (/Pago/i.test(header)) compactFlags.push('Pago');
    if (/Advertencia/i.test(header)) compactFlags.push('!');
    if (/Todo el año/i.test(header)) compactFlags.push('Año');

    const compactHeader = [typeCode || 'ÁreasAC', ...compactFlags].join(' · ');
    return { header, compactHeader, codes };
}

// Helper component for InfoWindow image with error handling
const InfoWindowImage = ({ place }: { place: PlaceWithDistance }) => {
    const [imageError, setImageError] = useState(false);

    if (!place.photoUrl || place.photoUrl.trim() === '' || imageError) {
        return (
            <div className="w-full h-20 bg-gray-100 flex items-center justify-center rounded-t-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="CaraCola Viajes" className="h-12 w-12 object-contain opacity-80" />
            </div>
        );
    }

    // Usar img nativo para URLs de Google Maps PhotoService que no funcionan con Next.js Image
    return (
        /* eslint-disable-next-line @next/next/no-img-element */
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
    overviewPolyline?: string | null;
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
    setMap, mapBounds, directionsResponse, overviewPolyline, dailyItinerary, places, toggles,
    selectedDayIndex, hoveredPlace, setHoveredPlace, onPlaceClick, onAddPlace,
    onSearch, onClearSearch, mapInstance, t, minRating = 0, setMinRating, searchRadius = 50, setSearchRadius, sortBy = 'score', setSortBy
}: TripMapProps) {

    const [searchQuery, setSearchQuery] = useState('');
    const [clickedGooglePlace, setClickedGooglePlace] = useState<PlaceWithDistance | null>(null);

    // Cache local para evitar repetir Place Details (fotos, etc.) en clicks.
    const placeDetailsCacheRef = useRef<Record<string, Partial<PlaceWithDistance>>>({});
    const placeDetailsInFlightRef = useRef<Record<string, boolean>>({});

    const tryEnrichPlaceOnClick = (spot: PlaceWithDistance) => {
        const placeId = spot.place_id || '';
        if (!mapInstance) {
            setHoveredPlace(spot);
            return;
        }

        // No intentar enrich para no-Google IDs
        if (!placeId || placeId.startsWith('custom-') || placeId.startsWith('areasac:')) {
            setHoveredPlace(spot);
            return;
        }

        const cached = placeDetailsCacheRef.current[placeId];
        if (cached) {
            setHoveredPlace({ ...spot, ...cached });
            return;
        }

        if (placeDetailsInFlightRef.current[placeId]) {
            setHoveredPlace(spot);
            return;
        }

        placeDetailsInFlightRef.current[placeId] = true;
        setHoveredPlace(spot);

        try {
            const service = new google.maps.places.PlacesService(mapInstance);
            service.getDetails(
                {
                    placeId,
                    fields: ['photos', 'name', 'formatted_address', 'vicinity', 'rating', 'user_ratings_total', 'geometry', 'types'],
                },
                (place, status) => {
                    placeDetailsInFlightRef.current[placeId] = false;
                    if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

                    const lat = place.geometry?.location?.lat?.();
                    const lng = place.geometry?.location?.lng?.();
                    let photoUrl: string | undefined;
                    if (place.photos && place.photos.length > 0) {
                        try {
                            photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
                        } catch {
                            // ignore
                        }
                    }

                    const enriched: Partial<PlaceWithDistance> = {
                        name: place.name || spot.name,
                        vicinity: (place.formatted_address as string) || (place.vicinity as string) || spot.vicinity,
                        rating: place.rating ?? spot.rating,
                        user_ratings_total: place.user_ratings_total ?? spot.user_ratings_total,
                        types: (place.types as string[] | undefined) || spot.types,
                        photoUrl: photoUrl || spot.photoUrl,
                        geometry:
                            lat != null && lng != null
                                ? { location: { lat, lng } }
                                : spot.geometry,
                    };

                    placeDetailsCacheRef.current[placeId] = enriched;
                    if (hoveredPlace && hoveredPlace.place_id === placeId) {
                        setHoveredPlace({ ...hoveredPlace, ...enriched });
                    }
                }
            );
        } catch {
            placeDetailsInFlightRef.current[placeId] = false;
        }
    };

    // CONTROL DE INTERACCIÓN (SISTEMA VS HUMANO)
    const hasUserInteracted = useRef(false);
    const isProgrammaticMove = useRef(false);

    // Decode an encoded Google polyline (same algorithm as server side)
    const decodedOverviewPath = useMemo(() => {
        if (!overviewPolyline) return null;
        const poly: google.maps.LatLngLiteral[] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < overviewPolyline.length) {
            let b = 0;
            let shift = 0;
            let result = 0;
            do {
                b = overviewPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = overviewPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
        }

        return poly;
    }, [overviewPolyline]);

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
                service.getDetails({ placeId: e.placeId, fields: ['photos', 'name', 'formatted_address', 'vicinity', 'rating', 'user_ratings_total', 'geometry', 'types'] }, (place, status) => {
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
        // CASO 3: Server-beta fallback (polyline) sin DirectionsResult
        else if (!directionsResponse && decodedOverviewPath && !hasUserInteracted.current && selectedDayIndex === null) {
            const bounds = new google.maps.LatLngBounds();
            decodedOverviewPath.forEach((p) => bounds.extend(p));
            applyBounds(bounds);
        }
    }, [mapInstance, mapBounds, directionsResponse, decodedOverviewPath, selectedDayIndex]);

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

    const mapOptions = useMemo((): google.maps.MapOptions => {
        const g = typeof google !== 'undefined' ? google : undefined;
        return {
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            scaleControl: true,
            mapTypeControlOptions: g
                ? { position: g.maps.ControlPosition.TOP_LEFT }
                : undefined,
            fullscreenControlOptions: g
                ? { position: g.maps.ControlPosition.BOTTOM_LEFT }
                : undefined,
            zoomControlOptions: g
                ? { position: g.maps.ControlPosition.LEFT_TOP }
                : undefined,
        };
    }, []);

    // Generamos una clave única para forzar el repintado de la ruta si cambia
    // Usamos el polyline codificado como ID único de la ruta
    const routeKey = (directionsResponse?.routes?.[0]?.overview_polyline as unknown as string) || overviewPolyline || 'no-route';

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

            {/* Filter Sliders - En línea única en parte BAJA del mapa (usando SOLO SVG) */}

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
                options={mapOptions}
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

                {!directionsResponse && decodedOverviewPath && (
                    <Polyline
                        key={routeKey}
                        path={decodedOverviewPath}
                        options={{ strokeColor: '#DC2626', strokeOpacity: 1, strokeWeight: 4 }}
                    />
                )}

                {/* Marcadores de pernocta con círculos verdes y nombre de ciudad */}
                {dailyItinerary?.map((day, i) => day.coordinates && (
                    <Marker
                        key={`itinerary-${i}`}
                        position={day.coordinates}
                        label={{
                            text: day.to,
                            color: '#1e7e34',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#4CAF50',
                            fillOpacity: 1,
                            strokeColor: '#fff',
                            strokeWeight: 2,
                        }}
                        title={`📍 ${day.to} (${day.distance?.toFixed(0) || '?'} km)`}
                    />
                ))}

                {Object.keys(places).map((key) => {
                    const type = key as ServiceType;
                    const savedDay = selectedDayIndex !== null ? dailyItinerary![selectedDayIndex] : null;
                    const savedOfType = savedDay?.savedPlaces?.filter(s => s.type === type) || [];

                    // Mostrar lugares guardados SIEMPRE, incluso si toggle OFF (sin filtrado)
                    // Mostrar resultados de búsqueda solo si toggle ON (CON filtrado)
                    let listToRender: PlaceWithDistance[] = [];
                    let searchResults: PlaceWithDistance[] = [];

                    if (savedOfType.length > 0) {
                        // Lugares guardados siempre visibles SIN filtrado
                        listToRender = [...savedOfType];
                    }
                    if (toggles[type]) {
                        // Obtener resultados de búsqueda sin procesar
                        if (type === 'custom') {
                            searchResults = savedOfType;
                        } else if (type === 'search') {
                            searchResults = places.search || [];
                        } else {
                            searchResults = places[type] || [];
                        }

                        // 🔥 APLICAR FILTRADO SOLO a resultados de búsqueda (NO a lugares guardados)
                        const filteredSearchResults = filterAndSort(searchResults, minRating, searchRadius, sortBy);
                        listToRender = [...savedOfType, ...filteredSearchResults];
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
                                onClick={() => tryEnrichPlaceOnClick(spot)}
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
                                {hoveredPlace.note && (
                                    (() => {
                                        const parsed = parseAreasAcNote(hoveredPlace.note);
                                        return (
                                            <div className="mb-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded text-[9px] text-gray-700">
                                                <div className="font-semibold truncate" title={parsed.header}>{parsed.compactHeader}</div>
                                                {parsed.codes.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {parsed.codes.map((c) => (
                                                            <span
                                                                key={c}
                                                                className="px-1 py-0.5 rounded bg-white border border-yellow-200 text-[8px] font-mono"
                                                                title={(() => {
                                                                    const label = areasAcLabelForCode(c);
                                                                    return label ? `${c} — ${label}` : `Código ÁreasAC: ${c}`;
                                                                })()}
                                                            >
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                )}
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

            {/* Filter Controls - Línea única con ROJO + Tooltip */}
            {setMinRating && setSearchRadius && setSortBy && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-transparent rounded-lg p-3 flex flex-col items-center gap-3 w-fit group">
                    {/* Sliders Container */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Rating Slider - ROJO DEGRADADO */}
                        <div className="flex flex-col items-center gap-1.5">
                            <label className="text-[11px] font-light text-red-600 flex items-center gap-1.5">
                                <IconStar size={13} /> {minRating.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={minRating}
                                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                                className="w-24 md:w-32 h-0.5 rounded appearance-none cursor-pointer slider-thumb-red-small"
                                style={{
                                    background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${(minRating / 5) * 100}%, rgba(75,85,99,0.2) ${(minRating / 5) * 100}%, rgba(75,85,99,0.2) 100%)`,
                                    WebkitAppearance: 'none',
                                } as React.CSSProperties}
                            />
                        </div>

                        {/* Radio Slider - ROJO DEGRADADO */}
                        <div className="flex flex-col items-center gap-1.5">
                            <label className="text-[11px] font-light text-red-600 flex items-center gap-1.5">
                                <IconMapPin size={13} /> {searchRadius}km
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="25"
                                step="5"
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                                className="w-24 md:w-32 h-0.5 rounded appearance-none cursor-pointer slider-thumb-red-small"
                                style={{
                                    background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${((searchRadius - 5) / 20) * 100}%, rgba(75,85,99,0.2) ${((searchRadius - 5) / 20) * 100}%, rgba(75,85,99,0.2) 100%)`,
                                    WebkitAppearance: 'none',
                                } as React.CSSProperties}
                            />
                        </div>

                        {/* Sort Slider - ROJO DEGRADADO */}
                        <div className="flex flex-col items-center gap-1.5">
                            <label className="text-[11px] font-light text-red-600 flex items-center gap-1.5">
                                <IconTrendingUp size={13} />
                                {sortBy === 'score' ? 'Score' : sortBy === 'distance' ? 'Dist.' : 'Rate'}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="1"
                                value={sortBy === 'score' ? 0 : sortBy === 'distance' ? 1 : 2}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setSortBy(val === 0 ? 'score' : val === 1 ? 'distance' : 'rating');
                                }}
                                className="w-24 md:w-32 h-0.5 rounded appearance-none cursor-pointer slider-thumb-red-small"
                                style={{
                                    background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${((sortBy === 'score' ? 0 : sortBy === 'distance' ? 1 : 2) / 2) * 100}%, rgba(75,85,99,0.2) ${((sortBy === 'score' ? 0 : sortBy === 'distance' ? 1 : 2) / 2) * 100}%, rgba(75,85,99,0.2) 100%)`,
                                    WebkitAppearance: 'none',
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>

                    {/* Tooltip Info - Una línea debajo de los sliders */}
                    <div className="text-center bg-transparent text-gray-700 text-[10px] rounded-lg px-3 py-1.5 whitespace-nowrap pointer-events-none border border-gray-300 border-opacity-40">
                        <p className="text-gray-600 font-light">Rating: {minRating.toFixed(1)}/5 • Radio: {searchRadius}km • Orden: {sortBy === 'score' ? 'Relevancia' : sortBy === 'distance' ? 'Distancia' : 'Puntuación'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
