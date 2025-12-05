 'use server';

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
}

interface DirectionsRequest {
    origin: string;
    destination: string;
    waypoints: string[];
    travel_mode: 'driving';
    kmMaximoDia: number;
    fechaInicio: string;
    fechaRegreso: string;
}

interface DirectionsResult {
    distanceKm?: number;
    mapUrl?: string;
    error?: string;
    dailyItinerary?: DailyPlan[];
    debugLogs?: string[]; // ✅ Incluir logs del servidor para debugging
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

async function getCityNameFromCoords(lat: number, lng: number, apiKey: string, attempt = 1): Promise<string> {
    try {
        // Primero: Reverse Geocoding normal
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.status === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            await sleep(1000 * attempt);
            return getCityNameFromCoords(lat, lng, apiKey, attempt + 1);
        }

        // Si tenemos resultado del geocoding, verificar si es ciudad importante
        if (geoData.status === 'OK' && geoData.results?.[0]) {
            const comp = geoData.results[0].address_components;
            const locality = comp.find((c: { types: string[] }) => c.types.includes('locality'))?.long_name;
            const admin2 = comp.find((c: { types: string[] }) => c.types.includes('administrative_area_level_2'))?.long_name;
            const adminArea = comp.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))?.long_name;

            const cityName = locality || admin2 || adminArea;

