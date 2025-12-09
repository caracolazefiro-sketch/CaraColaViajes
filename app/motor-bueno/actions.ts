'use server';

// ⚠️🚨 RED FLAG - CRITICAL FILE - VERSIÓN ESTABLE V1 - DO NOT MODIFY 🚨⚠️
// ✅ ESTA VERSIÓN FUNCIONA PERFECTAMENTE - NO TOCAR SIN BACKUP
// Este archivo contiene el algoritmo de segmentación del MOTOR (SERVIDOR).
// La función getDirectionsAndCost es la ÚNICA que debe llamar a Google Directions API.
// El algoritmo de segmentación usa decodePolyline y getDistanceFromLatLonInM para
// calcular puntos de parada cada ~300km sobre el polyline exacto de Google.
// IMPORTANTE: Este algoritmo está DUPLICADO en el cliente (MotorComparisonMaps.tsx)
// porque el servidor y el cliente pueden recibir polylines ligeramente diferentes
// de Google. El cliente es la fuente de verdad para los marcadores en el mapa.
// ⚠️🚨 NO SINCRONIZAR - SON ALGORITMOS SEPARADOS INTENCIONALMENTE 🚨⚠️
// Fecha estable: 06/12/2025

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

async function getCityNameFromCoords(lat: number, lng: number, apiKey: string, attempt = 1): Promise<string> {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_2&key=${apiKey}&language=es`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            await sleep(1000 * attempt);
            return getCityNameFromCoords(lat, lng, apiKey, attempt + 1);
        }

        if (data.status === 'OK' && data.results?.[0]) {
            const comp = data.results[0].address_components;
            const locality = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('locality'))?.long_name;
            const admin2 = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('administrative_area_level_2'))?.long_name;
            return locality || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        }
    } catch (e) { console.error("Geocode error", e); }
    return `Parada Táctica (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}

async function postSegmentItinerary(itinerary: DailyPlan[], maxKmPerDay: number, apiKey: string): Promise<DailyPlan[]> {
    const segmented: DailyPlan[] = [];

    for (const day of itinerary) {
        if (day.distance > maxKmPerDay && day.isDriving) {
            const numSegments = Math.ceil(day.distance / maxKmPerDay);
            const kmPerSegment = day.distance / numSegments;

            let currentDate = new Date(day.date);
            let currentStartCoords = day.startCoordinates || { lat: 0, lng: 0 };
            let currentStartName = day.from;

            for (let i = 0; i < numSegments; i++) {
                const isLast = i === numSegments - 1;

                let segmentEndName = day.to;
                let segmentEndCoords = day.coordinates || { lat: 0, lng: 0 };

                if (!isLast && day.startCoordinates && day.coordinates) {
                    const ratio = (i + 1) / numSegments;

                    const intermediateCoords = {
                        lat: day.startCoordinates.lat + (day.coordinates.lat - day.startCoordinates.lat) * ratio,
                        lng: day.startCoordinates.lng + (day.coordinates.lng - day.startCoordinates.lng) * ratio
                    };

                    await sleep(100);
                    const cityName = await getCityNameFromCoords(intermediateCoords.lat, intermediateCoords.lng, apiKey);
                    segmentEndName = cityName;
                    segmentEndCoords = intermediateCoords;
                }

                const segmentDay: DailyPlan = {
                    date: formatDate(currentDate),
                    distance: isLast ? day.distance - (kmPerSegment * i) : kmPerSegment,
                    from: currentStartName,
                    to: segmentEndName,
                    startCoordinates: currentStartCoords,
                    coordinates: segmentEndCoords,
                    day: segmented.length + 1,
                    isDriving: day.isDriving
                };

                segmented.push(segmentDay);

                currentDate = addDays(currentDate, 1);
                currentStartCoords = segmentEndCoords;
                currentStartName = segmentEndName;
            }
        } else {
            segmented.push({ ...day, day: segmented.length + 1 });
        }
    }

    return segmented;
}

export async function getDirectionsAndCost(data: GetDirectionsAndCostParams): Promise<GetDirectionsAndCostResult> {
    const debugLog: string[] = [];

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
    const waypointsParam = normalizedWaypoints.length > 0 ? `&waypoints=${normalizedWaypoints.map(w => encodeURIComponent(w)).join('|')}` : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(normalizedOrigin)}&destination=${encodeURIComponent(normalizedDestination)}&mode=${data.travel_mode}${waypointsParam}&key=${apiKey}`;

    debugLog.push('🔗 MOTOR: Google Directions API Call');

    try {
        const response = await fetch(url);
        const directionsResult = await response.json();

        if (directionsResult.status !== 'OK') {
            debugLog.push(`❌ Google API Response: ${directionsResult.status}`);
            return { error: `Google API Error: ${directionsResult.error_message || directionsResult.status}`, debugLog, googleRawResponse: directionsResult };
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
                const stayCoords = { lat: lastLeg.end_location.lat, lng: lastLeg.end_location.lng };

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

        const segmentedItinerary = await postSegmentItinerary(dailyItinerary, data.kmMaximoDia, apiKey);

        const embedParams = {
            key: apiKey,
            origin: data.origin,
            destination: data.destination,
            waypoints: finalWaypointsForMap.join('|'),
            mode: data.travel_mode,
        };
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as Record<string, string>).toString()}`;

        return { distanceKm, mapUrl, dailyItinerary: segmentedItinerary, debugLog, googleRawResponse: directionsResult };

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugLog.push(`⚠️ Exception: ${msg}`);
        return { error: msg || "Error al calcular la ruta.", debugLog };
    }
}
