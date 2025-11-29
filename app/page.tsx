'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { Coordinates, DailyPlan, PlaceWithDistance, ServiceType, TripResult } from './types';
import { MARKER_ICONS, ICONS_ITINERARY } from './constants';
import { supabase } from './supabase';

// IMPORTAMOS NUESTROS COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import DaySpotsList from './components/DaySpotsList';

// --- CONFIGURACIÓN VISUAL ---
const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]; 

const printStyles = `
  @media print {
    body { background: white; color: black; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-break { page-break-inside: avoid; }
    .shadow-lg, .shadow-sm, .border { box-shadow: none !important; border: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;

// Iconos de la tabla resumen (estos se quedan aquí porque son parte de la lógica de la vista principal)
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconPrint = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);

export default function Home() {
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

  // Estados de búsqueda y filtros (se pasan a DaySpotsList)
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
  });

  const [results, setResults] = useState<TripResult>({
    totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null
  });

  const [loading, setLoading] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);

  // PERSISTENCIA
  useEffect(() => {
      const savedData = localStorage.getItem('caracola_trip_v1');
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              if (parsed.formData) setFormData(parsed.formData);
              if (parsed.results) setResults(parsed.results);
              if (parsed.tripId) setCurrentTripId(parsed.tripId);
          } catch (e) { console.error(e); }
      }
      setIsInitialized(true);
  }, []);

  useEffect(() => {
      if (isInitialized) {
          const dataToSave = { formData, results, tripId: currentTripId };
          localStorage.setItem('caracola_trip_v1', JSON.stringify(dataToSave));
      }
  }, [formData, results, currentTripId, isInitialized]);

  // HELPERS (Reset, Load, Share, Save)
  const handleResetTrip = () => {
      // Utilizamos un modal en lugar de alert/confirm (por si ya lo implementaste)
      // Si no, usar la versión confirm para debug:
      if (confirm("¿Borrar viaje y empezar de cero?")) {
          localStorage.removeItem('caracola_trip_v1');
          window.location.reload();
      }
  };

  const handleLoadCloudTrip = (tripData: any, tripId: number) => {
      if (tripData) {
          setFormData(tripData.formData);
          setResults(tripData.results);
          setCurrentTripId(tripId); 
          setSelectedDayIndex(null);
          setMapBounds(null);
          setForceUpdate(prev => prev + 1);
          // alert(`✅ Viaje cargado. (ID: ${tripId})`); // Reemplazar con notificación UI
      }
  };

  const handleShareTrip = async () => {
    if (!currentTripId) return console.log("Guarda el viaje primero."); // Usar console.log en lugar de alert
    const { error } = await supabase.from('trips').update({ is_public: true }).eq('id', currentTripId);
    if (error) return console.error("Error: " + error.message);
    const shareUrl = `${window.location.origin}/share/${currentTripId}`;
    // navigator.clipboard.writeText(shareUrl).then(() => console.log(`🔗 Enlace copiado:\n${shareUrl}`)); // Usar notificación UI
    console.log(`🔗 Enlace de compartir: ${shareUrl}`);
  };

  const handleSaveToCloud = async () => {
    if (!results.dailyItinerary) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return console.log("Inicia sesión para guardar.");

    setIsSaving(true);
    const tripName = `${formData.origen} a ${formData.destino} (${formData.fechaInicio})`;
    const tripPayload = { formData, results };

    try {
        if (currentTripId) {
            // Usar la versión confirm para debug:
            const overwrite = confirm(`¿Sobrescribir viaje existente (ID: ${currentTripId})?\nCancelar = Guardar copia nueva`); 
            if (overwrite) {
                const { error } = await supabase.from('trips').update({ name: tripName, trip_data: tripPayload, updated_at: new Date().toISOString() }).eq('id', currentTripId);
                if (error) throw error;
                // alert("✅ Actualizado.");
            } else {
                const { data, error } = await supabase.from('trips').insert([{ name: tripName + " (Copia)", trip_data: tripPayload, user_id: session.user.id }]).select();
                if (error) throw error;
                if (data && data[0]) setCurrentTripId(data[0].id);
                // alert("✅ Copia guardada.");
            }
        } else {
            const { data, error } = await supabase.from('trips').insert([{ name: tripName, trip_data: tripPayload, user_id: session.user.id }]).select();
            if (error) throw error;
            if (data && data[0]) setCurrentTripId(data[0].id);
            // alert("✅ Viaje nuevo guardado.");
        }
    } catch (error: any) { console.error("❌ Error: " + error.message); } finally { setIsSaving(false); }
  };

  // --- LÓGICA DEL MAPA (Route, Geocode, Places) ---
  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setDirectionsResponse(null); 
    setResults({ totalDays: null, distanceKm: null, totalCost: null, dailyItinerary: null, error: null }); 
    setSelectedDayIndex(null); 
    setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
    setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });
    setCurrentTripId(null); 

    const directionsService = new google.maps.DirectionsService();
    const waypoints = formData.etapas.split(',').map(s => s.trim()).filter(s => s.length > 0).map(location => ({ location, stopover: true }));

    try {
      const result = await directionsService.route({
        origin: formData.origen, destination: formData.destino, waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING, avoidTolls: formData.evitarPeajes,
      });

      setDirectionsResponse(result);
      const route = result.routes[0];
      const itinerary: DailyPlan[] = [];
      
      let dayCounter = 1;
      let currentDate = new Date(formData.fechaInicio);
      const maxMeters = formData.kmMaximoDia * 1000;
      const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const formatDateISO = (d: Date) => d.toISOString().split('T')[0]; 
      const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

      let currentLegStartName = formData.origen;
      let totalDistMeters = 0; 

      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        let legPoints: google.maps.LatLng[] = [];
        leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });
        let legAccumulator = 0;
        let segmentStartName = currentLegStartName;

        const getCityAndProvince = async (lat: number, lng: number): Promise<string> => {
            const geocoder = new google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({ location: { lat, lng } });
              if (response.results[0]) {
                const comps = response.results[0].address_components;
                const city = comps.find(c => c.types.includes("locality"))?.long_name || comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "Punto Ruta";
                return city;
              }
            } catch (e) { }
            return "Parada Ruta";
        };

        for (let j = 0; j < legPoints.length - 1; j++) {
            const point1 = legPoints[j];
            const point2 = legPoints[j+1];
            const segmentDist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
            if (legAccumulator + segmentDist > maxMeters) {
                const lat = point1.lat(); const lng = point2.lng(); 
                const locationString = await getCityAndProvince(lat, lng);
                const stopTitle = `📍 Parada Táctica: ${locationString}`;
                itinerary.push({ 
                    day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                    from: segmentStartName, to: stopTitle, distance: (legAccumulator + segmentDist) / 1000, isDriving: true,
                    coordinates: { lat, lng }, type: 'tactical', savedPlaces: []
                });
                dayCounter++; currentDate = addDay(currentDate); legAccumulator = 0; segmentStartName = locationString;
            } else { legAccumulator += segmentDist; }
        }
        let endLegName = leg.end_address.split(',')[0];
        if (i === route.legs.length - 1) endLegName = formData.destino;
        
        if (legAccumulator > 0 || segmentStartName !== endLegName) {
            const isFinalDest = i === route.legs.length - 1;
            itinerary.push({ 
                day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                from: segmentStartName, to: endLegName, distance: legAccumulator / 1000, isDriving: true,
                coordinates: { lat: leg.end_location.lat(), lng: leg.end_location.lng() }, 
                type: isFinalDest ? 'end' : 'overnight', savedPlaces: [] 
            });
            currentLegStartName = endLegName;
            if (i < route.legs.length - 1) { dayCounter++; currentDate = addDay(currentDate); }
        }
        totalDistMeters += leg.distance?.value || 0;
      }

      // Estancia final
      if (formData.fechaRegreso) {
          const diffTime = new Date(formData.fechaRegreso).getTime() - currentDate.getTime();
          const stayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          for(let i=0; i < stayDays; i++) {
               dayCounter++; currentDate = addDay(currentDate);
               itinerary.push({ 
                   day: dayCounter, date: formatDate(currentDate), isoDate: formatDateISO(currentDate),
                   from: formData.destino, to: formData.destino, distance: 0, isDriving: false, type: 'end', savedPlaces: [] 
               });
          }
      }
      const liters = (totalDistMeters / 1000 / 100) * formData.consumo;
      setResults({ totalDays: dayCounter, distanceKm: totalDistMeters / 1000, totalCost: liters * formData.precioGasoil, dailyItinerary: itinerary, error: null });
    } catch (error: any) { setResults(prev => ({...prev, error: "Error al calcular. Revisa las ciudades."})); } finally { setLoading(false); }
  };

  // Funciones de mapa
  useEffect(() => {
      if (map) {
          if (mapBounds) { setTimeout(() => map.fitBounds(mapBounds), 500); } 
          else if (directionsResponse && selectedDayIndex === null) { setTimeout(() => map.fitBounds(directionsResponse.routes[0].bounds), 500); }
      }
  }, [map, mapBounds, directionsResponse, selectedDayIndex, forceUpdate]);

  const handleToggle = (type: ServiceType) => {
      const newState = !toggles[type];
      setToggles(prev => ({...prev, [type]: newState}));
      if (newState && selectedDayIndex !== null && results.dailyItinerary) {
          const day = results.dailyItinerary[selectedDayIndex];
          if (day.coordinates) searchPlaces(day.coordinates, type);
      }
  };

  const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
    if (!map || typeof google === 'undefined') return;
    if (type === 'custom') return; 
    
    const service = new google.maps.places.PlacesService(map);
    const centerPoint = new google.maps.LatLng(location.lat, location.lng);
    let keywords = ''; let radius = 10000;
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
                if (spot.geometry?.location) dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);
                const photoUrl = spot.photos && spot.photos.length > 0 ? spot.photos[0].getUrl({ maxWidth: 200 }) : undefined;
                return {
                    name: spot.name, rating: spot.rating, vicinity: spot.vicinity, place_id: spot.place_id,
                    geometry: spot.geometry, distanceFromCenter: dist, type,
                    opening_hours: spot.opening_hours as any, user_ratings_total: spot.user_ratings_total, photoUrl, types: spot.types 
                };
            });
            // PORTERO
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

  const handleAddPlace = (place: PlaceWithDistance) => {
    if (selectedDayIndex === null || !results.dailyItinerary) return;
    const updatedItinerary = [...results.dailyItinerary];
    const currentDay = updatedItinerary[selectedDayIndex];
    if (!currentDay.savedPlaces) currentDay.savedPlaces = [];
    if (!currentDay.savedPlaces.some(p => p.place_id === place.place_id)) {
        currentDay.savedPlaces.push(place);
        setResults({ ...results, dailyItinerary: updatedItinerary });
    }
  };

  const handleRemovePlace = (placeId: string) => {
    if (selectedDayIndex === null || !results.dailyItinerary) return;
    const updatedItinerary = [...results.dailyItinerary];
    const currentDay = updatedItinerary[selectedDayIndex];
    if (currentDay.savedPlaces) {
        currentDay.savedPlaces = currentDay.savedPlaces.filter(p => p.place_id !== placeId);
        setResults({ ...results, dailyItinerary: updatedItinerary });
    }
  };

  // Focus Map
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

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 font-bold text-xl animate-pulse">Cargando CaraCola...</div>;

  return (
    // Se añade padding-top para compensar la cabecera fija
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900 pt-20 sm:pt-24">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6">
        
        {/* HEADER */}
        {/* CLASES CORREGIDAS: w-full y se eliminan flex-col, items-center y text-center que rompían el justify-between */}
        <div className="w-full no-print">
            <AppHeader 
                onLoadTrip={handleLoadCloudTrip} 
                auditMode={auditMode} 
                setAuditMode={setAuditMode}
                hasResults={!!results.dailyItinerary}
                currentTripId={currentTripId}
                isSaving={isSaving}
                onSave={handleSaveToCloud}
                onShare={handleShareTrip}
                onReset={handleResetTrip}
            />
        </div>

        {/* PORTADA PRINT */}
        <div className="print-only hidden text-center mb-10">
             <h1 className="text-4xl font-bold text-red-600 mb-2">CaraCola Viajes 🐌</h1>
             <h2 className="text-2xl font-bold text-gray-800">{formData.origen} ➝ {formData.destino}</h2>
             <p className="text-gray-500">Itinerario generado el {new Date().toLocaleDateString()}</p>
        </div>

        {/* FORMULARIO */}
        <TripForm 
            formData={formData} 
            setFormData={setFormData} 
            loading={loading} 
            onSubmit={calculateRoute} 
            showWaypoints={showWaypoints} 
            setShowWaypoints={setShowWaypoints} 
        />

        {/* RESULTADOS */}
        {results.totalCost !== null && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-red-50 rounded-full"><IconCalendar /></div><div><p className="text-xl font-extrabold text-gray-800">{results.totalDays}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Días</p></div></div>
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-blue-50 rounded-full"><IconMap /></div><div><p className="text-xl font-extrabold text-gray-800">{results.distanceKm?.toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Km</p></div></div>
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-purple-50 rounded-full"><IconFuel /></div><div><p className="text-xl font-extrabold text-gray-800">{((results.distanceKm! / 100) * formData.consumo).toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Litros</p></div></div>
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100"><div className="p-2 bg-green-50 rounded-full"><IconWallet /></div><div><p className="text-xl font-extrabold text-green-600">{results.totalCost?.toFixed(0)} €</p><p className="text-[10px] text-gray-500 font-bold uppercase">Coste</p></div></div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-4 no-print">
                        <h3 className="font-bold text-gray-700 text-sm mb-3">Selecciona una Etapa:</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => { setSelectedDayIndex(null); setMapBounds(null); setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true }); setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] }); setHoveredPlace(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedDayIndex === null ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>🌎 General</button>
                            {results.dailyItinerary?.map((day, index) => (
                                <button key={index} onClick={() => focusMapOnStage(index)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${selectedDayIndex === index ? 'bg-red-600 text-white border-red-600 shadow-md' : (day.isDriving ? 'bg-white text-gray-700 border-gray-200 hover:border-red-300' : 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300')}`}><span>{day.isDriving ? '🚐' : '🏖️'}</span> Día {day.day}: {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative no-print">
                            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6} onLoad={map => { setMap(map); if (mapBounds) map.fitBounds(mapBounds); }}>
                                {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4 } }} />}
                                
                                {results.dailyItinerary?.map((day, i) => day.coordinates && (
                                    <Marker key={`itinerary-${i}`} position={day.coordinates} icon={day.type === 'tactical' ? ICONS_ITINERARY.tactical : ICONS_ITINERARY.startEnd} title={day.to} />
                                ))}

                                {Object.keys(places).map((key) => {
                                    const type = key as ServiceType;
                                    const savedDay = results.dailyItinerary![selectedDayIndex!];
                                    const savedOfType = savedDay?.savedPlaces?.filter(s => s.type === type) || [];
                                    let listToRender: PlaceWithDistance[] = [];

                                    if (toggles[type] || type === 'camping') {
                                        if (savedOfType.length > 0 && type !== 'tourism' && type !== 'custom') listToRender = savedOfType; 
                                        else if (type === 'custom') listToRender = savedOfType; 
                                        else listToRender = [...savedOfType, ...places[type]]; 
                                    } else { listToRender = savedOfType; } 

                                    const uniqueRender = listToRender.filter((v,i,a)=>a.findIndex(t=>(t.place_id === v.place_id))===i);
                                    
                                    return uniqueRender.map((spot, i) => (
                                        spot.geometry?.location && (
                                            <Marker 
                                                key={`${type}-${i}`} 
                                                position={spot.geometry.location} 
                                                icon={{ url: MARKER_ICONS[type], scaledSize: new window.google.maps.Size(30, 30) }}
                                                label={{ text: savedOfType.some(s => s.place_id === spot.place_id) ? "✓" : (i + 1).toString(), color: "white", fontWeight: "bold", fontSize: "10px" }}
                                                title={spot.name}
                                                onClick={() => spot.place_id && !spot.place_id.startsWith('custom-') && window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank')}
                                                onMouseOver={() => setHoveredPlace(spot)}
                                                onMouseOut={() => setHoveredPlace(null)}
                                            />
                                        )
                                    }));
                                })}

                                {hoveredPlace && hoveredPlace.geometry?.location && (
                                    <InfoWindow position={hoveredPlace.geometry.location} onCloseClick={() => setHoveredPlace(null)} options={{ disableAutoPan: true, pixelOffset: new google.maps.Size(0, -35) }}>
                                        <div className="p-0 w-[200px] overflow-hidden">
                                            {hoveredPlace.photoUrl ? <img src={hoveredPlace.photoUrl} alt={hoveredPlace.name} className="w-full h-24 object-cover rounded-t-lg" /> : 
                                                <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-4xl">
                                                    {hoveredPlace.type === 'custom' ? '⭐' : hoveredPlace.type === 'camping' ? '🚐' : hoveredPlace.type === 'restaurant' ? '🍳' : '📍'}
                                                </div>}
                                            <div className="p-2 bg-white"><h6 className="font-bold text-sm text-gray-800 mb-1 leading-tight">{hoveredPlace.name}</h6><div className="flex items-center gap-1 text-xs text-orange-500 font-bold mb-1">{hoveredPlace.rating ? `★ ${hoveredPlace.rating}` : 'Sin val.'}{hoveredPlace.user_ratings_total && <span className="text-gray-400 font-normal">({hoveredPlace.user_ratings_total})</span>}</div><p className="text-[10px] text-gray-500 line-clamp-2">{hoveredPlace.vicinity}</p>{hoveredPlace.opening_hours?.open_now !== undefined && <p className={`text-[10px] font-bold mt-1 ${hoveredPlace.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>{hoveredPlace.opening_hours.open_now ? '● Abierto' : '● Cerrado'}</p>}</div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        </div>

                        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px] print:h-auto print:overflow-visible">
                            <div className='p-0 h-full overflow-hidden print:h-auto print:overflow-visible'>
                                {selectedDayIndex === null ? (
                                    <div className="text-center pt-8 overflow-y-auto h-full p-4 print:h-auto print:overflow-visible">
                                        <h4 className="text-xl font-extrabold text-red-600 mb-1">Itinerario Completo</h4>
                                        <div className="text-sm font-bold text-gray-700 mb-2 bg-red-50 inline-block px-3 py-1 rounded-full">{formData.origen} ➝ {formData.destino}</div>
                                        <div className="flex justify-center mb-4 no-print"><button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition shadow-lg"><IconPrint /> Imprimir / Guardar PDF</button></div>
                                        <p className="text-xs text-gray-400 mb-4 no-print">Haz clic en una fila para ver detalles 👇</p>
                                        <div className="space-y-4 text-left">
                                            {results.dailyItinerary?.map((day, index) => (
                                                <div key={index} onClick={() => focusMapOnStage(index)} className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all shadow-sm bg-white print-break">
                                                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-red-700 text-sm flex items-center gap-1">{day.isDriving ? '🚐' : '🏖️'} Día {day.day}</span><span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{day.isDriving ? `${day.distance.toFixed(0)} km` : 'Relax'}</span></div>
                                                    <div className="text-xs text-gray-800 font-medium mb-2">{day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}</div>
                                                    {day.savedPlaces && day.savedPlaces.length > 0 && <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">{day.savedPlaces.map((place, i) => (<div key={i} className="text-xs text-gray-700 flex items-start gap-2"><span className="font-bold text-lg leading-none">{place.type === 'camping' ? '🚐' : place.type === 'restaurant' ? '🍳' : '📍'}</span><div><span className="font-bold block text-green-800">{place.name}</span><span className="text-[10px] text-gray-500">{place.vicinity}</span></div></div>))}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <DaySpotsList 
                                        day={results.dailyItinerary![selectedDayIndex]} 
                                        places={places}
                                        loading={loadingPlaces}
                                        toggles={toggles}
                                        auditMode={auditMode} 
                                        onToggle={handleToggle}
                                        onAddPlace={handleAddPlace}
                                        onRemovePlace={handleRemovePlace}
                                        onHover={setHoveredPlace}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {results.error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-center font-bold">⚠️ {results.error}</div>}
      </div> {/* Cierra el div: w-full max-w-6xl space-y-6 */}
    </main>
  );
}