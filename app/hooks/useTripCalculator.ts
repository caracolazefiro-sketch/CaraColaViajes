import { useState } from 'react';
import { TripResult, DailyPlan } from '../types';
import { normalizeForGoogle } from '../utils/googleNormalize';

export interface TripFormData {
    fechaInicio: string;
    origen: string;
    fechaRegreso: string;
    destino: string;
    etapas: string;
    consumo: number;
    precioGasoil: number;
    kmMaximoDia: number;
    evitarPeajes: boolean;
    vueltaACasa: boolean;
}

interface Converter {
    (value: number, unit: 'km' | 'liter' | 'currency' | 'kph'): number;
}

// Helpers de fechas
const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateISO = (d: Date) => d.toISOString().split('T')[0];
const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };
// Helper de espera (Pausa técnica)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER GEOCODING ROBUSTO (Con Reintentos) ---
const getCleanCityName = async (lat: number, lng: number, attempt = 1): Promise<string> => {
    if (typeof google === 'undefined') return "Punto en Ruta";
    const geocoder = new google.maps.Geocoder();
    
    try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
            const comps = response.results[0].address_components;
            
            // Búsqueda en cascada (Vital para zonas sin "locality" definida)
            return comps.find(c => c.types.includes("locality"))?.long_name || 
                   comps.find(c => c.types.includes("sublocality"))?.long_name ||
                   comps.find(c => c.types.includes("administrative_area_level_3"))?.long_name ||
                   comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name || 
                   comps.find(c => c.types.includes("administrative_area_level_1"))?.long_name || // Región
                   "Punto en Ruta";
        }
    } catch (e: unknown) {
        // 🛡️ ESTRATEGIA ANTI-BLOQUEO: Si Google dice "OVER_QUERY_LIMIT", esperamos y reintentamos.
        const err = e as { code?: string };
        if (err.code === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            console.warn(`Rate limit hit. Retrying city name... (Attempt ${attempt})`);
            await sleep(1000 * attempt); // Espera progresiva: 1s, 2s, 3s
            return getCleanCityName(lat, lng, attempt + 1);
        }
    }
    return "Punto en Ruta";
};

