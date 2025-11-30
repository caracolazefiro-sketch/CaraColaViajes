'use server';

// Definiciones de interfaces
interface DailyPlan {
  date: string;
  day: number;
  from: string;
  to: string;
  distance: number;
  isDriving: boolean;
  warning?: string;
  coordinates?: { lat: number; lng: number }; // Añadimos coordenadas para el mapa
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

// Algoritmo de decodificación de Polyline (Google Algorithm)
// Convierte el string raro "_p~iF~ps|U_ulLnnqC_mqNvxq`@" en array de coordenadas
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

// Función para calcular distancia entre dos puntos (Haversine simplificado)
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Radio tierra metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper para obtener nombre de ciudad desde coordenadas (Server Side Geocoding)
async function getCityNameFromCoords(lat: number, lng: number, apiKey: string): Promise<string> {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_2&key=${apiKey}&language=es`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results?.[0]) {
            // Buscamos la localidad o el municipio
            const comp = data.results[0].address_components;
            const locality = comp.find((c: any) => c.types.includes('locality'))?.long_name;
            const admin2 = comp.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name; // Provincia
            return locality || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        }
    } catch (e) {
        console.error("Error geocoding:", e);
    }
    return `Parada Táctica (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}


// 🛑 FUNCIÓN PRINCIPAL
export async function getDirectionsAndCost(data: DirectionsRequest): Promise<DirectionsResult> {
    
    // NOTA: Asegúrate de tener esta variable en tu .env.local (Server Side)
    // Debe ser una API Key SIN restricción HTTP (puede tener restricción de IP)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return { error: "Clave de API no configurada." };
    }

    // 1. CONSTRUIR URL
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
        
        // --- CÁLCULO DE DISTANCIA TOTAL ---
        let totalDistanceMeters = 0;
        route.legs.forEach((leg: any) => { totalDistanceMeters += leg.distance.value; });
        const distanceKm = totalDistanceMeters / 1000;
        
        // --- EL CORTADOR DE SALAMI (Slicing Algorithm V2) ---
        
        const allDrivingStops: { from: string, to: string, distance: number, coordinates?: {lat: number, lng: number} }[] = [];
        const finalWaypointsForMap: string[] = []; 
        
        const maxMeters = data.kmMaximoDia * 1000;
        
        // Variables de estado del cursor de viaje
        let currentLegStartName = allStops[0]; 
        let dayAccumulatorMeters = 0;

        for (let i = 0; i < route.legs.length; i++) {
            const leg = route.legs[i];
            const nextStopName = allStops[i + 1]; // El destino de este leg (Waypoint o Destino Final)

            // Iteramos pasos (Instrucciones de navegación)
            for (const step of leg.steps) {
                const stepDist = step.distance.value;

                // CASO A: El paso cabe entero en el día actual
                if (dayAccumulatorMeters + stepDist < maxMeters) {
                    dayAccumulatorMeters += stepDist;
                } 
                // CASO B: El paso DESBORDA el límite -> HAY QUE CORTAR
                else {
                    // ¿Cuántos metros nos faltan para llenar el día?
                    let metersNeeded = maxMeters - dayAccumulatorMeters;
                    let metersLeftInStep = stepDist;
                    
                    // Decodificamos la geometría del paso para buscar el punto exacto
                    const path = decodePolyline(step.polyline.points);
                    let currentPathIndex = 0;

                    // Bucle para manejar si un paso es GIGANTE y requiere múltiples paradas (ej: 800km en un límite de 400km)
                    while (metersLeftInStep >= metersNeeded) {
                        
                        // Avanzar por los puntos del polyline hasta cubrir 'metersNeeded'
                        let distWalked = 0;
                        let stopCoords = path[currentPathIndex]; // Fallback

                        for (let p = currentPathIndex; p < path.length - 1; p++) {
                            const segment = getDistanceFromLatLonInM(path[p].lat, path[p].lng, path[p+1].lat, path[p+1].lng);
                            if (distWalked + segment >= metersNeeded) {
                                stopCoords = path[p+1];
                                currentPathIndex = p + 1;
                                // Ajuste fino: restamos lo que hemos avanzado al total del step
                                metersLeftInStep -= metersNeeded;
                                break;
                            }
                            distWalked += segment;
                        }

                        // ¡TENEMOS UN CORTE! -> stopCoords
                        // Obtenemos nombre real del pueblo
                        const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey);
                        const stopName = `📍 Parada Táctica: ${stopNameRaw}`;

                        // Guardamos la etapa del día
                        allDrivingStops.push({
                            from: currentLegStartName,
                            to: stopName,
                            distance: data.kmMaximoDia, // Es aprox el máximo
                            coordinates: stopCoords
                        });
                        
                        // Añadimos al mapa para forzar que pinte la ruta hasta aquí
                        finalWaypointsForMap.push(`${stopCoords.lat},${stopCoords.lng}`);

                        // RESETEAMOS para el siguiente día
                        currentLegStartName = stopNameRaw; // El siguiente día sale de aquí
                        dayAccumulatorMeters = 0;
                        metersNeeded = maxMeters; // El siguiente día vuelve a tener el cupo entero
                    }

                    // Lo que sobre del paso (si ya no llega a otro límite) se suma al acumulador del nuevo día
                    dayAccumulatorMeters += metersLeftInStep;
                }
            }

            // AL FIN DEL LEG (Waypoint de usuario)
            // Si hemos acumulado distancia o si forzosamente hay que parar en el waypoint
            // NOTA: Si el usuario pone un Waypoint, asumimos que quiere parar ahí, así que cerramos etapa.
            if (dayAccumulatorMeters > 0 || currentLegStartName !== nextStopName) {
                
                // Si el acumulador es muy pequeño (ej: < 30km), quizás es que acabamos de hacer una parada táctica cerca.
                // Pero por lógica de "Waypoint de Usuario", respetamos la parada.
                
                allDrivingStops.push({
                    from: currentLegStartName,
                    to: nextStopName,
                    distance: dayAccumulatorMeters / 1000,
                    coordinates: leg.end_location // Coordenada exacta del waypoint
                });

                // Si no es el destino final, añadimos al mapa
                if (i < route.legs.length - 1) {
                    finalWaypointsForMap.push(nextStopName);
                }

                currentLegStartName = nextStopName;
                dayAccumulatorMeters = 0; // Reseteamos contador al llegar a un waypoint oficial
            }
        }

