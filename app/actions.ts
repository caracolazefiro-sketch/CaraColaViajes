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
function decodePolyline(encoded: string) {
    const poly = [];
    let index = 0, len = encoded.length;
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
            const locality = comp.find((c: any) => c.types.includes('locality'))?.long_name;
            const admin2 = comp.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name; 
            return locality || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        }
    } catch (e) { console.error("Geocode error", e); }
    return `Parada Táctica (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
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

    try {
        const response = await fetch(url);
        const directionsResult = await response.json();

        if (directionsResult.status !== 'OK') {
            return { error: `Google API Error: ${directionsResult.error_message || directionsResult.status}` };
        }
        
        const route = directionsResult.routes[0];
        
        let totalDistanceMeters = 0;
        route.legs.forEach((leg: any) => { totalDistanceMeters += leg.distance.value; });
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
                            startCoords: currentLegStartCoords, // ✅ Guardamos inicio
                            endCoords: stopCoords               // ✅ Guardamos fin
                        });
                        
                        finalWaypointsForMap.push(`${stopCoords.lat},${stopCoords.lng}`);

                        // Preparamos siguiente día
                        currentLegStartName = stopNameRaw; 
                        currentLegStartCoords = stopCoords; // ✅ El fin de hoy es el inicio de mañana
                        dayAccumulatorMeters = 0;
                        metersNeeded = maxMeters; 
                    }
                    dayAccumulatorMeters += metersLeftInStep;
                }
            }

            if (dayAccumulatorMeters > 0 || currentLegStartName !== nextStopName) {
                const legEndCoords = { lat: leg.end_location.lat, lng: leg.end_location.lng };
                
                allDrivingStops.push({
                    from: currentLegStartName,
                    to: nextStopName,
                    distance: dayAccumulatorMeters / 1000,
                    startCoords: currentLegStartCoords, // ✅
                    endCoords: legEndCoords             // ✅
                });

                if (i < route.legs.length - 1) finalWaypointsForMap.push(nextStopName);

                currentLegStartName = nextStopName;
                currentLegStartCoords = legEndCoords; // ✅
                dayAccumulatorMeters = 0; 
            }
        }

        // --- CONSTRUCCIÓN DEL ITINERARIO ---
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
                startCoordinates: stop.startCoords, // ✅ Pasamos datos al frontend
                coordinates: stop.endCoords         // ✅
            });
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
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams(embedParams as any).toString()}`;
        
        return { distanceKm, mapUrl, dailyItinerary };

    } catch (e: any) {
        return { error: e.message || "Error al calcular la ruta." };
    }
}