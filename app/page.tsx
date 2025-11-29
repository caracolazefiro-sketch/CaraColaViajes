'use client';

import React, { useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Coordinates, PlaceWithDistance, ServiceType } from './types';

// IMPORTAMOS NUESTROS COMPONENTES
import AppHeader from './components/AppHeader';
import TripForm from './components/TripForm';
import TripMap from './components/TripMap';
import TripStats from './components/TripStats';
import StageSelector from './components/StageSelector';
import ItineraryPanel from './components/ItineraryPanel';

// IMPORTAMOS LOS GANCHOS (HOOKS) 🧠
import { useTripCalculator } from './hooks/useTripCalculator';
import { useTripPersistence } from './hooks/useTripPersistence'; // <--- NUEVO

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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
    language: 'es' 
  });

  // --- 1. ESTADOS VISUALES LOCALES ---
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null); 
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); 
  const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);
  const [auditMode, setAuditMode] = useState(false); 
  const [forceUpdate, setForceUpdate] = useState(0);

  // Estados de POIs (Se moverán a un hook pronto)
  const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
      camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: []
  });
  const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
      camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false
  });
  const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
      camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true
  });

  // Estados de Formulario
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

  // --- 2. CEREBRO DE CÁLCULO ---
  const { 
      results, setResults, directionsResponse, setDirectionsResponse, 
      loading, calculateRoute, addDayToItinerary, removeDayFromItinerary 
  } = useTripCalculator();

  // --- 3. CEREBRO DE MEMORIA (PERSISTENCIA) ---
  const { isSaving, handleResetTrip, handleLoadCloudTrip, handleShareTrip, handleSaveToCloud } = useTripPersistence(
      formData, setFormData, 
      results, setResults, 
      currentTripId, setCurrentTripId,
      // Callback para resetear UI al cargar
      () => {
          setSelectedDayIndex(null);
          setMapBounds(null);
          setForceUpdate(prev => prev + 1);
      }
  );

  // --- 4. HANDLERS UI ---
  const handleCalculateWrapper = (e: React.FormEvent) => {
      e.preventDefault();
      setSelectedDayIndex(null); 
      setCurrentTripId(null); 
      setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
      setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });
      calculateRoute(formData);
  };

  const geocodeCity = async (cityName: string): Promise<google.maps.LatLngLiteral | null> => { if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') return null; const geocoder = new google.maps.Geocoder(); try { const response = await geocoder.geocode({ address: cityName }); if (response.results.length > 0) return response.results[0].geometry.location.toJSON(); } catch (e) { } return null; };

  // --- EFECTOS DE MAPA Y BUSQUEDA (POIs) ---
  // (Esto será lo siguiente en salir a un hook 'useTripPlaces')
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
  
  const focusMapOnStage = async (dayIndex: number | null) => {
    if (dayIndex === null) {
        setSelectedDayIndex(null); setMapBounds(null); 
        setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
        setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });
        setHoveredPlace(null);
        return;
    }
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
            onSubmit={handleCalculateWrapper} 
            showWaypoints={showWaypoints} 
            setShowWaypoints={setShowWaypoints} 
        />

        {results.totalCost !== null && (
            <div className="space-y-6">
                
                <TripStats 
                    days={results.totalDays} 
                    distance={results.distanceKm} 
                    cost={results.totalCost} 
                    liters={((results.distanceKm! / 100) * formData.consumo)} 
                />

                <StageSelector 
                    dailyItinerary={results.dailyItinerary} 
                    selectedDayIndex={selectedDayIndex} 
                    onSelectDay={focusMapOnStage} 
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        onAddDay={(i) => addDayToItinerary(i, formData.fechaInicio)}
                        onRemoveDay={(i) => removeDayFromItinerary(i, formData.fechaInicio)}
                        onSelectDay={focusMapOnStage}
                    />
                </div>
            </div>
        )}
      </div>
    </main>
  );
}