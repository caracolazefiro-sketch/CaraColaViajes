'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Coordinates, DailyPlan, PlaceWithDistance, ServiceType, TripResult } from './types';
import { supabase } from './supabase';

// IMPORTAMOS NUESTROS COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import TripMap from './components/TripMap';
import TripStats from './components/TripStats';        // <--- NUEVO
import StageSelector from './components/StageSelector'; // <--- NUEVO
import ItineraryPanel from './components/ItineraryPanel'; // <--- NUEVO

// --- CONFIGURACIÓN ---
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]; 

const printStyles = `
  @media print {
    body { background: white; color: black; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-break { page-break-inside: avoid; }
    .shadow-lg, .shadow-sm, .border { box-shadow: none !important; border: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-adjust: exact !important; }
  }
`;

export default function Home() {
  const [mounted, setMounted] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
    language: 'es' 
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [auditMode, setAuditMode] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
      camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: []
  });
  const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
      camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false
  });
  const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
      camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true
  });

  const [formData, setFormData] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    origen: 'Salamanca',
    fechaRegreso: '',
    destino: 'Punta Umbria',
    etapas: 'Valencia',
    consumo: 10.0,
    precioGasoil: 1.60,
    kmMaximoDia: 400,
    evitarPeajes: false,
    vueltaACasa: false,
  });

  const [results, setResults] = useState<TripResult>({
    totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null
  });

  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);

  // PERSISTENCIA
  useEffect(() => {
      setMounted(true);
      if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem('caracola_trip_v1');
          if (savedData) {
              try {
                  const parsed = JSON.parse(savedData);
                  if (parsed.formData) setFormData(parsed.formData);
                  if (parsed.results) setResults(parsed.results);
                  if (parsed.tripId) setCurrentTripId(parsed.tripId);
              } catch (e) { console.error(e); }
          }
      }
      setIsInitialized(true);
  }, []);

  useEffect(() => {
      if (mounted && isInitialized && typeof window !== 'undefined') {
          const dataToSave = { formData, results, tripId: currentTripId };
          localStorage.setItem('caracola_trip_v1', JSON.stringify(dataToSave));
      }
  }, [formData, results, currentTripId, mounted, isInitialized]);

  // HELPERS FECHAS
  const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatDateISO = (d: Date) => d.toISOString().split('T')[0]; 
  const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

  // RECALCULAR ACORDEÓN
  const recalculateDates = (itinerary: DailyPlan[]) => {
      let currentDate = new Date(formData.fechaInicio);
      const updatedItinerary = itinerary.map((day, index) => {
          const updatedDay = { ...day, day: index + 1, date: formatDate(currentDate), isoDate: formatDateISO(currentDate) };
          currentDate = addDay(currentDate);
          return updatedDay;
      });
      return updatedItinerary;
  };

  const handleAddDay = (index: number) => {
      if (!results.dailyItinerary) return;
      const currentItinerary = [...results.dailyItinerary];
      const previousDay = currentItinerary[index];
      const newDay: DailyPlan = { day: 0, date: '', isoDate: '', from: previousDay.to, to: previousDay.to, distance: 0, isDriving: false, type: 'overnight', coordinates: previousDay.coordinates, savedPlaces: [] };
      currentItinerary.splice(index + 1, 0, newDay);
      const finalItinerary = recalculateDates(currentItinerary);
      setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
  };

  const handleRemoveDay = (index: number) => {
      if (!results.dailyItinerary) return;
      if (results.dailyItinerary[index].isDriving) { alert("⚠️ No puedes borrar una etapa de conducción aquí.\n\nPara eliminar una parada de ruta, usa el formulario de arriba (los chips) y recalcula."); return; }
      const currentItinerary = [...results.dailyItinerary];
      currentItinerary.splice(index, 1);
      const finalItinerary = recalculateDates(currentItinerary);
      setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
  };

  const handleResetTrip = () => { if (confirm("¿Borrar viaje y empezar de cero?")) { localStorage.removeItem('caracola_trip_v1'); window.location.reload(); } };
  const handleLoadCloudTrip = (tripData: any, tripId: number) => { if (tripData) { setFormData(tripData.formData); setResults(tripData.results); setCurrentTripId(tripId); setSelectedDayIndex(null); setMapBounds(null); setForceUpdate(prev => prev + 1); alert(`✅ Viaje cargado. (ID: ${tripId})`); } };
  const handleShareTrip = async () => { if (!currentTripId) return alert("Guarda el viaje primero."); const { error } = await supabase.from('trips').update({ is_public: true }).eq('id', currentTripId); if (error) return alert("Error: " + error.message); const shareUrl = `${window.location.origin}/share/${currentTripId}`; try { await navigator.clipboard.writeText(shareUrl); alert(`🔗 Enlace copiado:\n\n${shareUrl}`); } catch (err) { prompt("Copia este enlace:", shareUrl); } };
  const handleSaveToCloud = async () => { if (!results.dailyItinerary) return; const { data: { session } } = await supabase.auth.getSession(); if (!session) return alert("Inicia sesión para guardar."); setIsSaving(true); const tripName = `${formData.origen} a ${formData.destino} (${formData.fechaInicio})`; const tripPayload = { formData, results }; try { if (currentTripId) { const overwrite = confirm(`¿Sobrescribir viaje existente (ID: ${currentTripId})?\nCancelar = Guardar copia nueva`); if (overwrite) { const { error } = await supabase.from('trips').update({ name: tripName, trip_data: tripPayload, updated_at: new Date().toISOString() }).eq('id', currentTripId); if (error) throw error; alert("✅ Actualizado correctamente."); } else { const { data, error } = await supabase.from('trips').insert([{ name: tripName + " (Copia)", trip_data: tripPayload, user_id: session.user.id }]).select(); if (error) throw error; if (data && data[0]) setCurrentTripId(data[0].id); alert("✅ Copia guardada."); } } else { const { data, error } = await supabase.from('trips').insert([{ name: tripName, trip_data: tripPayload, user_id: session.user.id }]).select(); if (error) throw error; if (data && data[0]) setCurrentTripId(data[0].id); alert("✅ Viaje nuevo guardado."); } } catch (error: any) { alert("❌ Error: " + error.message); } finally { setIsSaving(false); } };
  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => { if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null; const geocoder = new google.maps.Geocoder(); try { const response = await geocoder.geocode({ address: cityName }); if (response.results.length > 0) return response.results[0].geometry.location.toJSON(); } catch (e) { } return null; };

  // --- CÁLCULO DE RUTA ---
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setDirectionsResponse(null); 
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null }); 
    setSelectedDayIndex(null); 
    setCurrentTripId(null); 
    setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
    setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });

    const directionsService = new google.maps.DirectionsService();
    
    let origin = formData.origen;
    let destination = formData.destino;
    
    let waypoints = formData.etapas.split('|').map(s => s.trim()).filter(s => s.length > 0).map(location => ({ location, stopover: true }));

    const outboundLegsCount = waypoints.length + 1;

    if (formData.vueltaACasa) {
        destination = formData.origen;
        waypoints.push({ location: formData.destino, stopover: true });
    }

    try {
      const result = await directionsService.route({
        origin: origin, destination: destination, waypoints: waypoints, travelMode: google.maps.TravelMode.DRIVING, avoidTolls: formData.evitarPeajes,
      });

      setDirectionsResponse(result);
      const route = result.routes[0];
      const itinerary: DailyPlan[] = [];
      let dayCounter = 1;
      let currentDate = new Date(formData.fechaInicio);
      const maxMeters = formData.kmMaximoDia * 1000;
      
      const getCleanCityName = async (lat: number, lng: number): Promise<string> => {
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
              const comps = response.results[0].address_components;
              const city = comps.find(c => c.types.includes("locality"))?.long_name || comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "Punto en Ruta";
              return city;
            }
          } catch (e) { }
          return "Punto en Ruta";
      };

      let currentLegStartName = "Origen";
      const startLoc = route.legs[0].start_location;
      currentLegStartName = await getCleanCityName(startLoc.lat(), startLoc.lng());
      let totalDistMeters = 0; 

      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        let legPoints: google.maps.LatLng[] = [];
        leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });
        let legAccumulator = 0;
        let segmentStartName = currentLegStartName;

        for (let j = 0; j < legPoints.length - 1; j++) {
            const point1 = legPoints[j];
            const point2 = legPoints[j+1];
            const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

            if (legAccumulator + segmentDist > maxMeters) {
                const lat = point1.lat(); const lng = point2.lng(); 
                const locationString = await getCleanCityName(lat, lng);
                const stopTitle = `📍 Parada Táctica: ${locationString}`;
                itinerary.push({ day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate), from: segmentStartName, to: stopTitle, distance: (legAccumulator + segmentDist) / 1000, isDriving: true, coordinates: { lat, lng }, type: 'tactical', savedPlaces: [] });
                dayCounter++; currentDate = addDay(currentDate); legAccumulator = 0; segmentStartName = locationString;
            } else { legAccumulator += segmentDist; }
        }

        let endLegName = await getCleanCityName(leg.end_location.lat(), leg.end_location.lng());
        
        if (legAccumulator > 0 || segmentStartName !== endLegName) {
            const isFinalDest = i === route.legs.length - 1;
            itinerary.push({ day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate), from: segmentStartName, to: endLegName, distance: legAccumulator / 1000, isDriving: true, coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() }, type: isFinalDest ? 'end' : 'overnight', savedPlaces: [] });
            if (i < route.legs.length - 1) { dayCounter++; currentDate = addDay(currentDate); }
            currentLegStartName = endLegName;
        }
        totalDistMeters += leg.distance?.value || 0;

        if (formData.vueltaACasa && i === outboundLegsCount - 1) {
            let returnDistanceMeters = 0;
            for(let k = i + 1; k < route.legs.length; k++) { returnDistanceMeters += route.legs[k].distance?.value || 0; }
            const daysDrivingBack = Math.ceil(returnDistanceMeters / (formData.kmMaximoDia * 1000));
            
            if (formData.fechaRegreso) {
                const dateBackHome = new Date(formData.fechaRegreso);
                const departureDate = new Date(dateBackHome);
                departureDate.setDate(departureDate.getDate() - daysDrivingBack + 1); 
                const stayDays = Math.floor((departureDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                if (stayDays > 0) {
                    const stayCity = endLegName; 
                    for(let d=0; d < stayDays; d++) {
                        itinerary.push({ day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate), from: stayCity, to: stayCity, distance: 0, isDriving: false, type: 'overnight', savedPlaces: [] });
                        dayCounter++; currentDate = addDay(currentDate);
                    }
                }
            }
        }
      }

      if (formData.fechaRegreso && !formData.vueltaACasa) {
          const diffTime = new Date(formData.fechaRegreso).getTime() - currentDate.getTime();
          const stayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const finalLeg = route.legs[route.legs.length - 1];
          const finalCity = await getCleanCityName(finalLeg.end_location.lat(), finalLeg.end_location.lng());
          for(let i=0; i < stayDays; i++) {
               dayCounter++; currentDate = addDay(currentDate);
               itinerary.push({ day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate), from: finalCity, to: finalCity, distance: 0, isDriving: false, type: 'end', savedPlaces: [] });
          }
      }
      const liters = (totalDistMeters / 1000 / 100) * formData.consumo;
      setResults({ totalDays: dayCounter, distanceKm: totalDistMeters / 1000, totalCost: liters * formData.precioGasoil, dailyItinerary: itinerary, error: null });
    } catch (error: any) { console.error(error); setResults(prev => ({...prev, error: "Error al calcular. Revisa las ciudades."})); } finally { setLoading(false); }
  };

  // --- MAPA (Usando el Componente Nuevo) ---
  useEffect(() => {
      if (map) {
          if (mapBounds) { setTimeout(() => map.fitBounds(mapBounds), 500); } 
          else if (directionsResponse && selectedDayIndex === null) { const routeBounds = directionsResponse.routes[0].bounds; setTimeout(() => map.fitBounds(routeBounds), 500); }
      }
  }, [map, mapBounds, directionsResponse, selectedDayIndex, forceUpdate]);

  const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
      if (!map || typeof google === 'undefined') return;
      const service = new google.maps.places.PlacesService(map);
      const centerPoint = new google.maps.LatLng(location.lat, location.lng);
      let keywords = ''; let radius = 10000; 
      if (type === 'custom') return; 
      switch(type) {
          case 'camping': keywords = 'camping OR "area autocaravanas" OR "rv park" OR "parking caravanas"'; radius = 20000; break;
          case 'restaurant': keywords = 'restaurante OR comida OR bar'; radius = 5000; break;
          case 'water': keywords = '"punto limpio autocaravanas" OR "rv dump station" OR "area servicio autocaravanas"'; radius = 15000; break;
          case 'gas': keywords = 'gasolinera OR "estacion servicio"'; radius = 10000; break;
          case 'supermarket': keywords = 'supermercado OR "tienda alimentacion"'; radius = 5000; break;
          case 'laundry': keywords = 'lavanderia OR "laundry"'; radius = 10000; break;
          case 'tourism': keywords = 'turismo OR monumento OR museo OR "punto interes"'; radius = 10000; break;
      }
      setLoadingPlaces(prev => ({...prev, [type]: true}));
      service.nearbySearch({ location: centerPoint, radius, keyword: keywords }, (res, status) => {
          setLoadingPlaces(prev => ({...prev, [type]: false}));
          if (status === google.maps.places.PlacesServiceStatus.OK && res) {
              let spots = res.map(spot => {
                  let dist = 999999;
                  if (spot.geometry?.location) { dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location); }
                  const photoUrl = spot.photos && spot.photos.length > 0 ? spot.photos[0].getUrl({ maxWidth: 200 }) : undefined;
                  return { name: spot.name, rating: spot.rating, vicinity: spot.vicinity, place_id: spot.place_id, geometry: spot.geometry, distanceFromCenter: dist, type, opening_hours: spot.opening_hours as any, user_ratings_total: spot.user_ratings_total, photoUrl, types: spot.types };
              });
              spots = spots.filter(spot => {
                  const tags = spot.types || [];
                  if (type === 'camping') return tags.includes('campground') || tags.includes('rv_park') || (tags.includes('parking') && /camping|area|camper|autocaravana/i.test(spot.name || ''));
                  if (type === 'gas') return tags.includes('gas_station');
                  if (type === 'supermarket') return tags.includes('supermarket') || tags.includes('grocery_or_supermarket') || tags.includes('convenience_store');
                  if (type === 'laundry') return tags.includes('laundry') && !tags.includes('lodging');
                  return true;
              });
              setPlaces(prev => ({...prev, [type]: spots.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0))}));
          } else { setPlaces(prev => ({...prev, [type]: []})); }
      });
  }, [map]);

  const handleToggle = (type: ServiceType) => {
      const newState = !toggles[type];
      setToggles(prev => ({...prev, [type]: newState}));
      if (newState && selectedDayIndex !== null && results.dailyItinerary) {
          const day = results.dailyItinerary[selectedDayIndex];
          if (day.coordinates) searchPlaces(day.coordinates, type);
      }
  };

  const handleAddPlace = (place: PlaceWithDistance) => { if (selectedDayIndex === null || !results.dailyItinerary) return; const updatedItinerary = [...results.dailyItinerary]; const currentDay = updatedItinerary[selectedDayIndex]; if (!currentDay.savedPlaces) currentDay.savedPlaces = []; if (!currentDay.savedPlaces.some(p => p.place_id === place.place_id)) { currentDay.savedPlaces.push(place); setResults({ ...results, dailyItinerary: updatedItinerary }); } };
  const handleRemovePlace = (placeId: string) => { if (selectedDayIndex === null || !results.dailyItinerary) return; const updatedItinerary = [...results.dailyItinerary]; const currentDay = updatedItinerary[selectedDayIndex]; if (currentDay.savedPlaces) { currentDay.savedPlaces = currentDay.savedPlaces.filter(p => p.place_id !== placeId); setResults({ ...results, dailyItinerary: updatedItinerary }); } };
  
  const focusMapOnStage = async (dayIndex: number) => {
    if (typeof google === 'undefined' || !results.dailyItinerary) return;
    const dailyPlan = results.dailyItinerary[dayIndex];
    if (!dailyPlan) return;
    setSelectedDayIndex(dayIndex); 
    setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
    setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });
    setHoveredPlace(null);
    if (dailyPlan.coordinates) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: dailyPlan.coordinates.lat + 0.4, lng: dailyPlan.coordinates.lng + 0.4 });
        bounds.extend({ lat: dailyPlan.coordinates.lat - 0.4, lng: dailyPlan.coordinates.lng - 0.4 });
        setMapBounds(bounds);
        searchPlaces(dailyPlan.coordinates, 'camping');
    } else {
        const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
        const coord = await geocodeCity(cleanTo);
        if (coord) {
             const bounds = new google.maps.LatLngBounds();
             bounds.extend({ lat: coord.lat + 0.4, lng: coord.lng + 0.4 });
             bounds.extend({ lat: coord.lat - 0.4, lng: coord.lng - 0.4 });
             setMapBounds(bounds);
             searchPlaces(coord, 'camping'); 
        }
    }
  };

  const handlePlaceClick = (spot: PlaceWithDistance) => {
      if (spot.link) window.open(spot.link, '_blank');
      else if (spot.place_id && !spot.place_id.startsWith('custom-')) window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
  };

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 font-bold text-xl animate-pulse">Cargando CaraCola...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6">
        
        <div className="w-full no-print">
            <AppHeader 
                onLoadTrip={handleLoadCloudTrip} 
                auditMode={auditMode} setAuditMode={setAuditMode}
                hasResults={!!results.dailyItinerary} currentTripId={currentTripId}
                isSaving={isSaving} onSave={handleSaveToCloud}
                onShare={handleShareTrip} onReset={handleResetTrip}
            />
        </div>

        <div className="print-only hidden text-center mb-10">
             <h1 className="text-4xl font-bold text-red-600 mb-2">CaraCola Viajes 🐌</h1>
             <h2 className="text-2xl font-bold text-gray-800">{formData.origen} ➝ {formData.destino}</h2>
             <p className="text-gray-500">Itinerario generado el {new Date().toLocaleDateString()}</p>
        </div>

        <TripForm 
            formData={formData} 
            setFormData={setFormData} 
            loading={loading} 
            onSubmit={calculateRoute} 
            showWaypoints={showWaypoints} 
            setShowWaypoints={setShowWaypoints} 
        />

        {results.totalCost !== null && (
            <div className="space-y-6">
                
                {/* 1. ESTADÍSTICAS (Extraído) */}
                <TripStats 
                    days={results.totalDays} 
                    distance={results.distanceKm} 
                    cost={results.totalCost} 
                    liters={((results.distanceKm! / 100) * formData.consumo)} 
                />

                {/* 2. SELECTOR DE ETAPAS (Extraído) */}
                <StageSelector 
                    dailyItinerary={results.dailyItinerary} 
                    selectedDayIndex={selectedDayIndex} 
                    onSelectDay={focusMapOnStage} 
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 3. MAPA (Extraído) */}
                    <TripMap 
                        setMap={setMap}
                        mapBounds={mapBounds}
                        directionsResponse={directionsResponse}
                        dailyItinerary={results.dailyItinerary}
                        places={places}
                        toggles={toggles}
                        selectedDayIndex={selectedDayIndex}
                        hoveredPlace={hoveredPlace}
                        setHoveredPlace={setHoveredPlace}
                        onPlaceClick={handlePlaceClick}
                    />

                    {/* 4. PANEL ITINERARIO / DETALLE (Extraído) */}
                    <ItineraryPanel 
                        dailyItinerary={results.dailyItinerary}
                        selectedDayIndex={selectedDayIndex}
                        origin={formData.origen}
                        destination={formData.destino}
                        places={places}
                        loadingPlaces={loadingPlaces}
                        toggles={toggles}
                        auditMode={auditMode}
                        onToggle={handleToggle}
                        onAddPlace={handleAddPlace}
                        onRemovePlace={handleRemovePlace}
                        onHover={setHoveredPlace}
                        onAddDay={handleAddDay}
                        onRemoveDay={handleRemoveDay}
                        onSelectDay={focusMapOnStage}
                    />
                </div>
            </div>
        )}
      </div>
    </main>
  );
}