        // --- CONSTRUCCIÓN DEL ITINERARIO ---
        
        const dailyItinerary: DailyPlan[] = [];
        let currentDate = new Date(data.fechaInicio);
        let dayCounter = 1;
        
        // 1. Etapas de Conducción
        for (const stop of allDrivingStops) {
             dailyItinerary.push({
                date: formatDate(currentDate),
                day: dayCounter,
                from: stop.from,
                to: stop.to,
                distance: stop.distance,
                isDriving: true,
                coordinates: stop.coordinates // Pasamos coords para clima/servicios
            });
            
            currentDate = addDays(currentDate, 1);
            dayCounter++;
        }
        
        // 2. Días de Estancia (Destino Final)
        if (data.fechaRegreso) {
            const dateEnd = new Date(data.fechaRegreso);
            // Calculamos diferencia real en días
            const diffTime = dateEnd.getTime() - currentDate.getTime();
            const daysStay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (daysStay > 0) {
                const stayLocation = data.destination;
                // Usamos la coordenada del último leg
                const lastLeg = route.legs[route.legs.length - 1];
                const stayCoords = lastLeg.end_location;

                for (let i = 0; i < daysStay; i++) {
                     dailyItinerary.push({
                        date: formatDate(currentDate),
                        day: dayCounter,
                        from: stayLocation,
                        to: stayLocation,
                        distance: 0,
                        isDriving: false,
                        coordinates: stayCoords
                    });
                    currentDate = addDays(currentDate, 1);
                    dayCounter++;
                }
            }
        }
        
        // --- MAPA ---
        const embedParams = {
            key: apiKey,
            origin: data.origin,
            destination: data.destination,
            waypoints: finalWaypointsForMap.join('|'), 
            mode: data.travel_mode,
        };
        const embedQueryString = Object.keys(embedParams)
            .filter(key => embedParams[key as keyof typeof embedParams])
            .map(key => `${key}=${encodeURIComponent(embedParams[key as keyof typeof embedParams]!)}`)
            .join('&');
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?${embedQueryString}`; 
        
        return { distanceKm, mapUrl, dailyItinerary };

    } catch (e: any) {
        console.error("Server Action Error:", e);
        return { error: e.message || "Error al calcular la ruta." };
    }
}