'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Coordinates, PlaceWithDistance, ServiceType } from './types';

// COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import TripMap from './components/TripMap';
import StageSelector from './components/StageSelector';
import ItineraryPanel from './components/ItineraryPanel';

// HOOKS
import { useTripCalculator } from './hooks/useTripCalculator';
import { useTripPersistence } from './hooks/useTripPersistence';
import { useTripPlaces } from './hooks/useTripPlaces';
import { useLanguage } from './hooks/useLanguage';

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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
    language: 'es', // IDIOMA FIJO
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);
  const [auditMode, setAuditMode] = useState(false); 
  const [forceUpdate, setForceUpdate] = useState(0);

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
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [showWaypoints, setShowWaypoints] = useState(true);

  // ✅ CORRECCIÓN: Pasamos settings.units al hook
  const { 
      results, setResults, directionsResponse, setDirectionsResponse, 
      loading, calculateRoute, addDayToItinerary, removeDayFromItinerary 
  } = useTripCalculator(convert, settings.units); 

  const { 
      places, loadingPlaces, toggles, 
      searchPlaces, searchByQuery, clearSearch, handleToggle, resetPlaces 
  } = useTripPlaces(map);

  const { isSaving, handleResetTrip, handleLoadCloudTrip, handleShareTrip, handleSaveToCloud } = useTripPersistence(
      formData, setFormData, results, setResults, currentTripId, setCurrentTripId,
      () => { setSelectedDayIndex(null); setMapBounds(null); setForceUpdate(prev => prev + 1); }
  );

  const handleCalculateWrapper = (e: React.FormEvent) => {
      e.preventDefault();
      setSelectedDayIndex(null); setCurrentTripId(null); resetPlaces(); 
      calculateRoute(formData);
  };

  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => { 
      if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null; 
      const geocoder = new google.maps.Geocoder(); 
      try { const response = await geocoder.geocode({ address: cityName }); if (response.results.length > 0) return response.results[0].geometry.location.toJSON(); } catch (e) { } return null; 
  };

  const handleToggleWrapper = (type: ServiceType) => {
      const day = selectedDayIndex !== null ? results.dailyItinerary?.[selectedDayIndex] : null;
      handleToggle(type, day?.coordinates);
  };

  // ✅ CORRECCIÓN CRÍTICA: Gestión de Zoom al volver a "General"
  const focusMapOnStage = async (dayIndex: number | null) => {
    // CASO: Volver a la Vista General
    if (dayIndex === null) {
        setSelectedDayIndex(null);
        
        // 🛠️ FIX: Forzamos los límites de la ruta completa (si existe)
        // Esto le dice al mapa: "Oye, resetea el zoom AHORA", ignorando si el usuario lo había movido antes.
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

  // EFECTO CRÍTICO DE FOCUS (Repintado de Zoom)
  // Nota: Al usar setMapBounds arriba explícitamente, este efecto se disparará y el mapa obedecerá.
  useEffect(() => {
      if (map) {
          if (mapBounds) { setTimeout(() => map.fitBounds(mapBounds), 500); } 
          else if (directionsResponse && selectedDayIndex === null) { 
              // Este es el fallback inicial, pero ahora el botón General usa mapBounds explícito
              const routeBounds = directionsResponse.routes[0].bounds; 
              setTimeout(() => map.fitBounds(routeBounds), 500); 
          }
      }
  }, [map, mapBounds, directionsResponse, selectedDayIndex, forceUpdate]);

  const handlePlaceClick = (spot: PlaceWithDistance) => {
      if (spot.link) window.open(spot.link, '_blank');
      else if (spot.place_id && !spot.place_id.startsWith('custom-')) window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
  };

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

  if (!isLoaded) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 font-bold text-xl animate-pulse">Cargando CaraCola...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
      <style jsx global>{printStyles}</style>
      <div className="w-full max-w-6xl space-y-6">
        
        {/* HEADER ÚNICO Y LIMPIO */}
        <div className="w-full no-print">
            <AppHeader onLoadTrip={handleLoadCloudTrip} t={t} setLang={setLang} language={language} />
        </div>

        <div className="print-only hidden text-center mb-10">
             <h1 className="text-4xl font-bold text-red-600 mb-2">{t('APP_TITLE')} 🐌</h1>
             <h2 className="text-2xl font-bold text-gray-800">{formData.origen} ➝ {formData.destino}</h2>
             <p className="text-gray-500">{t('ITINERARY_GENERATED_ON')} {new Date().toLocaleDateString()}</p>
        </div>

        <TripForm 
            formData={formData} setFormData={setFormData} loading={loading} results={results} 
            onSubmit={handleCalculateWrapper} showWaypoints={showWaypoints} setShowWaypoints={setShowWaypoints}
            auditMode={auditMode} setAuditMode={setAuditMode} isSaving={isSaving} onSave={handleSaveToCloud}
            onShare={handleShareTrip} onReset={handleResetTrip} currentTripId={currentTripId}
            t={t} convert={convert}
        />

        {results.totalCost !== null && (
            <div className="space-y-6 animate-fadeIn">
                
                <StageSelector 
                    dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} onSelectDay={focusMapOnStage} 
                    t={t} settings={settings}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <ItineraryPanel 
                        dailyItinerary={results.dailyItinerary} selectedDayIndex={selectedDayIndex} origin={formData.origen} destination={formData.destino}
                        places={places} loadingPlaces={loadingPlaces} toggles={toggles} auditMode={auditMode}
                        onToggle={handleToggleWrapper} onAddPlace={handleAddPlace} onRemovePlace={handleRemovePlace} onHover={setHoveredPlace}
                        onAddDay={(i) => addDayToItinerary(i, formData.fechaInicio)} onRemoveDay={(i) => removeDayFromItinerary(i, formData.fechaInicio)}
                        onSelectDay={focusMapOnStage} t={t} convert={convert}
                    />

                    <TripMap 
                        setMap={setMap} mapBounds={mapBounds} directionsResponse={directionsResponse} dailyItinerary={results.dailyItinerary}
                        places={places} toggles={toggles} selectedDayIndex={selectedDayIndex} hoveredPlace={hoveredPlace} setHoveredPlace={setHoveredPlace}
                        onPlaceClick={handlePlaceClick} onAddPlace={handleAddPlace}
                        onSearch={searchByQuery} onClearSearch={clearSearch} mapInstance={map}
                        t={t}
                    />
                </div>
            </div>
        )}
      </div>
    </main>
  );
}