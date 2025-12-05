'use client';

import React, { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { PlaceWithDistance, ServiceType, Coordinates } from './types';
import { supabase } from './supabase';

// COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import TripMap from './components/TripMap';
import StageSelector from './components/StageSelector';
import ItineraryPanel from './components/ItineraryPanel';
import ToastContainer from './components/ToastContainer';
import UpcomingTripsNotification from './components/UpcomingTripsNotification';
import AdjustStageModal from './components/AdjustStageModal';
import DebugTools from './components/DebugTools';

// HOOKS
import { useTripCalculator } from './hooks/useTripCalculator';
import { useTripPersistence } from './hooks/useTripPersistence';
import { useTripPlaces } from './hooks/useTripPlaces';
import { useLanguage } from './hooks/useLanguage';
import { useToast } from './hooks/useToast';
import { useSearchFilters } from './hooks/useSearchFilters';

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
  const { settings, t, convert, setLang, language } = useLanguage();
  const { toasts, showToast, dismissToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
    language: 'es', 
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingDayIndex, setAdjustingDayIndex] = useState<number | null>(null); 
  const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);
  const [auditMode, setAuditMode] = useState(false);

  const [formData, setFormData] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      tripName: '',
      fechaInicio: tomorrow.toISOString().split('T')[0],
      origen: '',
      fechaRegreso: '',
      destino: '',
      etapas: '',
      consumo: 12.5,
      precioGasoil: 1.35,
      kmMaximoDia: 300,
      evitarPeajes: false,
      vueltaACasa: false,
    };
  });
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [showWaypoints, setShowWaypoints] = useState(false);

  const { 
      results, setResults, directionsResponse,
      loading, calculateRoute, addDayToItinerary, removeDayFromItinerary 
  } = useTripCalculator(convert, settings.units); 

  const { 
      places, loadingPlaces, toggles, 
      searchPlaces, searchByQuery, clearSearch, handleToggle, resetPlaces 
  } = useTripPlaces(map);

  // Hook para filtros de búsqueda (rating, radio, sort)
  const { minRating, setMinRating, searchRadius, setSearchRadius, sortBy, setSortBy } = useSearchFilters();

  const { isSaving, handleResetTrip, handleLoadCloudTrip, handleShareTrip, handleSaveToCloud } = useTripPersistence(
      formData, setFormData, results, setResults, currentTripId, setCurrentTripId,
      () => { setSelectedDayIndex(null); setMapBounds(null); }
  );

  // Wrapper para cargar viaje desde notificación (solo con tripId)
  const handleLoadTripFromNotification = async (tripId: number) => {
      if (!supabase) return;
      
      const { data: trip } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();
      
      if (trip && trip.trip_data) {
          handleLoadCloudTrip(trip.trip_data, trip.id);
      }
  };

  const handleCalculateWrapper = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Auto-generar nombre del viaje si está vacío
      if (!formData.tripName) {
          const origen = formData.origen.split(',')[0];
          const destino = formData.destino.split(',')[0];
          const fecha = new Date(formData.fechaInicio).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
          const autoName = `${origen} → ${destino} (${fecha})`;
          setFormData({ ...formData, tripName: autoName });
      }
      
      setSelectedDayIndex(null); setCurrentTripId(null); resetPlaces(); 
      calculateRoute(formData);
  };

  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => { 
      if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null; 
      const geocoder = new google.maps.Geocoder(); 
      try { const response = await geocoder.geocode({ address: cityName }); if (response.results.length > 0) return response.results[0].geometry.location.toJSON(); } catch { } return null; 
  };

  const handleToggleWrapper = (type: ServiceType) => {
      const day = selectedDayIndex !== null ? results.dailyItinerary?.[selectedDayIndex] : null;
      handleToggle(type, day?.coordinates);
  };

  // Nueva función: Buscar servicios cerca de una etapa específica
  const handleSearchNearDay = async (dayIndex: number) => {
    if (typeof google === 'undefined' || !results.dailyItinerary) return;
    const dailyPlan = results.dailyItinerary[dayIndex];
    if (!dailyPlan || !dailyPlan.isDriving) return;

    // Seleccionar esa etapa y centrar el mapa
    setSelectedDayIndex(dayIndex);
    setHoveredPlace(null);
    
    // Limpiar TODOS los filtros (incluyendo toggles de servicios)
    clearSearch();
    resetPlaces(); // Esto limpia todos los marcadores de búsqueda

    // Determinar las coordenadas de búsqueda
    let searchCoords: Coordinates | undefined = dailyPlan.coordinates;

    // Si no hay coordenadas, intentar geocodificar
    if (!searchCoords) {
      const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
      const geocoded = await geocodeCity(cleanTo);
      searchCoords = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : undefined;
    }

    if (searchCoords) {
      // Centrar el mapa en esa etapa
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: searchCoords.lat + 0.4, lng: searchCoords.lng + 0.4 });
      bounds.extend({ lat: searchCoords.lat - 0.4, lng: searchCoords.lng - 0.4 });
      setMapBounds(bounds);

      // Buscar servicios activos en esa ubicación
      const activeTypes = Object.entries(toggles)
        .filter(([_, isActive]) => isActive)
        .map(([type]) => type as ServiceType);

      // Si no hay ninguno activo, activar 'camping' por defecto
      if (activeTypes.length === 0) {
        searchPlaces(searchCoords, 'camping');
      } else {
        // Buscar todos los tipos activos
        activeTypes.forEach(type => {
          if (type !== 'custom' && type !== 'search' && type !== 'found') {
            searchPlaces(searchCoords!, type);
          }
        });
      }
    }
  };

  // Nueva función: Ajustar destino de una etapa
  const handleAdjustDay = (dayIndex: number) => {
    setAdjustingDayIndex(dayIndex);
    setAdjustModalOpen(true);
  };

  const handleConfirmAdjust = async (newDestination: string, newCoordinates: { lat: number; lng: number }) => {
    if (adjustingDayIndex === null || !results.dailyItinerary) return;
    
    showToast('Recalculando ruta...', 'info');
    
    try {
      console.log('🔧 Ajustando día', adjustingDayIndex, 'a:', newDestination);
      
      // 1. Actualizar la etapa ajustada en el itinerario local
      const updatedItinerary = [...results.dailyItinerary];
      updatedItinerary[adjustingDayIndex] = {
        ...updatedItinerary[adjustingDayIndex],
        to: newDestination,
        coordinates: newCoordinates
      };

      // 2. Si es la última etapa, solo actualizar el destino final
      if (adjustingDayIndex === updatedItinerary.length - 1) {
        console.log('✅ Última etapa - solo actualizar destino');
        setResults({ ...results, dailyItinerary: updatedItinerary });
        showToast('Parada actualizada correctamente', 'success');
        setAdjustModalOpen(false);
        setAdjustingDayIndex(null);
        return;
      }

      // 3. Si es etapa intermedia, RECALCULAR LA RUTA COMPLETA
      // Arquitectura correcta:
      // 1. Extraer waypoints OBLIGATORIOS desde formData.etapas
      // 2. Reemplazar el ajustado con newDestination
      // 3. Enviar a Google: Origin → Obligatorios → Destino
      // 4. Regenerar itinerario DESDE CERO
      // 5. Actualizar formData.etapas con nuevos waypoints
      
      console.log('🔄 Recalculando ruta COMPLETA desde origen original');
      const { getDirectionsAndCost } = await import('./actions');
      
      // Helper: normalizar para Google
      const normalizeForGoogle = (text: string) => {
        const parts = text.split(',');
        const location = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : text.trim();
        return location.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };
      
      // PASO 1: Extraer waypoints OBLIGATORIOS desde formData.etapas
      const waypointsFromForm = formData.etapas
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log('📦 Waypoints obligatorios (formData.etapas):', waypointsFromForm);
      
      // PASO 2: Determinar si reemplazar o agregar
      // Si adjustingDayIndex es antes de los waypoints, reemplazar
      // Si es después, agregarlo como nuevo
      let updatedMandatoryWaypoints: string[];
      
      if (adjustingDayIndex < waypointsFromForm.length) {
        // Reemplazar un waypoint existente (Ej: Tarancón → Madrid reemplaza índice 0)
        updatedMandatoryWaypoints = waypointsFromForm.map((wp, idx) =>
          idx === adjustingDayIndex ? newDestination : wp
        );
      } else {
        // Agregar un nuevo waypoint al final (Ej: usuario agrega Braga)
        updatedMandatoryWaypoints = [...waypointsFromForm, newDestination];
      }
      
      console.log('📦 Waypoints después del ajuste:', updatedMandatoryWaypoints);
      
      const originCityName = normalizeForGoogle(formData.origen);
      const destCityName = normalizeForGoogle(formData.destino);
      const normalizedWaypoints = updatedMandatoryWaypoints.map(wp => normalizeForGoogle(wp));
      
      console.log('📍 Ruta NUEVA a Google:');
      console.log(`  Origen: ${originCityName}`);
      normalizedWaypoints.forEach((wp, i) => console.log(`  Waypoint ${i+1}: ${wp}`));
      console.log(`  Destino: ${destCityName}`);

      // PASO 3: Enviar a Google la ruta NUEVA
      const recalcResult = await getDirectionsAndCost({
        origin: originCityName,
        destination: destCityName,
        waypoints: normalizedWaypoints,
        travel_mode: 'driving',
        kmMaximoDia: formData.kmMaximoDia,
        fechaInicio: results.dailyItinerary[0].date,
        fechaRegreso: ''
      });

      if (recalcResult.error || !recalcResult.dailyItinerary) {
        console.error('❌ Error recalculando:', recalcResult.error);
        if (recalcResult.debugLog) {
          console.log('📊 Server Debug Log:');
          recalcResult.debugLog.forEach((line) => console.log(line));
        }
        showToast('Error: ' + (recalcResult.error || 'No se pudo recalcular'), 'error');
        setAdjustModalOpen(false);
        setAdjustingDayIndex(null);
        return;
      }

      console.log('✅ Recalculado exitosamente. Itinerario nuevo:');
      if (recalcResult.debugLog) {
        recalcResult.debugLog.forEach((line) => console.log(line));
      }

      // PASO 4: El itinerario ya viene COMPLETO desde Google
      // No necesitamos fusionar con días anteriores
      const finalItinerary = recalcResult.dailyItinerary;
      
      console.log('📊 Itinerario final (regenerado desde cero):', finalItinerary.length, 'días');

      // PASO 5: ACTUALIZAR formData.etapas con los waypoints obligatorios
      // Extraer waypoints obligatorios del itinerario nuevo
      const obligatoryWaypoints = finalItinerary
        .slice(0, -1)  // Excluir último día (destino)
        .filter((day: any) => !day.to.includes('📍 Parada Táctica'))
        .map((day: any) => day.to);
      
      console.log('📝 Actualizando formData.etapas:', obligatoryWaypoints);
      
      setFormData(prev => ({
        ...prev,
        etapas: obligatoryWaypoints.join('|')
      }));

      setResults({ 
        ...results, 
        dailyItinerary: finalItinerary
      });
      
      showToast('Ruta recalculada correctamente', 'success');
    } catch (error) {
      console.error('💥 Error recalculando:', error);
      showToast('Error al recalcular ruta: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
    }
    
    setAdjustModalOpen(false);
    setAdjustingDayIndex(null);
  };

  const focusMapOnStage = async (dayIndex: number | null) => {
    // CASO: Volver a la Vista General
    if (dayIndex === null) {
        setSelectedDayIndex(null);
        
        // Enviamos los límites de la ruta completa para resetear la vista
        if (directionsResponse && directionsResponse.routes[0] && directionsResponse.routes[0].bounds) {
             setMapBounds(directionsResponse.routes[0].bounds);
        } else {
             setMapBounds(null);
        }

        resetPlaces(); 
        setHoveredPlace(null); 
        return;
    }

    // CASO: Ir a una Etapa Específica
    if (typeof google === 'undefined' || !results.dailyItinerary) return;
    const dailyPlan = results.dailyItinerary[dayIndex];
    if (!dailyPlan) return;
    
    setSelectedDayIndex(dayIndex); resetPlaces(); setHoveredPlace(null);

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

  // 🔥 ELIMINADO: useEffect de fitBounds (Estaba duplicado y causando conflictos)

  const handlePlaceClick = (spot: PlaceWithDistance) => {
      if (spot.link) window.open(spot.link, '_blank');
      else if (spot.place_id && !spot.place_id.startsWith('custom-')) window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
  };

  const handleAddPlace = (place: PlaceWithDistance) => { 
      if (selectedDayIndex === null || !results.dailyItinerary) return; 
      const updatedItinerary = [...results.dailyItinerary]; 
      const currentDay = updatedItinerary[selectedDayIndex]; 
      if (!currentDay.savedPlaces) currentDay.savedPlaces = []; 
      
      // Verificar duplicado
      if (currentDay.savedPlaces.some(p => p.place_id === place.place_id)) {
          showToast(`"${place.name}" ya está guardado en este día`, 'warning');
          return;
      }
      
      // Si es del buscador (search) o encontrado en mapa (found), marcarlo como privado por defecto
      // PERO respetar la elección explícita del usuario si ya estableció isPublic
      const placeToAdd = (place.type === 'search' || place.type === 'found') 
          ? { ...place, isPublic: place.isPublic ?? false } 
          : place;
      currentDay.savedPlaces.push(placeToAdd); 
      setResults({ ...results, dailyItinerary: updatedItinerary });
      showToast(`"${place.name}" añadido correctamente`, 'success');
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

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 font-bold text-xl animate-pulse">Cargando CaraCola...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6">
        
        <div className="w-full no-print">
            <AppHeader onLoadTrip={handleLoadCloudTrip} currentTripId={currentTripId} t={t} setLang={setLang} language={language} />
        </div>

        <div className="print-only hidden text-center mb-10">
             <h1 className="text-4xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
                <img src="/logo.jpg" alt="CaraCola" className="h-10 w-10 inline-block" />
                {t('APP_TITLE')}
             </h1>
             <h2 className="text-2xl font-bold text-gray-800">{formData?.origen || ''} ➝ {formData?.destino || ''}</h2>
             <p className="text-gray-500">{t('ITINERARY_GENERATED_ON')} {new Date().toLocaleDateString()}</p>
        </div>

        <TripForm 
            formData={formData} setFormData={setFormData} loading={loading} results={results} 
            onSubmit={handleCalculateWrapper} showWaypoints={showWaypoints} setShowWaypoints={setShowWaypoints}
            auditMode={auditMode} setAuditMode={setAuditMode} isSaving={isSaving} onSave={handleSaveToCloud}
            onShare={handleShareTrip} onReset={handleResetTrip} currentTripId={currentTripId}
            t={t} convert={convert}
        />

        {results?.totalCost !== null && results?.totalCost !== undefined && (
            <div className="space-y-6 animate-fadeIn">
                
                <StageSelector 
                    dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} onSelectDay={focusMapOnStage} 
                    t={t} settings={settings}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <ItineraryPanel 
                        dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} origin={formData.origen} destination={formData.destino}
                        tripName={formData.tripName}
                        places={places} loadingPlaces={loadingPlaces} toggles={toggles} auditMode={auditMode}
                        onToggle={handleToggleWrapper} onAddPlace={handleAddPlace} onRemovePlace={handleRemovePlace} onHover={setHoveredPlace}
                        onAddDay={(i) => addDayToItinerary(i, formData.fechaInicio)} onRemoveDay={(i) => removeDayFromItinerary(i, formData.fechaInicio)}
                        onSelectDay={focusMapOnStage} onSearchNearDay={handleSearchNearDay} onAdjustDay={handleAdjustDay} t={t} convert={convert}
                        minRating={minRating} setMinRating={setMinRating} searchRadius={searchRadius} setSearchRadius={setSearchRadius} sortBy={sortBy} setSortBy={setSortBy}
                    />

                    <TripMap 
                        setMap={setMap} mapBounds={mapBounds} directionsResponse={directionsResponse} dailyItinerary={results.dailyItinerary}
                        places={places} toggles={toggles} selectedDayIndex={selectedDayIndex} hoveredPlace={hoveredPlace} setHoveredPlace={setHoveredPlace}
                        onPlaceClick={handlePlaceClick} onAddPlace={handleAddPlace}
                        onSearch={searchByQuery} onClearSearch={clearSearch} mapInstance={map}
                        minRating={minRating} setMinRating={setMinRating} searchRadius={searchRadius} setSearchRadius={setSearchRadius} sortBy={sortBy} setSortBy={setSortBy}
                        t={t}
                    />
                </div>
            </div>
        )}
        
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <UpcomingTripsNotification onLoadTrip={handleLoadTripFromNotification} />
        <DebugTools />
                {/* Modal para ajustar etapa */}
        {adjustModalOpen && adjustingDayIndex !== null && results.dailyItinerary && (
          <AdjustStageModal
            isOpen={adjustModalOpen}
            dayIndex={adjustingDayIndex}
            currentDestination={results.dailyItinerary[adjustingDayIndex].to}
            onClose={() => { setAdjustModalOpen(false); setAdjustingDayIndex(null); }}
            onConfirm={handleConfirmAdjust}
          />
        )}
      </div>
    </main>
  );
}