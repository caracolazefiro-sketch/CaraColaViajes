'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { PlaceWithDistance, ServiceType, Coordinates } from './types';

// COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import TripMap from './components/TripMap';
import StageSelector from './components/StageSelector';
import ItineraryPanel from './components/ItineraryPanel';
import ToastContainer from './components/ToastContainer';
import AdjustStageModal from './components/AdjustStageModal';
import DebugTools from './components/DebugTools';


// HOOKS
import { useTripCalculator } from './hooks/useTripCalculator';
import { useTripPersistence } from './hooks/useTripPersistence';
import { useTripPlaces } from './hooks/useTripPlaces';
import { useLanguage } from './hooks/useLanguage';
import { useToast } from './hooks/useToast';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useTripCompute } from './hooks/useTripCompute';
import { useStageNavigation } from './hooks/useStageNavigation';
import { useSavedPlacesUi } from './hooks/useSavedPlacesUi';
import { useStageAdjust } from './hooks/useStageAdjust';

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
  const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);
  const [auditMode, setAuditMode] = useState(false);

  // tripId único para correlacionar logs server-side (Supabase) por viaje
  const [apiTripId, setApiTripId] = useState<string | null>(null);

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
  } = useTripPlaces(map, apiTripId, formData.tripName);

  // Hook para filtros de búsqueda (rating, radio, sort)
  const { minRating, setMinRating, searchRadius, setSearchRadius, sortBy, setSortBy } = useSearchFilters();

  const resetUiState = useCallback(() => {
    setSelectedDayIndex(null);
    setMapBounds(null);
  }, []);

  const { isSaving, handleResetTrip, handleLoadCloudTrip, handleShareTrip, handleSaveToCloud } = useTripPersistence(
      formData, setFormData, results, setResults, currentTripId, setCurrentTripId,
      resetUiState,
      apiTripId,
      setApiTripId
  );

  const { adjustModalOpen, adjustingDayIndex, handleAdjustDay, handleConfirmAdjust, closeAdjustModal } = useStageAdjust({
    results,
    setResults,
    formData,
    setFormData,
    showToast,
    tripId: apiTripId,
  });

  const { handleCalculateAll } = useTripCompute({
    formData,
    setFormData,
    resetPlaces,
    calculateRoute,
    setApiTripId,
    resetUi: () => {
      setSelectedDayIndex(null);
      setCurrentTripId(null);
    },
    showToast,
  });

  const { focusMapOnStage, handleSearchNearDay } = useStageNavigation({
    directionsResponse,
    dailyItinerary: results.dailyItinerary,
    toggles,
    setSelectedDayIndex,
    setHoveredPlace: () => setHoveredPlace(null),
    setMapBounds,
    resetPlaces,
    clearSearch,
    searchPlaces,
  });

  const { handleAddPlace, handleRemovePlace } = useSavedPlacesUi({
    selectedDayIndex,
    results,
    // useTripCalculator currently exposes setResults as a setter. We keep the same update pattern as before.
    setResults: (next) => setResults(next),
    showToast,
  });

  const handleToggleWrapper = (type: ServiceType) => {
      const day = selectedDayIndex !== null ? results.dailyItinerary?.[selectedDayIndex] : null;
      const coords: Coordinates | undefined = day?.coordinates || day?.startCoordinates;
      handleToggle(type, coords);
  };

  useEffect(() => {
    resetPlaces();
    clearSearch();
  }, [selectedDayIndex, resetPlaces, clearSearch]);

  // 🔥 ELIMINADO: useEffect de fitBounds (Estaba duplicado y causando conflictos)

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
          onSubmit={handleCalculateAll} showWaypoints={showWaypoints} setShowWaypoints={setShowWaypoints}
            auditMode={auditMode} setAuditMode={setAuditMode} isSaving={isSaving} onSave={handleSaveToCloud}
            onShare={handleShareTrip} onReset={handleResetTrip} currentTripId={currentTripId}
            t={t} convert={convert}
        />

        {!!results?.dailyItinerary?.length && (
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
                      overviewPolyline={results.overviewPolyline ?? null}
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

                {/* Modal para ajustar etapa */}
        {adjustModalOpen && adjustingDayIndex !== null && results.dailyItinerary && (
          <AdjustStageModal
            isOpen={adjustModalOpen}
            dayIndex={adjustingDayIndex}
            currentDestination={results.dailyItinerary[adjustingDayIndex].to}
            onClose={closeAdjustModal}
            onConfirm={handleConfirmAdjust}
          />
        )}
      </div>
      {/* Herramientas de depuración: visibles en todas las builds para comparar entornos */}
      <DebugTools />
    </main>
  );
}
