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
}

interface DirectionsResult {
    distanceKm?: number;
    mapUrl?: string;
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

// Segmentar itinerario por límite de km/día, buscando localidades reales
// NOTA: La segmentación se realiza durante la construcción de allDrivingStops en getDirectionsAndCost
// usando los polylines exactos de Google, no después con interpolación lineal


export async function getDirectionsAndCost(data: DirectionsRequest): Promise<DirectionsResult> {
    
    const debugLog: string[] = [];
    
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

    debugLog.push('🔗 Google Directions API Call:');
    debugLog.push(`  Origin: ${normalizedOrigin}`);
    debugLog.push(`  Destination: ${normalizedDestination}`);
    debugLog.push(`  Waypoints: ${JSON.stringify(normalizedWaypoints)}`);
    debugLog.push(`  URL (sin key): ${url.substring(0, url.lastIndexOf('&key='))}`);

    try {
        const response = await fetch(url);
        const directionsResult = await response.json();

        if (directionsResult.status !== 'OK') {
            debugLog.push(`❌ Google API Response: status=${directionsResult.status}, error=${directionsResult.error_message}`);
            return { error: `Google API Error: ${directionsResult.error_message || directionsResult.status}`, debugLog };
        }
        
        debugLog.push('✅ Google API Response OK');
        
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
                            const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey);
                            // Usar directamente el nombre de la ciudad (sin prefijo)
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
                    stayLocation = await getCityNameFromCoords(stayCoords.lat, stayCoords.lng, apiKey);
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
        dailyItinerary.forEach((day, idx) => {
            debugLog.push(`  Día ${day.day}: ${day.from} → ${day.to}`);
        });
        
        // NOTA: La segmentación ya ocurrió durante la construcción de allDrivingStops
        // usando polylines exactos de Google, no después con interpolación
        debugLog.push(`\n📊 Itinerario final (con segmentación de 300km/día): ${dailyItinerary.length} días`);
        dailyItinerary.forEach((day, idx) => {
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
        
        return { distanceKm, mapUrl, dailyItinerary, debugLog };

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugLog.push(`⚠️ Exception: ${msg}`);
        return { error: msg || "Error al calcular la ruta.", debugLog };
    }
}