            // Si encontramos una ciudad potencial, verificar que sea ciudad importante (no pueblo)
            if (cityName && cityName.length > 0) {
                // Usar Places Nearby para verificar que hay establecimientos (hoteles, restaurantes)
                try {
                    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=lodging&key=${apiKey}`;
                    const placesRes = await fetch(placesUrl);
                    const placesData = await placesRes.json();

                    // Si hay hoteles/alojamientos, es ciudad importante
                    if (placesData.results && placesData.results.length > 0) {
                        return `${cityName}`;
                    }
                } catch (e) {
                    console.log("Places API fallback", e);
                }

                // Si no hay hoteles pero tenemos nombre de geocoding, usarlo igual
                return cityName;
            }
        }

        // Fallback: Solo coordenadas
        return `Parada (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    } catch (e) {
        console.error("Geocode error", e);
        return `Parada (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    }
}


export async function getDirectionsAndCost(data: DirectionsRequest): Promise<DirectionsResult> {

    // Prefer a server-side API key for Google Maps. If a server key is not set,
    // fall back to the public key if available, but return a clear error when
    // neither exists.
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return { error: "Clave de API de Google Maps no configurada. Configure 'GOOGLE_MAPS_API_KEY_FIXED' (preferido) o 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'." };
    }

    if (!process.env.GOOGLE_MAPS_API_KEY_FIXED) {
        // Server-side log to warn maintainers that a client key is being used as fallback.
        // In production, set a server-only key in 'GOOGLE_MAPS_API_KEY_FIXED'.
        console.warn("Usando clave pública de Google Maps como fallback. Configure 'GOOGLE_MAPS_API_KEY_FIXED' en entorno de servidor para producción.");
    }

    const allStops = [data.origin, ...data.waypoints.filter(w => w), data.destination];
    const waypointsParam = data.waypoints.length > 0 ? `&waypoints=${data.waypoints.map(w => encodeURIComponent(w)).join('|')}` : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(data.origin)}&destination=${encodeURIComponent(data.destination)}&mode=${data.travel_mode}${waypointsParam}&key=${apiKey}`;

    // 🐛 Debug logs array para enviar al cliente
    const debugLogs: string[] = [];
    const addDebugLog = (msg: string, data?: any) => {
        const log = `[actions.ts] ${msg}${data ? ' ' + JSON.stringify(data) : ''}`;
        debugLogs.push(log);
        console.log(log);
    };

    try {
        const response = await fetch(url);
        const directionsResult = await response.json();

        if (directionsResult.status !== 'OK') {
            return { error: `Google API Error: ${directionsResult.error_message || directionsResult.status}`, debugLogs };
        }

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
        let currentLegStartCoords: {lat: number, lng: number} | undefined;

        // Obtener coords del primer leg, con fallbacks
        const firstLegStart = route.legs?.[0]?.start_location;

        // Intentar 3 formas diferentes de obtener coordenadas
        if (firstLegStart) {
            // Forma 1: propiedades numéricas directas (JSON)
            if (typeof firstLegStart.lat === 'number' && typeof firstLegStart.lng === 'number') {
                currentLegStartCoords = { lat: firstLegStart.lat, lng: firstLegStart.lng };
                addDebugLog('✅ firstLegStart (forma 1 - propiedades directas):', currentLegStartCoords);
            }
            // Forma 2: propiedades que son funciones de Google Maps (en server, no debería ocurrir pero por si acaso)
            else if (typeof firstLegStart.lat === 'function' && typeof firstLegStart.lng === 'function') {
                try {
                    currentLegStartCoords = { lat: firstLegStart.lat(), lng: firstLegStart.lng() };
                    addDebugLog('✅ firstLegStart (forma 2 - funciones):', currentLegStartCoords);
                } catch (e) {
                    addDebugLog('❌ Error llamando funciones lat/lng:', e);
                }
            }
            // Forma 3: propiedades anidadas (por si Google devuelve algo inesperado)
            else if (firstLegStart.lat?.lat !== undefined && firstLegStart.lng?.lng !== undefined) {
                currentLegStartCoords = { lat: firstLegStart.lat.lat, lng: firstLegStart.lng.lng };
                addDebugLog('✅ firstLegStart (forma 3 - anidadas):', currentLegStartCoords);
            }
        }

        // Si no obtuvimos coordenadas del leg, hacer geocoding del origen
        if (!currentLegStartCoords) {
            addDebugLog('⚠️ firstLegStart NO VÁLIDO, geocodificando origen:', data.origin);
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.origin)}&key=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results?.[0]?.geometry?.location) {
                addDebugLog('❌ GEOCODIFICACIÓN FALLIDA para origen:', data.origin);
                return { error: `No se pudo geocodificar el origen: ${data.origin}`, debugLogs };
            }

            const loc = geoData.results[0].geometry.location;
            currentLegStartCoords = { lat: loc.lat, lng: loc.lng };
            addDebugLog('✅ Geocodificado origen:', currentLegStartCoords);
        }
        
        // 🔴 CRÍTICO: Si aún así currentLegStartCoords es undefined, usar fallback de seguridad
        if (!currentLegStartCoords) {
            console.error('[actions.ts] 🚨 CRÍTICO: currentLegStartCoords SIGUE SIENDO UNDEFINED tras todos los intentos. Usando fallback {0,0}');
            currentLegStartCoords = { lat: 0, lng: 0 };
        }
        
        addDebugLog('🎯 currentLegStartCoords FINAL (listo para usar):', currentLegStartCoords);
        console.log('[actions.ts] ✅ currentLegStartCoords GARANTIZADO:', currentLegStartCoords);

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
                            const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey);
                            const stopName = `📍 Parada Táctica: ${stopNameRaw}`;

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
                // NUEVO: El waypoint cabe en el día actual, añadimos toda la distancia
                dayAccumulatorMeters += legDistanceMeters;
            }

            // FORZAR: Cada waypoint es fin de etapa obligatorio
            const legEndCoords = { lat: leg.end_location.lat, lng: leg.end_location.lng };

            console.log('[actions.ts] Pushing parada (línea 237):', { from: currentLegStartName, to: nextStopName, startCoords: currentLegStartCoords, endCoords: legEndCoords });

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
        
        console.log('[actions.ts] ⚠️ DEBUGGING allDrivingStops:');
        console.log('[actions.ts] allDrivingStops COUNT:', allDrivingStops.length);
        allDrivingStops.forEach((stop, idx) => {
            console.log(`[actions.ts] Stop ${idx}:`, {
                from: stop.from,
                to: stop.to,
                distance: stop.distance,
                startCoords: stop.startCoords,
                endCoords: stop.endCoords,
                hasStartCoords: !!stop.startCoords,
                hasEndCoords: !!stop.endCoords
            });
        });
        addDebugLog('allDrivingStops COMPLETO:', allDrivingStops);        for (const stop of allDrivingStops) {
             const startCoords = stop.startCoords ? { lat: stop.startCoords.lat, lng: stop.startCoords.lng } : { lat: 0, lng: 0 };
             const endCoords = stop.endCoords ? { lat: stop.endCoords.lat, lng: stop.endCoords.lng } : { lat: 0, lng: 0 };

             const dailyPlan = {
                date: formatDate(currentDate),
                day: dayCounter,
                from: stop.from,
                to: stop.to,
                distance: stop.distance,
                isDriving: true,
                startCoordinates: startCoords, // ✅ GARANTIZADO que es {lat, lng}
                coordinates: endCoords         // ✅ GARANTIZADO que es {lat, lng}
            };
            
            // 🔍 DEBUG EXHAUSTIVO para verificar stop.startCoords
            console.log(`[actions.ts] ====== DÍA ${dayCounter} ======`);
            console.log(`[actions.ts] From: "${stop.from}" → To: "${stop.to}"`);
            console.log(`[actions.ts] stop.startCoords (RAW):`, stop.startCoords);
            console.log(`[actions.ts] stop.endCoords (RAW):`, stop.endCoords);
            console.log(`[actions.ts] startCoordinates (ASIGNADO):`, startCoords);
            console.log(`[actions.ts] coordinates (ASIGNADO):`, endCoords);
            console.log(`[actions.ts] ========================================`);
            
            addDebugLog(`Día ${dayCounter}: startCoords (raw)=${JSON.stringify(stop.startCoords)} | startCoordinates (asignado)=${JSON.stringify(startCoords)}`);
            dailyItinerary.push(dailyPlan);
            currentDate = addDays(currentDate, 1);
            dayCounter++;
        }

        if (data.fechaRegreso) {
            const dateEnd = new Date(data.fechaRegreso);
            const diffTime = dateEnd.getTime() - currentDate.getTime();
            const daysStay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysStay > 0) {
                const stayLocation = data.destination;
                const lastLeg = route.legs[route.legs.length - 1];
                const stayCoords = { lat: lastLeg.end_location.lat, lng: lastLeg.end_location.lng };

                for (let i = 0; i < daysStay; i++) {
                     dailyItinerary.push({
                        date: formatDate(currentDate),
                        day: dayCounter,
                        from: stayLocation,
                        to: stayLocation,
                        distance: 0,
                        isDriving: false,
                        startCoordinates: stayCoords, // En estancia, inicio = fin
                        coordinates: stayCoords
                    });
                    currentDate = addDays(currentDate, 1);
                    dayCounter++;
                }
            }
        }

        const embedParams = {
            key: apiKey,
            origin: data.origin,
            destination: data.destination,
            waypoints: finalWaypointsForMap.join('|'),
            mode: data.travel_mode,
        };
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as Record<string, string>).toString()}`;

        return { distanceKm, mapUrl, dailyItinerary, debugLogs };

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { error: msg || "Error al calcular la ruta.", debugLogs };
    }
}
