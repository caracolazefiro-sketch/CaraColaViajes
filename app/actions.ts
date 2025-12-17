 'use server';

// 💾 Importar funciones de caché persistente
import { getCachedCityName, setCachedCityName } from './motor-bueno/geocoding-cache';

// 🔍 API Logger para tracking de llamadas
import { apiLogger } from './utils/api-logger';
import { logApiToSupabase } from './utils/server-logs';
import {
    getGeocodingCache,
    makeGeocodingCacheKey,
    upsertGeocodingCache,
    getDirectionsCache,
    makeDirectionsCacheKey,
    upsertDirectionsCache,
} from './utils/supabase-cache';

// Definiciones de interfaces locales para el server action
interface DailyPlan {
  date: string;
  day: number;
  from: string;
  to: string;
  distance: number;
  isDriving: boolean;
  warning?: string;
  coordinates?: { lat: number; lng: number }; // Destino
  startCoordinates?: { lat: number; lng: number }; // Inicio
  isoDate: string; // ISO format para consistencia con types.ts
  type: 'overnight' | 'tactical' | 'start' | 'end'; // Tipo de día
}

interface DirectionsRequest {
    origin: string;
    destination: string;
    waypoints: string[];
    travel_mode: 'driving';
    kmMaximoDia: number;
    fechaInicio: string;
    fechaRegreso: string;
    tripName?: string;
    tripId?: string;
}