export function useTripCalculator(convert: Converter, units: 'metric' | 'imperial') {
    const [results, setResults] = useState<TripResult>({
        totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null
    });
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [loading, setLoading] = useState(false);

    const calculateRoute = async (formData: TripFormData) => {
        if (typeof google === 'undefined') return;
        setLoading(true);
        setDirectionsResponse(null);
        setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });

        const directionsService = new google.maps.DirectionsService();
        
        let destination = normalizeForGoogle(formData.destino);
        const waypoints = formData.etapas
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(location => ({ location: normalizeForGoogle(location), stopover: true }));
        const outboundLegsCount = waypoints.length + 1;

        if (formData.vueltaACasa) {
            destination = normalizeForGoogle(formData.origen);
            waypoints.push({ location: normalizeForGoogle(formData.destino), stopover: true });
        }

        try {
            const result = await directionsService.route({
                origin: normalizeForGoogle(formData.origen),
                destination: destination,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                avoidTolls: formData.evitarPeajes,
            });

            setDirectionsResponse(result);
            const route = result.routes[0];
            const itinerary: DailyPlan[] = [];
            
            let dayCounter = 1;
            let currentDate = new Date(formData.fechaInicio);
            
            // Conversión de unidades (Millas vs Km)
            const maxMeters = units === 'imperial' 
                ? formData.kmMaximoDia * 1609.34 
                : formData.kmMaximoDia * 1000;

            // Tolerancia dinámica (~10% con cap 50km) para evitar cortes por exceso mínimo.
            // En imperial, maxMeters está en metros igualmente, así que el cálculo sigue siendo coherente.
            const toleranceMeters = (() => {
                const kmEquivalent = maxMeters / 1000;
                const tolKm = Math.min(50, Math.max(10, Math.round(kmEquivalent * 0.1)));
                return tolKm * 1000;
            })();
            const splitThresholdMeters = maxMeters + toleranceMeters;

            console.log('🧭 Segmentación (cliente):', {
                maxMeters: Math.round(maxMeters),
                toleranceMeters: Math.round(toleranceMeters),
                splitThresholdMeters: Math.round(splitThresholdMeters),
            });

            const startLoc = route.legs[0].start_location;
            let currentLegStartName = await getCleanCityName(startLoc.lat(), startLoc.lng());
            let totalDistMeters = 0;

            for (let i = 0; i < route.legs.length; i++) {
                const leg = route.legs[i];
                let legPoints: google.maps.LatLng[] = [];
                leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });

                // Distancia total de este leg en metros (para poder decidir si aplicamos tolerancia al final)
                let legTotalMeters = 0;
                for (let j = 0; j < legPoints.length - 1; j++) {
                    legTotalMeters += google.maps.geometry.spherical.computeDistanceBetween(legPoints[j], legPoints[j + 1]);
                }
                let progressedMeters = 0;
                
                let legAccumulator = 0;
                let segmentStartName = currentLegStartName;
                let createdTacticalInLeg = false;

                // Algoritmo Slicing V2 (Interpolación)
                for (let j = 0; j < legPoints.length - 1; j++) {
                    const point1 = legPoints[j];
                    const point2 = legPoints[j+1];
                    const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

                    const remainingAfterThisSegment = Math.max(0, legTotalMeters - (progressedMeters + segmentDist));

                    if (legAccumulator + segmentDist > maxMeters) {
                        // Si estamos MUY cerca del final del leg y cerrar el leg hoy entra en max+tol,
                        // no creamos una parada táctica (evita colas ridículas tipo 5km y mejora estabilidad).
                        if (legAccumulator + segmentDist + remainingAfterThisSegment <= splitThresholdMeters) {
                            legAccumulator += segmentDist;
                            progressedMeters += segmentDist;
                            continue;
                        }

                        const lat = point2.lat(); 
                        const lng = point2.lng();
                        
                        // ⏱️ PEQUEÑA PAUSA PREVENTIVA (200ms) para no saturar al geocodificador en bucles rápidos
                        await sleep(200); 
                        const locationString = await getCleanCityName(lat, lng);
                        const stopTitle = `📍 Parada Táctica: ${locationString}`;
                        
                        itinerary.push({ 
                            day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                            from: segmentStartName, to: stopTitle, 
                            distance: maxMeters / 1000, 
                            isDriving: true, coordinates: { lat, lng }, type: 'tactical', savedPlaces: [] 
                        });

                        createdTacticalInLeg = true;
                        
                        dayCounter++; currentDate = addDay(currentDate); 
                        legAccumulator = 0; 
                        segmentStartName = locationString;

                        // Hemos consumido hasta point2 para el progreso.
                        progressedMeters += segmentDist;
                    } else {
                        legAccumulator += segmentDist;
                        progressedMeters += segmentDist;
                    }
                }

                // Cierre del Leg
                await sleep(200); // Pausa también aquí
                const endLegName = await getCleanCityName(leg.end_location.lat(), leg.end_location.lng());

                // Si el leg ha creado tácticas y la cola final es pequeña, la fusionamos en el último tramo
                // para evitar días absurdos como “Zürich → Zürich (5 km)”.
                if (createdTacticalInLeg && legAccumulator > 0 && legAccumulator <= toleranceMeters && segmentStartName === endLegName) {
                    const lastIdx = itinerary.length - 1;
                    if (lastIdx >= 0 && itinerary[lastIdx].isDriving) {
                        const isFinalDest = i === route.legs.length - 1;
                        itinerary[lastIdx] = {
                            ...itinerary[lastIdx],
                            to: endLegName,
                            distance: (itinerary[lastIdx].distance || 0) + (legAccumulator / 1000),
                            coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
                            type: isFinalDest ? 'end' : 'overnight',
                        };
                        console.log('🧩 Merge tail (cliente):', { endLegName, tailKm: Math.round((legAccumulator / 1000) * 10) / 10 });

                        // Este leg ya quedó cerrado en el último tramo. Avanzamos a la siguiente leg sin crear un día extra.
                        if (i < route.legs.length - 1) {
                            currentLegStartName = endLegName;
                        }
                        totalDistMeters += leg.distance?.value || 0;

                        // Lógica de Vuelta a Casa (sin cambios)
                        if (formData.vueltaACasa && i === outboundLegsCount - 1) {
                            let returnDistanceMeters = 0;
                            for(let k = i + 1; k < route.legs.length; k++) { returnDistanceMeters += route.legs[k].distance?.value || 0; }
                            const daysDrivingBack = Math.ceil(returnDistanceMeters / maxMeters);
                            
                            if (formData.fechaRegreso) {
                                const dateBackHome = new Date(formData.fechaRegreso);
                                const departureDate = new Date(dateBackHome);
                                departureDate.setDate(departureDate.getDate() - daysDrivingBack + 1);
                                
                                const stayDays = Math.floor((departureDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                                if (stayDays > 0) {
                                    const stayCity = endLegName;
                                    const stayCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };

                                    for(let d=0; d < stayDays; d++) {
                                        itinerary.push({ 
                                            day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                                            from: stayCity, to: stayCity, distance: 0, 
                                            isDriving: false, type: 'overnight', 
                                            coordinates: stayCoords, 
                                            savedPlaces: [] 
                                        });
                                        dayCounter++; currentDate = addDay(currentDate);
                                    }
                                }
                            }
                        }

                        continue;
                    }
                }

                if (legAccumulator > 0 || segmentStartName !== endLegName) {
                    const isFinalDest = i === route.legs.length - 1;
                    itinerary.push({ 
                        day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                        from: segmentStartName, to: endLegName, distance: legAccumulator / 1000, 
                        isDriving: true, coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() }, 
                        type: isFinalDest ? 'end' : 'overnight', savedPlaces: [] 
                    });
                    
                    if (i < route.legs.length - 1) { dayCounter++; currentDate = addDay(currentDate); }
                    currentLegStartName = endLegName;
                }
                totalDistMeters += leg.distance?.value || 0;

                // Lógica de Vuelta a Casa
                if (formData.vueltaACasa && i === outboundLegsCount - 1) {
                    let returnDistanceMeters = 0;
                    for(let k = i + 1; k < route.legs.length; k++) { returnDistanceMeters += route.legs[k].distance?.value || 0; }
                    const daysDrivingBack = Math.ceil(returnDistanceMeters / maxMeters);
                    
                    if (formData.fechaRegreso) {
                        const dateBackHome = new Date(formData.fechaRegreso);
                        const departureDate = new Date(dateBackHome);
                        departureDate.setDate(departureDate.getDate() - daysDrivingBack + 1);
                        
                        const stayDays = Math.floor((departureDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (stayDays > 0) {
                            const stayCity = endLegName;
                            const stayCoords = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };

                            for(let d=0; d < stayDays; d++) {
                                itinerary.push({ 
                                    day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                                    from: stayCity, to: stayCity, distance: 0, 
                                    isDriving: false, type: 'overnight', 
                                    coordinates: stayCoords, 
                                    savedPlaces: [] 
                                });
                                dayCounter++; currentDate = addDay(currentDate);
                            }
                        }
                    }
                }
            }

            // Estancia en destino final (Solo Ida)
            if (formData.fechaRegreso && !formData.vueltaACasa) {
                const diffTime = new Date(formData.fechaRegreso).getTime() - currentDate.getTime();
                const stayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const finalLeg = route.legs[route.legs.length - 1];
                const finalCoords = { lat: finalLeg.end_location.lat(), lng: finalLeg.end_location.lng() };
                
                // Usamos el nombre del destino original del formulario si es posible, queda más limpio
                // Pero validamos con coordenadas por si acaso
                const finalCity = formData.destino.split(',')[0] || await getCleanCityName(finalCoords.lat, finalCoords.lng);

                for(let k=0; k < stayDays; k++) {
                    dayCounter++; currentDate = addDay(currentDate);
                    itinerary.push({ 
                        day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                        from: finalCity, to: finalCity, distance: 0, 
                        isDriving: false, type: 'end', coordinates: finalCoords, savedPlaces: [] 
                    });
                }
            }

            // Resultados Finales
            const distanceKmMetric = totalDistMeters / 1000;
            const distanceUserUnit = convert(distanceKmMetric, 'km'); 
            const litersUserUnit = (distanceUserUnit / 100) * formData.consumo; 
            const costUserUnit = litersUserUnit * formData.precioGasoil; 

            setResults({ 
                totalDays: dayCounter, 
                distanceKm: distanceUserUnit, 
                totalCost: costUserUnit,     
                liters: litersUserUnit,      
                dailyItinerary: itinerary, 
                error: null 
            });

        } catch (error: unknown) {
            console.error(error);
            setResults(prev => ({...prev, error: "Error al calcular. Revisa las ciudades."}));
        } finally {
            setLoading(false);
        }
    };

    const recalculateDates = (itinerary: DailyPlan[], startDate: string) => {
        let currentDate = new Date(startDate);
        return itinerary.map((day, index) => {
            const updatedDay = { ...day, day: index + 1, date: formatDate(currentDate), isoDate: formatDateISO(currentDate) };
            currentDate = addDay(currentDate);
            return updatedDay;
        });
    };

    const addDayToItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        const currentItinerary = [...results.dailyItinerary];
        const previousDay = currentItinerary[index];
        const newDay: DailyPlan = { 
            day: 0, date: '', isoDate: '', 
            from: previousDay.to, to: previousDay.to, distance: 0, isDriving: false, 
            type: 'overnight', coordinates: previousDay.coordinates, savedPlaces: [] 
        };
        currentItinerary.splice(index + 1, 0, newDay);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    const removeDayFromItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        if (results.dailyItinerary[index].isDriving) {
            alert("⚠️ No puedes borrar una etapa de conducción aquí.");
            return;
        }
        const currentItinerary = [...results.dailyItinerary];
        currentItinerary.splice(index, 1);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    return {
        results, setResults, directionsResponse, setDirectionsResponse, 
        loading, calculateRoute, addDayToItinerary, removeDayFromItinerary
    };
}