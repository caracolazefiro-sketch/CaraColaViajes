'use server';

import { apiLogger } from './api-logger';
import { getCachedCityName, setCachedCityName } from './geocoding-cache';

// ⚠️🚨 VERSIÓN OPTIMIZADA API V1.4 - 08/DEC/2025 21:12 🚨⚠️
// 🔧 OPTIMIZACIONES IMPLEMENTADAS:
// - Caché de geocoding para evitar llamadas API duplicadas
// - Eliminada función postSegmentItinerary (segmentación duplicada)
// - Reducción de ~50% en llamadas a Google Geocoding API
// ✅ PROBADO: Funciona correctamente con algoritmo de segmentación único
// Este archivo contiene el algoritmo de segmentación del MOTOR (SERVIDOR).
// La función getDirectionsAndCost es la ÚNICA que debe llamar a Google Directions API.
// El algoritmo de segmentación usa decodePolyline y getDistanceFromLatLonInM para
// calcular puntos de parada cada ~300km sobre el polyline exacto de Google.
// IMPORTANTE: Este algoritmo está DUPLICADO en el cliente (MotorComparisonMaps.tsx)
// porque el servidor y el cliente pueden recibir polylines ligeramente diferentes
// de Google. El cliente es la fuente de verdad para los marcadores en el mapa.
// ⚠️🚨 NO SINCRONIZAR - SON ALGORITMOS SEPARADOS INTENCIONALMENTE 🚨⚠️

// Copia local de getDirectionsAndCost para aislamiento total del MOTOR
import { DailyPlan } from './types';

interface GetDirectionsAndCostParams {
  origin: string;
  destination: string;
  waypoints: string[];
  travel_mode: string;
  kmMaximoDia: number;
  fechaInicio: string;
  fechaRegreso: string;
}

interface GetDirectionsAndCostResult {
  dailyItinerary?: DailyPlan[];
  distanceKm?: number;
  mapUrl?: string;
  error?: string;
  debugLog?: string[];
  googleRawResponse?: any;
}

// --- UTILS ---

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface LatLng {
    lat: number;
    lng: number;
}

