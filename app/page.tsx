'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
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
import TripActionButtons from './components/TripActionButtons';


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
  const [userWantsEditTrip, setUserWantsEditTrip] = useState(false);

  const {
      results, setResults, directionsResponse,
      setDirectionsResponse,
      loading, calculateRoute, addDayToItinerary, removeDayFromItinerary
  } = useTripCalculator(convert, settings.units);

  // Hook para filtros de búsqueda (rating, radio, sort)
  const { minRating, setMinRating, searchRadius, setSearchRadius, sortBy, setSortBy } = useSearchFilters();

  const {
      places, loadingPlaces, toggles,
        searchPlaces,
      searchBlockSpots,
      searchBlockFood,
      searchBlockServices,
      searchBlockTourism,
        searchByQuery,
        clearSearch,
        handleToggle,
        resetPlaces
  } = useTripPlaces(map, apiTripId, formData.tripName, searchRadius);

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

  const { adjustModalOpen, adjustingDayIndex, isRecalculating, handleAdjustDay, handleConfirmAdjust, closeAdjustModal } = useStageAdjust({
    results,
    setResults,
    setDirectionsResponse,
    formData,
    setFormData,
    showToast,
    tripId: apiTripId,
  });

  const isBlockingUi = loading || isRecalculating;

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

  const handleCalculateAllWithUi = useCallback(
    async (e: React.FormEvent) => {
      setUserWantsEditTrip(false);
      await handleCalculateAll(e);
    },
    [handleCalculateAll]
  );

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
    searchBlockSpots,
    searchBlockFood,
    searchBlockServices,
    searchBlockTourism,
  });

  const { handleAddPlace, handleRemovePlace } = useSavedPlacesUi({
    selectedDayIndex,
    results,
    // useTripCalculator currently exposes setResults as a setter. We keep the same update pattern as before.
    setResults: (next) => setResults(next),
    showToast,
  });

  const handleToggleWrapper = async (type: ServiceType) => {
    const day = selectedDayIndex !== null ? results.dailyItinerary?.[selectedDayIndex] : null;
    let coords: Coordinates | undefined = day?.coordinates || day?.startCoordinates;
    let coordsSource: 'day.coordinates' | 'day.startCoordinates' | 'geocode(day.to)' | 'map.center' | 'none' = 'none';

    if (day?.coordinates) coordsSource = 'day.coordinates';
    else if (day?.startCoordinates) coordsSource = 'day.startCoordinates';

    // Robustez: si el día no trae coordenadas (p.ej. geocoding falló o no se guardó), intentamos geocodificar.
    if (!coords && day && typeof google !== 'undefined') {
      const cleanTo = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split('|')[0].trim();
      if (cleanTo) {
        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ address: cleanTo });
          const first = response.results?.[0]?.geometry?.location?.toJSON();
          if (first) coords = { lat: first.lat, lng: first.lng };
          if (coords) coordsSource = 'geocode(day.to)';
        } catch {
          // ignore
        }
      }
    }

    // Último recurso: usar el centro del mapa si existe (para no dejar el botón "muerto").
    if (!coords && map) {
      const c = map.getCenter();
      if (c) coords = { lat: c.lat(), lng: c.lng() };
      if (coords) coordsSource = 'map.center';
    }

    console.log('🟦 [toggle-click]', {
      type,
      selectedDayIndex,
      hasDay: !!day,
      coordsSource,
      coords,
    });

    // UX: al activar una categoría en una etapa, centramos el mapa en el punto de búsqueda
    // y aseguramos un encuadre mínimo equivalente a 30km (para ver todos los servicios).
    if (selectedDayIndex !== null && coords && typeof google !== 'undefined') {
      const radiusM = 30_000;
      try {
        const bounds = new google.maps.LatLngBounds();
        const center = new google.maps.LatLng(coords.lat, coords.lng);

        if (google.maps.geometry?.spherical?.computeOffset) {
          bounds.extend(google.maps.geometry.spherical.computeOffset(center, radiusM, 45));
          bounds.extend(google.maps.geometry.spherical.computeOffset(center, radiusM, 225));
        } else {
          // Fallback aproximado si geometry no está disponible
          const latDelta = radiusM / 111_320;
          const lngDelta = radiusM / (111_320 * Math.max(0.1, Math.cos((coords.lat * Math.PI) / 180)));
          bounds.extend({ lat: coords.lat + latDelta, lng: coords.lng + lngDelta });
          bounds.extend({ lat: coords.lat - latDelta, lng: coords.lng - lngDelta });
        }

        setMapBounds(bounds);
      } catch {
        // ignore
      }
    }

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

  const unitKm = convert(1, 'km') === 1 ? 'km' : 'mi';
  const unitCurrency = convert(1, 'currency') === 1 ? '€' : '$';
  const totalDistance = results.dailyItinerary?.reduce((sum, day) => sum + day.distance, 0) || results.distanceKm || 0;
  const displayKm = totalDistance ? convert(totalDistance, 'km').toFixed(0) : '0';
  const displayCost = results.totalCost ? convert(results.totalCost, 'currency').toFixed(0) : '0';
  const displayDays = results.totalDays || '0';
  const displayTripName =
    formData.tripName || `${formData.origen?.split(',')[0] || 'Origen'} → ${formData.destino?.split(',')[0] || 'Destino'}`;

  const isTripFormExpanded = !results.totalDays || userWantsEditTrip;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6 relative">

        {isBlockingUi && (
          <div className="absolute inset-0 z-40 no-print">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />
            <div className="absolute inset-0 bg-white/60 cursor-wait" />
          </div>
        )}

        <div className="w-full no-print">
            <AppHeader
              onLoadTrip={handleLoadCloudTrip}
              currentTripId={currentTripId}
              t={t}
              setLang={setLang}
              language={language}
              centerContent={
                results.totalDays ? (
                  <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between p-2 gap-2">
                    <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto px-2">
                      <span className="text-red-600 font-bold text-sm truncate">{displayTripName}</span>
                      {formData.vueltaACasa && (
                        <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                          {t('FORM_ROUND_TRIP_SHORT')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 bg-gray-50 rounded-lg px-3 py-1.5 w-full md:w-auto justify-center">
                      <div className="text-xs font-bold text-gray-700">{displayDays} <span className="font-normal text-gray-500">{t('STATS_DAYS')}</span></div>
                      <div className="w-px h-3 bg-gray-300"></div>
                      <div className="text-xs font-bold text-gray-700">{displayKm} <span className="font-normal text-gray-500">{unitKm}</span></div>
                      <div className="w-px h-3 bg-gray-300 hidden sm:block"></div>
                      <div className="text-xs font-bold text-green-600 hidden sm:flex">{displayCost} {unitCurrency}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TripActionButtons
                        auditMode={auditMode}
                        setAuditMode={setAuditMode}
                        results={results}
                        currentTripId={currentTripId}
                        isSaving={isSaving}
                        onSave={handleSaveToCloud}
                        onShare={handleShareTrip}
                        onReset={handleResetTrip}
                        t={t}
                      />
                      <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                      <button
                        onClick={() => setUserWantsEditTrip((prev) => !prev)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        title={t('DASHBOARD_EDIT')}
                      >
                        <span>{t('DASHBOARD_EDIT')}</span>
                      </button>
                    </div>
                  </div>
                ) : null
              }
            />
        </div>

        <div className="print-only hidden text-center mb-10">
             <h1 className="text-4xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
               <Image src="/logo.jpg" alt="CaraCola" width={40} height={40} className="h-10 w-10 inline-block" />
                {t('APP_TITLE')}
             </h1>
             <h2 className="text-2xl font-bold text-gray-800">{formData?.origen || ''} ➝ {formData?.destino || ''}</h2>
             <p className="text-gray-500">{t('ITINERARY_GENERATED_ON')} {new Date().toLocaleDateString()}</p>
        </div>

        <TripForm
            formData={formData} setFormData={setFormData} loading={loading} results={results}
          onSubmit={handleCalculateAllWithUi} showWaypoints={showWaypoints} setShowWaypoints={setShowWaypoints}
            auditMode={auditMode} setAuditMode={setAuditMode} isSaving={isSaving} onSave={handleSaveToCloud}
            onShare={handleShareTrip} onReset={handleResetTrip} currentTripId={currentTripId}
            t={t} convert={convert}
            isExpanded={isTripFormExpanded}
            setIsExpanded={setUserWantsEditTrip}
            renderCollapsedSummary={false}
        />

        {!!results?.dailyItinerary?.length && (
            <div className="space-y-6 animate-fadeIn">

            <div className="-mt-4">
              <StageSelector
                dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} onSelectDay={focusMapOnStage}
                t={t} settings={settings}
              />
            </div>

            <div className="grid grid-cols-1 lg:[grid-template-columns:3fr_7fr] gap-6 lg:min-h-[520px] lg:h-[calc(100vh-280px)] lg:max-h-[650px] min-h-0">

              <div className="min-w-0 min-h-0 h-full">
                <ItineraryPanel
                    dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} origin={formData.origen} destination={formData.destino}
                    tripName={formData.tripName}
                    places={places} loadingPlaces={loadingPlaces} toggles={toggles} auditMode={auditMode}
                    onToggle={handleToggleWrapper} onAddPlace={handleAddPlace} onRemovePlace={handleRemovePlace} onHover={setHoveredPlace}
                    onAddDay={(i) => addDayToItinerary(i, formData.fechaInicio)} onRemoveDay={(i) => removeDayFromItinerary(i, formData.fechaInicio)}
                    onSelectDay={focusMapOnStage} onSearchNearDay={handleSearchNearDay} onAdjustDay={handleAdjustDay} t={t} convert={convert}
                    minRating={minRating} setMinRating={setMinRating} searchRadius={searchRadius} setSearchRadius={setSearchRadius} sortBy={sortBy} setSortBy={setSortBy}
                />
              </div>

              <div className="min-w-0 min-h-0 h-full">
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