interface DirectionsResult {
    distanceKm?: number;
    mapUrl?: string;
    overviewPolyline?: string;
    error?: string;
    dailyItinerary?: DailyPlan[];
    debugLog?: string[]; // Logs del servidor para debugging
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

// Algoritmo de decodificación de Polyline
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

type CityNameContext = {
    tripId?: string;
    attempt?: number;
};

async function getCityNameFromCoords(lat: number, lng: number, apiKey: string, ctx?: CityNameContext): Promise<string> {
    const attempt = ctx?.attempt ?? 1;
    const tripId = ctx?.tripId;
    try {
        // 0) Supabase cache (server-side, shared across deployments)
        const geoKey = makeGeocodingCacheKey(lat, lng);
        const sbCache = await getGeocodingCache({ key: geoKey.key });
        if (sbCache.ok && sbCache.hit && sbCache.cityName) {
            apiLogger.logGeocoding({ lat, lng }, { status: 'CACHE_HIT_SUPABASE' }, 0, true);
            await logApiToSupabase({
                trip_id: tripId,
                api: 'google-geocoding',
                method: 'GET',
                url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}`,
                status: 'CACHE_HIT_SUPABASE',
                duration_ms: 0,
                cost: 0,
                cached: true,
                request: { lat, lng, cache: { provider: 'supabase', key: geoKey.key } },
                response: {
                    status: 'CACHE_HIT_SUPABASE',
                    cityName: sbCache.cityName,
                    resolvedFrom: sbCache.resolvedFrom,
                    cache: { provider: 'supabase', key: geoKey.key, expiresAt: sbCache.expiresAt },
                    cacheWrite: { provider: 'supabase', action: 'none' },
                },
            });
            return sbCache.cityName;
        }

        // 💾 PRIMERO: Verificar caché persistente
        const cachedName = await getCachedCityName(lat, lng);
        if (cachedName) {
            // 🔍 Log de cache hit
            apiLogger.logGeocoding({ lat, lng }, { status: 'CACHE_HIT' }, 0, true);
            // Registrar cache hit en Supabase (coste 0)
            await logApiToSupabase({
                trip_id: tripId,
                api: 'google-geocoding',
                method: 'GET',
                url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}`,
                status: 'CACHE_HIT',
                duration_ms: 0,
                cost: 0,
                cached: true,
                request: { lat, lng, cache: { provider: 'local-file' } },
                response: { status: 'CACHE_HIT', cityName: cachedName, cache: { provider: 'local-file' }, cacheWrite: { provider: 'supabase', action: 'none' } }
            });
            return cachedName;
        }

        // ❌ MISS: Si no está en caché, llamar a Google API
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_2&key=${apiKey}&language=es`;

        // 🔍 Timing de Geocoding API
        const geocodeStartTime = performance.now();
        const res = await fetch(geocodeUrl);
        const data = await res.json();
        const geocodeEndTime = performance.now();
        const geocodeDuration = geocodeEndTime - geocodeStartTime;

        if (data.status === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            await sleep(1000 * attempt);
            return getCityNameFromCoords(lat, lng, apiKey, { tripId, attempt: attempt + 1 });
        }

        if (data.status === 'OK' && data.results?.[0]) {
            const comp = data.results[0].address_components;
            const locality = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('locality'))?.long_name;
            const admin3 = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('administrative_area_level_3'))?.long_name;
            const admin2 = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('administrative_area_level_2'))?.long_name;

            const resolvedFrom: 'locality' | 'administrative_area_level_3' | 'administrative_area_level_2' | 'fallback' =
                locality ? 'locality' : admin3 ? 'administrative_area_level_3' : admin2 ? 'administrative_area_level_2' : 'fallback';
            const cityName = locality || admin3 || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

            // 🔍 Log de Geocoding API call (cliente/local)
            apiLogger.logGeocoding({ lat, lng }, data, geocodeDuration, false);

            // 💾 Guardar en caché para futuras llamadas
            await setCachedCityName(lat, lng, cityName);

            // 💾 Guardar en Supabase cache (best-effort) y reflejar resultado en el MISMO log
            const up = await upsertGeocodingCache({
                key: geoKey.key,
                lat: geoKey.lat,
                lng: geoKey.lng,
                cityName,
                resolvedFrom,
                payload: { status: data.status, resultsCount: data.results?.length || 0 },
                ttlDays: 30,
            });

            const reqCache: Record<string, unknown> = sbCache.ok
                ? { provider: 'supabase', key: geoKey.key, hit: false }
                : { provider: 'supabase', key: geoKey.key, ok: false, reason: sbCache.reason };

            const cacheWrite: Record<string, unknown> = up.ok
                ? {
                    provider: 'supabase',
                    action: 'upsert',
                    table: 'api_cache_geocoding',
                    key: geoKey.key,
                    ok: true,
                    expiresAt: up.expiresAt,
                    ttlDays: up.ttlDays,
                }
                : {
                    provider: 'supabase',
                    action: 'upsert',
                    table: 'api_cache_geocoding',
                    key: geoKey.key,
                    ok: false,
                    reason: up.reason,
                };

            // Supabase server logging (respuesta útil + estado real de escritura en caché)
            await logApiToSupabase({
                trip_id: tripId,
                api: 'google-geocoding',
                method: 'GET',
                url: geocodeUrl,
                status: data.status,
                duration_ms: Math.round(geocodeDuration),
                cost: 0.005,
                cached: false,
                request: { lat, lng, cache: reqCache },
                response: {
                    status: data.status,
                    resultsCount: data.results?.length || 0,
                    cityName,
                    resolvedFrom,
                    cacheWrite,
                }
            });
            return cityName;
        }

        // Log también cuando la llamada responde pero no aporta una ciudad (para que el viewer sea coherente)
        await logApiToSupabase({
            trip_id: tripId,
            api: 'google-geocoding',
            method: 'GET',
            url: geocodeUrl,
            status: data?.status,
            duration_ms: Math.round(geocodeDuration),
            cost: 0.005,
            cached: false,
            request: { lat, lng },
            response: { status: data?.status, resultsCount: data?.results?.length || 0 }
        });
    } catch (e) { console.error("Geocode error", e); }
    return `Parada Táctica (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}

// Post-procesamiento: Segmentar etapas > maxKmPerDay usando interpolación + reverse geocoding
async function postSegmentItinerary(itinerary: DailyPlan[], maxKmPerDay: number, apiKey: string, tripId?: string): Promise<DailyPlan[]> {
    // Tolerancia para evitar segmentar por diferencias mínimas (redondeos/variaciones de ruta).
    // Ej: con límite 300 km, una etapa de 301 km no debería forzar una parada táctica.
    const SEGMENTATION_DISTANCE_TOLERANCE_KM = 10;
    const segmented: DailyPlan[] = [];

    for (const day of itinerary) {
        const segmentThresholdKm = maxKmPerDay + SEGMENTATION_DISTANCE_TOLERANCE_KM;
        if (day.distance > segmentThresholdKm && day.isDriving) {
            // Esta etapa necesita dividirse
            const numSegments = Math.ceil(day.distance / maxKmPerDay);
            const kmPerSegment = day.distance / numSegments;

            console.log(`🔀 POST-segmentando: ${day.from} → ${day.to} (${Math.round(day.distance)} km) en ${numSegments} partes`);

            let currentDate = new Date(day.isoDate);
            let currentStartCoords = day.startCoordinates || { lat: 0, lng: 0 };
            let currentStartName = day.from;

            for (let i = 0; i < numSegments; i++) {
                const isLast = i === numSegments - 1;

                let segmentEndName = day.to;
                let segmentEndCoords = day.coordinates || { lat: 0, lng: 0 };

                // Para segmentos intermedios, buscar ciudad real en el punto interpolado
                if (!isLast && day.startCoordinates && day.coordinates) {
                    const ratio = (i + 1) / numSegments;

                    const intermediateCoords = {
                        lat: day.startCoordinates.lat + (day.coordinates.lat - day.startCoordinates.lat) * ratio,
                        lng: day.startCoordinates.lng + (day.coordinates.lng - day.startCoordinates.lng) * ratio
                    };

                    // Obtener nombre real de la ciudad en ese punto
                    await sleep(100);
                    const cityName = await getCityNameFromCoords(intermediateCoords.lat, intermediateCoords.lng, apiKey, { tripId });
                    segmentEndName = cityName;
                    segmentEndCoords = intermediateCoords;
                }

                const segmentDay: DailyPlan = {
                    ...day,
                    date: formatDate(currentDate),
                    isoDate: currentDate.toISOString(),
                    distance: isLast
                        ? day.distance - (kmPerSegment * i)
                        : kmPerSegment,
                    from: currentStartName,
                    to: segmentEndName,
                    type: isLast ? ('overnight' as const) : ('tactical' as const),
                    startCoordinates: currentStartCoords,
                    coordinates: segmentEndCoords,
                    day: segmented.length + 1
                };

                segmented.push(segmentDay);

                // Preparar para siguiente segmento
                currentDate = addDays(currentDate, 1);
                currentStartCoords = segmentEndCoords;
                currentStartName = segmentEndName;
            }
        } else {
            // Etapa normal, agregar sin cambios
            segmented.push({ ...day, day: segmented.length + 1 });
        }
    }

    return segmented;
}

export async function getDirectionsAndCost(data: DirectionsRequest): Promise<DirectionsResult> {

    const debugLog: string[] = [];

    // 🔍 Iniciar tracking de viaje
    const tripId = apiLogger.startTrip(data.origin, data.destination, data.waypoints, data.tripId);
    debugLog.push(`🆔 Trip ID: ${tripId}`);

    // Prefer a server-side API key for Google Maps. If a server key is not set,
    // fall back to the public key if available, but return a clear error when
    // neither exists.
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return { error: "Clave de API de Google Maps no configurada. Configure 'GOOGLE_MAPS_API_KEY_FIXED' (preferido) o 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'." };
    }

    // Normalizar nombres: mantener ciudad+país, remover acentos para Google API
    const normalizeForGoogle = (text: string) => {
        // Paso 1: Si hay coma, tomar ciudad y país (ej: "Salamanca, España")
        // Si no hay coma, usar todo (ej: "Salamanca")
        const parts = text.split(',');
        const location = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : text.trim();
        // Paso 2: Remover acentos/diacríticos
        return location
            .normalize('NFD')                   // Descomponer caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '');  // Remover diacríticos
    };

    // Normalizar origin, destination y waypoints
    const normalizedOrigin = normalizeForGoogle(data.origin);
    const normalizedDestination = normalizeForGoogle(data.destination);
    // Normalizar TODOS los waypoints (incluyendo paradas tácticas)
    // Google las trata como waypoints normales y genera rutas correctas
    const normalizedWaypoints = data.waypoints.map(w => normalizeForGoogle(w));

    const allStops = [data.origin, ...data.waypoints.filter(w => w), data.destination];
    const waypointsParam = normalizedWaypoints.length > 0 ? `&waypoints=${normalizedWaypoints.map(w => encodeURIComponent(w)).join('|')}` : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(normalizedOrigin)}&destination=${encodeURIComponent(normalizedDestination)}&mode=${data.travel_mode}${waypointsParam}&key=${apiKey}`;

    const directionsKey = makeDirectionsCacheKey({
        origin: normalizedOrigin,
        destination: normalizedDestination,
        waypoints: normalizedWaypoints,
        travelMode: data.travel_mode,
    });

    debugLog.push('🔗 Google Directions API Call:');
    debugLog.push(`  Origin: ${normalizedOrigin}`);
    debugLog.push(`  Destination: ${normalizedDestination}`);
    debugLog.push(`  Waypoints: ${JSON.stringify(normalizedWaypoints)}`);
    debugLog.push(`  URL (sin key): ${url.substring(0, url.lastIndexOf('&key='))}`);

    try {
        // 0) Supabase cache HIT (directions)
        const sbDir = await getDirectionsCache({ key: directionsKey.key });
        if (sbDir.ok && sbDir.hit && sbDir.payload) {
            const summary = (typeof sbDir.summary === 'object' && sbDir.summary !== null) ? (sbDir.summary as Record<string, unknown>) : {};

            await logApiToSupabase({
                trip_id: tripId,
                api: 'google-directions',
                method: 'GET',
                url: `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(normalizedOrigin)}&destination=${encodeURIComponent(normalizedDestination)}&mode=${data.travel_mode}${waypointsParam}`,
                status: 'CACHE_HIT_SUPABASE',
                duration_ms: 0,
                cost: 0,
                cached: true,
                request: {
                    tripName: data.tripName,
                    origin: data.origin,
                    destination: data.destination,
                    waypoints: data.waypoints,
                    cache: { provider: 'supabase', key: directionsKey.key },
                },
                response: {
                    status: 'CACHE_HIT_SUPABASE',
                    ...summary,
                    cache: { provider: 'supabase', key: directionsKey.key, expiresAt: sbDir.expiresAt },
                    cacheWrite: { provider: 'supabase', action: 'none' },
                },
            });

            type DirectionsApiLegStep = { distance: { value: number }; polyline: { points: string } };
            type DirectionsApiLeg = {
                start_location: { lat: number; lng: number };
                end_location: { lat: number; lng: number };
                steps: DirectionsApiLegStep[];
                distance: { value: number };
            };
            type DirectionsApiRoute = {
                legs: DirectionsApiLeg[];
                overview_polyline?: { points?: string };
            };
            type DirectionsApiResponse = {
                status: string;
                error_message?: string;
                routes: DirectionsApiRoute[];
            };

            const directionsResult = sbDir.payload as unknown as DirectionsApiResponse;
            debugLog.push('✅ Google API Response OK (desde caché Supabase)');
            debugLog.push(`💾 Directions cache HIT: ${directionsKey.key}`);

            if (directionsResult.status !== 'OK') {
                apiLogger.endTrip();
                return { error: `Google API Error (cached): ${directionsResult.error_message || directionsResult.status}`, debugLog };
            }

            const route = directionsResult.routes[0];

            let totalDistanceMeters = 0;
            route.legs.forEach((leg: { distance: { value: number } }) => { totalDistanceMeters += leg.distance.value; });
            const distanceKm = totalDistanceMeters / 1000;

            const allDrivingStops: {
                from: string, to: string, distance: number,
                startCoords: {lat: number, lng: number},
                endCoords: {lat: number, lng: number}
            }[] = [];

            const finalWaypointsForMap: string[] = [];
            const maxMeters = data.kmMaximoDia * 1000;

            let currentLegStartName = allStops[0];
            let currentLegStartCoords = { lat: route.legs[0].start_location.lat, lng: route.legs[0].start_location.lng };

            let dayAccumulatorMeters = 0;

            for (let i = 0; i < route.legs.length; i++) {
                const leg = route.legs[i];
                const nextStopName = allStops[i + 1];
                let legDistanceMeters = 0;

                for (const step of leg.steps) {
                    legDistanceMeters += step.distance.value;
                }

                if (dayAccumulatorMeters + legDistanceMeters > maxMeters && dayAccumulatorMeters > 0) {
                    for (const step of leg.steps) {
                        const stepDist = step.distance.value;

                        if (dayAccumulatorMeters + stepDist < maxMeters) {
                            dayAccumulatorMeters += stepDist;
                        } else {
                            let metersNeeded = maxMeters - dayAccumulatorMeters;
                            let metersLeftInStep = stepDist;
                            const path = decodePolyline(step.polyline.points);
                            let currentPathIndex = 0;

                            while (metersLeftInStep >= metersNeeded) {
                                let distWalked = 0;
                                let stopCoords = path[currentPathIndex];

                                for (let p = currentPathIndex; p < path.length - 1; p++) {
                                    const segment = getDistanceFromLatLonInM(path[p].lat, path[p].lng, path[p+1].lat, path[p+1].lng);
                                    if (distWalked + segment >= metersNeeded) {
                                        stopCoords = path[p+1];
                                        currentPathIndex = p + 1;
                                        metersLeftInStep -= metersNeeded;
                                        break;
                                    }
                                    distWalked += segment;
                                }

                                await sleep(200);
                                const stopName = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey, { tripId });

                                const realDistance = maxMeters / 1000;

                                allDrivingStops.push({
                                    from: currentLegStartName,
                                    to: stopName,
                                    distance: realDistance,
                                    startCoords: currentLegStartCoords,
                                    endCoords: stopCoords
                                });

                                currentLegStartCoords = stopCoords;
                                currentLegStartName = stopName;
                                dayAccumulatorMeters = 0;
                                metersNeeded = maxMeters;
                            }

                            dayAccumulatorMeters += metersLeftInStep;
                        }
                    }
                } else {
                    dayAccumulatorMeters += legDistanceMeters;
                }

                const legEndCoords = { lat: leg.end_location.lat, lng: leg.end_location.lng };

                allDrivingStops.push({
                    from: currentLegStartName,
                    to: nextStopName,
                    distance: dayAccumulatorMeters / 1000,
                    startCoords: currentLegStartCoords,
                    endCoords: legEndCoords
                });

                if (i < route.legs.length - 1) finalWaypointsForMap.push(nextStopName);

                currentLegStartName = nextStopName;
                currentLegStartCoords = legEndCoords;
                dayAccumulatorMeters = 0;
            }

            const dailyItinerary: DailyPlan[] = [];
            let currentDate = new Date(data.fechaInicio);
            let dayCounter = 1;

            for (const stop of allDrivingStops) {
                const dKm = Math.round(stop.distance);
                debugLog.push(`  📍 Etapa ${dayCounter}: ${stop.from} → ${stop.to} (${dKm} km)`);

                dailyItinerary.push({
                    date: formatDate(currentDate),
                    isoDate: currentDate.toISOString(),
                    day: dayCounter,
                    from: stop.from,
                    to: stop.to,
                    distance: stop.distance,
                    isDriving: true,
                    type: 'overnight',
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
                debugLog.push(`📅 Fecha regreso: ${data.fechaRegreso}, días de estancia: ${daysStay}`);

                if (daysStay > 0) {
                    const lastLeg = route.legs[route.legs.length - 1];
                    const stayCoords = { lat: lastLeg.end_location.lat, lng: lastLeg.end_location.lng };

                    let stayLocation = data.destination;
                    try {
                        stayLocation = await getCityNameFromCoords(stayCoords.lat, stayCoords.lng, apiKey, { tripId });
                    } catch {
                        // ignore
                    }

                    for (let s = 0; s < daysStay; s++) {
                        dailyItinerary.push({
                            date: formatDate(currentDate),
                            isoDate: currentDate.toISOString(),
                            day: dayCounter,
                            from: stayLocation,
                            to: stayLocation,
                            distance: 0,
                            isDriving: false,
                            type: 'overnight',
                            startCoordinates: stayCoords,
                            coordinates: stayCoords
                        });
                        currentDate = addDays(currentDate, 1);
                        dayCounter++;
                    }
                }
            }

            debugLog.push(`\n📊 Itinerario ANTES de post-segmentación: ${dailyItinerary.length} días`);
            const segmentedItinerary = await postSegmentItinerary(dailyItinerary, data.kmMaximoDia, apiKey, tripId);
            debugLog.push(`📊 Itinerario DESPUÉS de post-segmentación: ${segmentedItinerary.length} días`);
            segmentedItinerary.forEach((day) => {
                debugLog.push(`  Día ${day.day}: ${day.from} → ${day.to} (${Math.round(day.distance)} km)`);
            });

            const embedParams = {
                key: apiKey,
                origin: data.origin,
                destination: data.destination,
                waypoints: finalWaypointsForMap.join('|'),
                mode: data.travel_mode,
            };
            const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as Record<string, string>).toString()}`;

            apiLogger.endTrip();

            const overviewPolyline = route?.overview_polyline?.points;
            return { distanceKm, mapUrl, overviewPolyline, dailyItinerary: segmentedItinerary, debugLog };
        }

        // 🔍 Log de Directions API con timing
        const directionsStartTime = performance.now();
        const response = await fetch(url);
        const directionsResult = await response.json();
        const directionsEndTime = performance.now();
        const directionsDuration = directionsEndTime - directionsStartTime;

                // Registrar en API Logger
        apiLogger.logDirections(
          { origin: data.origin, destination: data.destination, waypoints: data.waypoints },
          directionsResult,
          directionsDuration
        );

        const routesCount = directionsResult.routes?.length || 0;
        const waypointsCount = data.waypoints.length;
        const usefulDirectionsResponse: Record<string, unknown> = { status: directionsResult.status, routesCount, waypointsCount };

        if (directionsResult.status === 'OK' && directionsResult.routes?.[0]?.legs?.length) {
            const route0 = directionsResult.routes[0];
            const legsCount = route0.legs.length;
            let totalDistanceMeters = 0;
            let totalDurationSeconds = 0;
            route0.legs.forEach((leg: { distance?: { value?: number }, duration?: { value?: number } }) => {
                totalDistanceMeters += Number(leg?.distance?.value || 0);
                totalDurationSeconds += Number(leg?.duration?.value || 0);
            });
            usefulDirectionsResponse.legsCount = legsCount;
            usefulDirectionsResponse.distanceKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;
            usefulDirectionsResponse.durationMin = Math.round((totalDurationSeconds / 60) * 10) / 10;
        } else if (directionsResult.error_message) {
            usefulDirectionsResponse.error_message = directionsResult.error_message;
        }

        // Supabase: intentar escribir en caché (solo si OK) y reflejar cacheWrite en el MISMO log
        let cacheWrite: Record<string, unknown> = { provider: 'supabase', action: 'upsert', table: 'api_cache_directions', key: directionsKey.key, ok: false, reason: 'skipped' };
        if (directionsResult.status === 'OK') {
            const up = await upsertDirectionsCache({
                key: directionsKey.key,
                origin: normalizedOrigin,
                destination: normalizedDestination,
                waypoints: normalizedWaypoints,
                travelMode: data.travel_mode,
                payload: directionsResult,
                summary: usefulDirectionsResponse,
                ttlDays: 30,
            });
            cacheWrite = up.ok
                ? { provider: 'supabase', action: 'upsert', table: 'api_cache_directions', key: directionsKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
                : { provider: 'supabase', action: 'upsert', table: 'api_cache_directions', key: directionsKey.key, ok: false, reason: up.reason };
        }

        // Registrar en Supabase (servidor)
        await logApiToSupabase({
            trip_id: tripId,
            api: 'google-directions',
            method: 'GET',
            url,
            status: directionsResult.status,
            duration_ms: Math.round(directionsDuration),
            cost: 0.005 + (0.005 * waypointsCount),
            cached: false,
            request: {
                tripName: data.tripName,
                origin: data.origin,
                destination: data.destination,
                waypoints: data.waypoints,
                cache: { provider: 'supabase', key: directionsKey.key, hit: false },
            },
            response: {
                ...usefulDirectionsResponse,
                cacheWrite,
            }
        });

        if (directionsResult.status !== 'OK') {
            debugLog.push(`❌ Google API Response: status=${directionsResult.status}, error=${directionsResult.error_message}`);
            apiLogger.endTrip();
            return { error: `Google API Error: ${directionsResult.error_message || directionsResult.status}`, debugLog };
        }

        debugLog.push('✅ Google API Response OK');
        debugLog.push(`⏱️ Directions API took ${directionsDuration.toFixed(0)}ms`);

        const route = directionsResult.routes[0];

        let totalDistanceMeters = 0;
        route.legs.forEach((leg: { distance: { value: number } }) => { totalDistanceMeters += leg.distance.value; });
        const distanceKm = totalDistanceMeters / 1000;

        // Estructura temporal para guardar paradas con sus coordenadas de inicio y fin
        const allDrivingStops: {
            from: string, to: string, distance: number,
            startCoords: {lat: number, lng: number}, // ✅ Start
            endCoords: {lat: number, lng: number}    // ✅ End (antes coordinates)
        }[] = [];

        const finalWaypointsForMap: string[] = [];
        const maxMeters = data.kmMaximoDia * 1000;

                let currentLegStartName = allStops[0];
                // 📍 Inicializamos coordenadas de inicio con el principio de la ruta
                let currentLegStartCoords = { lat: route.legs[0].start_location.lat, lng: route.legs[0].start_location.lng };

        let dayAccumulatorMeters = 0;

        for (let i = 0; i < route.legs.length; i++) {
            const leg = route.legs[i];
            const nextStopName = allStops[i + 1];
            let legDistanceMeters = 0;

            // Calcular la distancia total de este leg
            for (const step of leg.steps) {
                legDistanceMeters += step.distance.value;
            }

            // CAMBIO: Si llegar al waypoint excede el límite, crear paradas tácticas
            if (dayAccumulatorMeters + legDistanceMeters > maxMeters && dayAccumulatorMeters > 0) {
                // Necesitamos dividir esta leg en múltiples días
                for (const step of leg.steps) {
                    const stepDist = step.distance.value;

                    if (dayAccumulatorMeters + stepDist < maxMeters) {
                        dayAccumulatorMeters += stepDist;
                    } else {
                        let metersNeeded = maxMeters - dayAccumulatorMeters;
                        let metersLeftInStep = stepDist;
                        const path = decodePolyline(step.polyline.points);
                        let currentPathIndex = 0;

                        while (metersLeftInStep >= metersNeeded) {
                            let distWalked = 0;
                            let stopCoords = path[currentPathIndex];

                            for (let p = currentPathIndex; p < path.length - 1; p++) {
                                const segment = getDistanceFromLatLonInM(path[p].lat, path[p].lng, path[p+1].lat, path[p+1].lng);
                                if (distWalked + segment >= metersNeeded) {
                                    stopCoords = path[p+1];
                                    currentPathIndex = p + 1;
                                    metersLeftInStep -= metersNeeded;
                                    break;
                                }
                                distWalked += segment;
                            }

                        await sleep(200);
                        const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey, { tripId });
                        // Usar directamente el nombre de la ciudad (sin prefijo)
                        const stopName = stopNameRaw;

                        // Distancia del segmento: siempre es maxMeters porque cortamos exactamente al límite
                        const realDistance = maxMeters / 1000;

                        allDrivingStops.push({
                            from: currentLegStartName,
                            to: stopName,
                            distance: realDistance,
                            startCoords: currentLegStartCoords,
                            endCoords: stopCoords
                        });                            finalWaypointsForMap.push(`${stopCoords.lat},${stopCoords.lng}`);

                            currentLegStartName = stopNameRaw;
                            currentLegStartCoords = stopCoords;
                            dayAccumulatorMeters = 0;
                            metersNeeded = maxMeters;
                        }
                        dayAccumulatorMeters += metersLeftInStep;
                    }
                }
            } else {
                // NUEVO: El waypoint cabe en el día actual, añadimos toda la distancia
                dayAccumulatorMeters += legDistanceMeters;
            }

            // FORZAR: Cada waypoint es fin de etapa obligatorio
            const legEndCoords = { lat: leg.end_location.lat, lng: leg.end_location.lng };

            allDrivingStops.push({
                from: currentLegStartName,
                to: nextStopName,
                distance: dayAccumulatorMeters / 1000,
                startCoords: currentLegStartCoords,
                endCoords: legEndCoords
            });

            if (i < route.legs.length - 1) finalWaypointsForMap.push(nextStopName);

            // Preparar para el siguiente waypoint
            currentLegStartName = nextStopName;
            currentLegStartCoords = legEndCoords;
            dayAccumulatorMeters = 0;
        }

        // --- CONSTRUCCIÓN DEL ITINERARIO ---
        const dailyItinerary: DailyPlan[] = [];
        let currentDate = new Date(data.fechaInicio);
        let dayCounter = 1;

        for (const stop of allDrivingStops) {
             // Usar nombre directamente de allStops (ya es correcto)
             // Las coordenadas se usan solo para el mapa
             const distanceKm = Math.round(stop.distance);
             debugLog.push(`  📍 Etapa ${dayCounter}: ${stop.from} → ${stop.to} (${distanceKm} km)`);

             dailyItinerary.push({
                date: formatDate(currentDate),
                isoDate: currentDate.toISOString(),
                day: dayCounter,
                from: stop.from,
                to: stop.to,
                distance: stop.distance,
                isDriving: true,
                type: 'overnight',
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
            debugLog.push(`📅 Fecha regreso: ${data.fechaRegreso}, días de estancia: ${daysStay}`);

            if (daysStay > 0) {
                const lastLeg = route.legs[route.legs.length - 1];
                const stayCoords = { lat: lastLeg.end_location.lat, lng: lastLeg.end_location.lng };

                // Reverse geocodificar destino
                let stayLocation = data.destination;
                try {
                    stayLocation = await getCityNameFromCoords(stayCoords.lat, stayCoords.lng, apiKey, { tripId });
                } catch {
                    // usar destino original
                }

                for (let i = 0; i < daysStay; i++) {
                     dailyItinerary.push({
                        date: formatDate(currentDate),
                        isoDate: currentDate.toISOString(),
                        day: dayCounter,
                        from: stayLocation,
                        to: stayLocation,
                        distance: 0,
                        isDriving: false,
                        type: 'overnight',
                        startCoordinates: stayCoords,
                        coordinates: stayCoords
                    });
                    currentDate = addDays(currentDate, 1);
                    dayCounter++;
                }
            }
        }

        // DEBUG: Verificar que dailyItinerary tiene nombres, no coordenadas
        dailyItinerary.forEach((day) => {
            debugLog.push(`  Día ${day.day}: ${day.from} → ${day.to}`);
        });

        // POST-PROCESAMIENTO: Segmentar etapas > 300km/día
        debugLog.push(`\n📊 Itinerario ANTES de post-segmentación: ${dailyItinerary.length} días`);
        const segmentedItinerary = await postSegmentItinerary(dailyItinerary, data.kmMaximoDia, apiKey, tripId);
        debugLog.push(`📊 Itinerario DESPUÉS de post-segmentación: ${segmentedItinerary.length} días`);
        segmentedItinerary.forEach((day) => {
            debugLog.push(`  Día ${day.day}: ${day.from} → ${day.to} (${Math.round(day.distance)} km)`);
        });

        const embedParams = {
            key: apiKey,
            origin: data.origin,
            destination: data.destination,
            waypoints: finalWaypointsForMap.join('|'),
            mode: data.travel_mode,
        };
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as Record<string, string>).toString()}`;

        // 🔍 Finalizar tracking
        apiLogger.endTrip();
        debugLog.push(`\n🔍 API Logger Report:`);
        debugLog.push(`   Session guardada en localStorage con key: 'api-logger-session-v1'`);
        debugLog.push(`   Ejecuta en consola: apiLogger.printReport()`);

        const overviewPolyline = route?.overview_polyline?.points;

        return { distanceKm, mapUrl, overviewPolyline, dailyItinerary: segmentedItinerary, debugLog };

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugLog.push(`⚠️ Exception: ${msg}`);
        apiLogger.endTrip();
        return { error: msg || "Error al calcular la ruta.", debugLog };
    }
}