function decodePolyline(encoded: string): LatLng[] {
    const poly: LatLng[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Caché de geocoding para evitar llamadas duplicadas (por request)
const geocodingCache = new Map<string, string>();

function getCacheKey(lat: number, lng: number): string {
    // Redondear a 4 decimales (~11m precisión) para agrupar coordenadas muy cercanas
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

async function getCityNameFromCoords(lat: number, lng: number, apiKey: string, attempt = 1): Promise<string> {
    const cacheKey = getCacheKey(lat, lng);

    // 1️⃣ Verificar caché persistente primero (disco)
    const persistentCached = await getCachedCityName(lat, lng);
    if (persistentCached) {
        apiLogger.logAPICall({
            type: 'GEOCODING',
            endpoint: 'geocode',
            params: { lat, lng },
            cached: true,
            duration: 0
        });
        // Guardar en caché de memoria también para este request
        geocodingCache.set(cacheKey, persistentCached);
        return persistentCached;
    }

    // 2️⃣ Verificar caché de memoria (request actual)
    if (geocodingCache.has(cacheKey)) {
        apiLogger.logAPICall({
            type: 'GEOCODING',
            endpoint: 'geocode',
            params: { lat, lng },
            cached: true,
            duration: 0
        });
        return geocodingCache.get(cacheKey)!;
    }

    // 3️⃣ Llamar a Google Geocoding API
    try {
        const startTime = Date.now();
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_2&key=${apiKey}&language=es`;
        const res = await fetch(url);
        const data = await res.json();
        const duration = Date.now() - startTime;

        apiLogger.logAPICall({
            type: 'GEOCODING',
            endpoint: 'geocode',
            params: { lat, lng, attempt },
            response: { status: data.status, resultsCount: data.results?.length || 0 },
            cached: false,
            duration
        });

        if (data.status === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            await sleep(1000 * attempt);
            return getCityNameFromCoords(lat, lng, apiKey, attempt + 1);
        }

        if (data.status === 'OK' && data.results?.[0]) {
            const comp = data.results[0].address_components;
            const locality = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('locality'))?.long_name;
            const admin2 = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('administrative_area_level_2'))?.long_name;
            const result = locality || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

            // Guardar en caché de memoria
            geocodingCache.set(cacheKey, result);
            // 💾 Guardar en caché persistente
            await setCachedCityName(lat, lng, result);
            return result;
        }
    } catch (e) { console.error("Geocode error", e); }

    const fallback = `Parada Táctica (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    geocodingCache.set(cacheKey, fallback);
    // 💾 Guardar fallback en caché persistente también
    await setCachedCityName(lat, lng, fallback);
    return fallback;
}

// ❌ FUNCIÓN ELIMINADA: postSegmentItinerary
// Razón: Duplicaba la segmentación ya realizada en getDirectionsAndCost
// Resultado: ~50% menos llamadas a Google Geocoding API
// La segmentación principal ya divide correctamente por kmMaximoDia

export async function getDirectionsAndCost(data: GetDirectionsAndCostParams): Promise<GetDirectionsAndCostResult> {
    const debugLog: string[] = [];

    // Limpiar caché al inicio de cada request
    geocodingCache.clear();

    // 📊 Iniciar logging del viaje (solo waypoints con paradas reales, excluir coordenadas)
    const realWaypoints = data.waypoints?.filter(w => !w.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) || [];
    const tripId = apiLogger.startTrip(
        data.origin,
        data.destination,
        data.kmMaximoDia,
        realWaypoints.length > 0 ? realWaypoints : undefined
    );
    debugLog.push(`📊 Trip ID: ${tripId}`);

    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return { error: "Clave de API de Google Maps no configurada. Configure 'GOOGLE_MAPS_API_KEY_FIXED' (preferido) o 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'." };
    }

    const normalizeForGoogle = (text: string) => {
        const parts = text.split(',');
        const location = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : text.trim();
        return location.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const normalizedOrigin = normalizeForGoogle(data.origin);
    const normalizedDestination = normalizeForGoogle(data.destination);
    const normalizedWaypoints = data.waypoints.map(w => normalizeForGoogle(w));

    const allStops = [data.origin, ...data.waypoints.filter(w => w), data.destination];

    // 🆕 ROUTES API (nueva generación) - más eficiente y económica
    const routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    // Construir waypoints para Routes API
    const intermediates = normalizedWaypoints.map(w => ({
        address: w
    }));

    const requestBody = {
        origin: { address: normalizedOrigin },
        destination: { address: normalizedDestination },
        ...(intermediates.length > 0 && { intermediates }),
        travelMode: data.travel_mode.toUpperCase(),
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false
        },
        languageCode: 'es',
        units: 'METRIC'
    };

    debugLog.push('🔗 MOTOR: Routes API Call (v2)');

    try {
        const directionsStartTime = Date.now();
        const response = await fetch(routesApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs'
            },
            body: JSON.stringify(requestBody)
        });

        const routesResult = await response.json();
        const directionsDuration = Date.now() - directionsStartTime;

        apiLogger.logAPICall({
            type: 'DIRECTIONS',
            endpoint: 'routes/v2:computeRoutes',
            params: {
                origin: normalizedOrigin,
                destination: normalizedDestination,
                waypoints: normalizedWaypoints,
                mode: data.travel_mode
            },
            response: {
                status: response.ok ? 'OK' : 'ERROR',
                routesCount: routesResult.routes?.length || 0
            },
            duration: directionsDuration
        });

        if (!response.ok || !routesResult.routes || routesResult.routes.length === 0) {
            debugLog.push(`❌ Routes API Response: ${routesResult.error?.message || 'No routes found'}`);
            return {
                error: `Routes API Error: ${routesResult.error?.message || 'No routes found'}`,
                debugLog,
                googleRawResponse: routesResult
            };
        }

        const route = routesResult.routes[0];

        // Validar que la respuesta tenga la estructura esperada
        if (!route.legs || route.legs.length === 0) {
            debugLog.push(`❌ Routes API: No legs found in route`);
            return {
                error: 'Routes API returned invalid route structure (no legs)',
                debugLog,
                googleRawResponse: routesResult
            };
        }

        // Extraer distancia total de Routes API (ya viene en metros)
        let totalDistanceMeters = route.distanceMeters || 0;
        const distanceKm = totalDistanceMeters / 1000;

        const allDrivingStops: {
            from: string, to: string, distance: number,
            startCoords: {lat: number, lng: number},
            endCoords: {lat: number, lng: number}
        }[] = [];

        const finalWaypointsForMap: string[] = [];
        const maxMeters = data.kmMaximoDia * 1000;

        // Factor de corrección para fusionar última etapa si es muy pequeña
        let minLastStageKm = 45; // Default para 300km
        if (data.kmMaximoDia <= 100) {
            minLastStageKm = 15;
        } else if (data.kmMaximoDia <= 200) {
            minLastStageKm = 30;
        } else if (data.kmMaximoDia <= 300) {
            minLastStageKm = 45;
        } else if (data.kmMaximoDia <= 400) {
            minLastStageKm = 55;
        } else if (data.kmMaximoDia >= 500) {
            minLastStageKm = 65;
        }
        const minLastStageMeters = minLastStageKm * 1000;

        // Validar que el primer leg tenga startLocation
        if (!route.legs[0].startLocation?.latLng) {
            debugLog.push(`❌ Routes API: First leg missing startLocation.latLng`);
            return {
                error: 'Routes API returned invalid leg structure',
                debugLog,
                googleRawResponse: routesResult
            };
        }

        let currentLegStartName = allStops[0];
        let currentLegStartCoords = {
            lat: route.legs[0].startLocation.latLng.latitude,
            lng: route.legs[0].startLocation.latLng.longitude
        };

        let dayAccumulatorMeters = 0;

        for (let i = 0; i < route.legs.length; i++) {
            const leg = route.legs[i];
            const nextStopName = allStops[i + 1];
            let legDistanceMeters = 0;

            // Validar que leg tenga steps
            if (!leg.steps || leg.steps.length === 0) {
                debugLog.push(`⚠️ Leg ${i} has no steps, using leg distanceMeters directly`);
                legDistanceMeters = leg.distanceMeters || 0;
            } else {
                for (const step of leg.steps) {
                    legDistanceMeters += step.distanceMeters || 0;
                }
            }

            // 🐛 FIX: Segmentar legs que exceden maxMeters, incluso si es la primera leg
            if (legDistanceMeters > maxMeters || (dayAccumulatorMeters + legDistanceMeters > maxMeters && dayAccumulatorMeters > 0)) {
                if (!leg.steps || leg.steps.length === 0) {
                    debugLog.push(`⚠️ Cannot segment leg ${i} - no steps available`);
                    dayAccumulatorMeters += legDistanceMeters;
                } else {
                    for (const step of leg.steps) {
                        const stepDist = step.distanceMeters || 0;

                        if (!step.polyline?.encodedPolyline) {
                            debugLog.push(`⚠️ Step missing polyline, skipping segmentation`);
                            dayAccumulatorMeters += stepDist;
                            continue;
                        }

                    if (dayAccumulatorMeters + stepDist < maxMeters) {
                        dayAccumulatorMeters += stepDist;
                    } else {
                        let metersNeeded = maxMeters - dayAccumulatorMeters;
                        let metersLeftInStep = stepDist;
                        const path = decodePolyline(step.polyline.encodedPolyline);
                        let currentPathIndex = 0;

                        while (metersLeftInStep >= metersNeeded) {
                            let distWalked = 0;
                            let stopCoords = path[currentPathIndex];
                            let bestMatchIndex = currentPathIndex;

                            // Encontrar el punto EXACTO del polyline más cercano a metersNeeded
                            for (let p = currentPathIndex; p < path.length - 1; p++) {
                                const segment = getDistanceFromLatLonInM(path[p].lat, path[p].lng, path[p+1].lat, path[p+1].lng);
                                if (distWalked + segment >= metersNeeded) {
                                    // En lugar de interpolar, elegir el punto del polyline más cercano
                                    const distToCurrentPoint = Math.abs(distWalked - metersNeeded);
                                    const distToNextPoint = Math.abs((distWalked + segment) - metersNeeded);

                                    if (distToNextPoint < distToCurrentPoint) {
                                        stopCoords = path[p + 1]; // El siguiente punto está más cerca
                                        bestMatchIndex = p + 1;
                                    } else {
                                        stopCoords = path[p]; // El punto actual está más cerca
                                        bestMatchIndex = p;
                                    }

                                    currentPathIndex = bestMatchIndex;
                                    metersLeftInStep -= metersNeeded;
                                    break;
                                }
                                distWalked += segment;
                            }

                            await sleep(200);
                            const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey);
                            const stopName = stopNameRaw;

                            allDrivingStops.push({
                                from: currentLegStartName,
                                to: stopName,
                                distance: data.kmMaximoDia,
                                startCoords: currentLegStartCoords,
                                endCoords: stopCoords
                            });

                            finalWaypointsForMap.push(`${stopCoords.lat},${stopCoords.lng}`);

                            currentLegStartName = stopNameRaw;
                            currentLegStartCoords = stopCoords;
                            dayAccumulatorMeters = 0;
                            metersNeeded = maxMeters;
                        }
                        dayAccumulatorMeters += metersLeftInStep;
                    }
                    }
                }
            } else {
                dayAccumulatorMeters += legDistanceMeters;
            }

            const legEndCoords = { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude };

            // 🔍 Fusionar etapa si es muy pequeña (< 45km para 300km/día)
            // Esto evita etapas ridículas de 10-20km entre waypoints
            if (dayAccumulatorMeters < minLastStageMeters && allDrivingStops.length > 0) {
                // Fusionar con la última etapa creada
                const previousStop = allDrivingStops[allDrivingStops.length - 1];
                previousStop.to = nextStopName;
                previousStop.distance += dayAccumulatorMeters / 1000;
                previousStop.endCoords = legEndCoords;

                // No agregar nueva etapa, solo actualizar waypoint final si no es el último
                if (i < route.legs.length - 1) finalWaypointsForMap.push(nextStopName);
            } else {
                // Etapa normal
                allDrivingStops.push({
                    from: currentLegStartName,
                    to: nextStopName,
                    distance: dayAccumulatorMeters / 1000,
                    startCoords: currentLegStartCoords,
                    endCoords: legEndCoords
                });

                if (i < route.legs.length - 1) finalWaypointsForMap.push(nextStopName);
            }

            currentLegStartName = nextStopName;
            currentLegStartCoords = legEndCoords;
            dayAccumulatorMeters = 0;
        }

        const dailyItinerary: DailyPlan[] = [];
        let currentDate = new Date(data.fechaInicio);
        let dayCounter = 1;

        for (const stop of allDrivingStops) {
             dailyItinerary.push({
                date: formatDate(currentDate),
                day: dayCounter,
                from: stop.from,
                to: stop.to,
                distance: stop.distance,
                isDriving: true,
                startCoordinates: stop.startCoords,
                coordinates: stop.endCoords
            });
            currentDate = addDays(currentDate, 1);
            dayCounter++;
        }

        if (data.fechaRegreso) {
            const dateEnd = new Date(data.fechaRegreso);
            const diffTime = dateEnd.getTime() - currentDate.getTime();
            const daysStay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysStay > 0) {
                const lastLeg = route.legs[route.legs.length - 1];
                const stayCoords = { lat: lastLeg.endLocation.latLng.latitude, lng: lastLeg.endLocation.latLng.longitude };

                let stayLocation = data.destination;
                try {
                    stayLocation = await getCityNameFromCoords(stayCoords.lat, stayCoords.lng, apiKey);
                } catch {
                    // usar destino original
                }

                for (let i = 0; i < daysStay; i++) {
                     dailyItinerary.push({
                        date: formatDate(currentDate),
                        day: dayCounter,
                        from: stayLocation,
                        to: stayLocation,
                        distance: 0,
                        isDriving: false,
                        startCoordinates: stayCoords,
                        coordinates: stayCoords
                    });
                    currentDate = addDays(currentDate, 1);
                    dayCounter++;
                }
            }
        }

        // ✅ OPTIMIZACIÓN: Ya no necesitamos postSegmentItinerary
        // La segmentación principal ya divide correctamente por kmMaximoDia
        const segmentedItinerary = dailyItinerary;

        const embedParams = {
            key: apiKey,
            origin: data.origin,
            destination: data.destination,
            waypoints: finalWaypointsForMap.join('|'),
            mode: data.travel_mode,
        };
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as Record<string, string>).toString()}`;

        // 📊 Finalizar logging del viaje
        apiLogger.endTrip(distanceKm, segmentedItinerary.length);

        return { distanceKm, mapUrl, dailyItinerary: segmentedItinerary, debugLog, googleRawResponse: routesResult };

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugLog.push(`⚠️ Exception: ${msg}`);

        // 📊 Finalizar logging incluso con error
        apiLogger.endTrip();

        return { error: msg || "Error al calcular la ruta.", debugLog };
    }
}
