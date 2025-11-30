import { useState } from 'react';
import { TripResult, DailyPlan, Coordinates } from '../types';

// Definimos la interfaz del formulario aquí para tener tipado fuerte
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

// Interfaz para la función de conversión (viene del hook de idioma)
interface Converter {
    (value: number, unit: 'km' | 'liter' | 'currency' | 'kph'): number;
}


// Helpers de fechas (privados del hook)
const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateISO = (d: Date) => d.toISOString().split('T')[0];
const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

// Helper de limpieza de nombres (privado)
const getCleanCityName = async (lat: number, lng: number): Promise<string> => {
    if (typeof google === 'undefined') return "Punto en Ruta";
    const geocoder = new google.maps.Geocoder();
    try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
            const comps = response.results[0].address_components;
            return comps.find(c => c.types.includes("locality"))?.long_name || 
                   comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name || 
                   "Punto en Ruta";
        }
    } catch (e) { }
    return "Punto en Ruta";
};

// AHORA RECIBE LA FUNCIÓN 'convert'
export function useTripCalculator(convert: Converter) {
    const [results, setResults] = useState<TripResult>({
        totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null
    });
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [loading, setLoading] = useState(false);

    // --- LÓGICA PRINCIPAL: CALCULAR RUTA ---
    const calculateRoute = async (formData: TripFormData) => {
        if (typeof google === 'undefined') return;
        setLoading(true);
        setDirectionsResponse(null);
        setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null });

        const directionsService = new google.maps.DirectionsService();
        
        let destination = formData.destino;
        // Parsear paradas con el separador '|'
        const waypoints = formData.etapas.split('|').map(s => s.trim()).filter(s => s.length > 0).map(location => ({ location, stopover: true }));
        const outboundLegsCount = waypoints.length + 1;

        if (formData.vueltaACasa) {
            destination = formData.origen;
            waypoints.push({ location: formData.destino, stopover: true });
        }

        try {
            const result = await directionsService.route({
                origin: formData.origen,
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
            
            // CONVERSIÓN CRÍTICA: KM MÁXIMO debe convertirse a Metros
            // La función convert ya nos da el valor en la unidad correcta (Km o Millas). Al multiplicar por 1000, 
            // estamos convirtiendo el límite máximo diario del usuario a metros.
            const maxMeters = convert(formData.kmMaximoDia, 'km') * 1000;

            // Nombre inicial limpio
            const startLoc = route.legs[0].start_location;
            let currentLegStartName = await getCleanCityName(startLoc.lat(), startLoc.lng());
            let totalDistMeters = 0;

            for (let i = 0; i < route.legs.length; i++) {
                const leg = route.legs[i];
                let legPoints: google.maps.LatLng[] = [];
                leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });
                let legAccumulator = 0;
                let segmentStartName = currentLegStartName;

                // Paradas Tácticas
                for (let j = 0; j < legPoints.length - 1; j++) {
                    const point1 = legPoints[j];
                    const point2 = legPoints[j+1];
                    const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

                    if (legAccumulator + segmentDist > maxMeters) {
                        const lat = point1.lat(); const lng = point2.lng();
                        const locationString = await getCleanCityName(lat, lng);
                        const stopTitle = `📍 Parada Táctica: ${locationString}`;
                        
                        itinerary.push({ 
                            day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                            from: segmentStartName, to: stopTitle, distance: (legAccumulator + segmentDist) / 1000, 
                            isDriving: true, coordinates: { lat, lng }, type: 'tactical', savedPlaces: [] 
                        });
                        dayCounter++; currentDate = addDay(currentDate); 
                        legAccumulator = 0; segmentStartName = locationString;
                    } else { legAccumulator += segmentDist; }
                }

                let endLegName = await getCleanCityName(leg.end_location.lat(), leg.end_location.lng());

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

                // Algoritmo del Pivote (Vuelta a Casa)
                if (formData.vueltaACasa && i === outboundLegsCount - 1) {
                    let returnDistanceMeters = 0;
                    for(let k = i + 1; k < route.legs.length; k++) { returnDistanceMeters += route.legs[k].distance?.value || 0; }
                    const daysDrivingBack = Math.ceil(returnDistanceMeters / maxMeters); // Usa maxMeters
                    
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
                const finalCity = await getCleanCityName(finalLeg.end_location.lat(), finalLeg.end_location.lng());
                const finalCoords = { lat: finalLeg.end_location.lat(), lng: finalLeg.end_location.lng() };

                for(let i=0; i < stayDays; i++) {
                    dayCounter++; currentDate = addDay(currentDate);
                    itinerary.push({ 
                        day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                        from: finalCity, to: finalCity, distance: 0, 
                        isDriving: false, type: 'end', 
                        coordinates: finalCoords, 
                        savedPlaces: [] 
                    });
                }
            }

            // CÁLCULO FINAL: Conversion de KM/Liters a la unidad del usuario
            const distanceKmMetric = totalDistMeters / 1000;
            const distanceInUserUnit = convert(distanceKmMetric, 'km');
            
            // Consumo en unidad Liters/100km
            const fuelConsumptionPer100Km = formData.consumo; 
            // Coste en unidad Euro
            const fuelPricePerUnit = formData.precioGasoil; 
            
            // Calculamos los litros (KM totales / 100) * Litros/100km
            const litersMetric = (distanceKmMetric / 100) * fuelConsumptionPer100Km;

            // Coste TOTAL en EUROS
            const totalCostEuros = litersMetric * fuelPricePerUnit;
            
            // Convertimos LitersMetric a la unidad del usuario (Galones)
            const litersInUserUnit = convert(litersMetric, 'liter');
            
            // Convertimos el Coste a la unidad del usuario (Dólares o Euros)
            const costInUserUnit = convert(totalCostEuros, 'currency');


            setResults({ 
                totalDays: dayCounter, 
                distanceKm: distanceInUserUnit, // Ya está en user unit (mi/km)
                totalCost: costInUserUnit,     // Ya está en user unit ($/€)
                liters: litersInUserUnit,      // Ya está en user unit (gal/liters)
                dailyItinerary: itinerary, 
                error: null 
            });

        } catch (error: any) {
            console.error(error);
            setResults(prev => ({...prev, error: "Error al calcular. Revisa las ciudades."}));
        } finally {
            setLoading(false);
        }
    };

    // --- RECALCULAR FECHAS (Privado) ---
    const recalculateDates = (itinerary: DailyPlan[], startDate: string) => {
        let currentDate = new Date(startDate);
        return itinerary.map((day, index) => {
            const updatedDay = { 
                ...day, 
                day: index + 1, 
                date: formatDate(currentDate), 
                isoDate: formatDateISO(currentDate) 
            };
            currentDate = addDay(currentDate);
            return updatedDay;
        });
    };

    // --- GESTIÓN DE DÍAS (ACORDEÓN) ---
    const addDayToItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        const currentItinerary = [...results.dailyItinerary];
        const previousDay = currentItinerary[index];
        const newDay: DailyPlan = { 
            day: 0, date: '', isoDate: '', 
            from: previousDay.to, to: previousDay.to, distance: 0, isDriving: false, 
            type: 'overnight', 
            coordinates: previousDay.coordinates, 
            savedPlaces: [] 
        };
        currentItinerary.splice(index + 1, 0, newDay);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    const removeDayFromItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        if (results.dailyItinerary[index].isDriving) {
            alert("⚠️ No puedes borrar una etapa de conducción aquí.\n\nPara eliminar una parada de ruta, usa el formulario de arriba (los chips) y recalcula.");
            return;
        }
        const currentItinerary = [...results.dailyItinerary];
        currentItinerary.splice(index, 1);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    return {
        results,
        setResults,
        directionsResponse,
        setDirectionsResponse,
        loading,
        calculateRoute,
        addDayToItinerary,
        removeDayFromItinerary
    };
}