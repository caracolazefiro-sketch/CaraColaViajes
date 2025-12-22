import { useCallback } from 'react';
import type { Coordinates, DailyPlan, ServiceType } from '../types';
import { getOrCreateClientId } from '../utils/client-id';

type UseStageNavigationParams = {
  directionsResponse: google.maps.DirectionsResult | null;
  dailyItinerary: DailyPlan[] | null;
  toggles: Record<ServiceType, boolean>;

  setSelectedDayIndex: (dayIndex: number | null) => void;
  setHoveredPlace: (place: null) => void;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;

  resetPlaces: () => void;
  clearSearch: () => void;
  searchPlaces: (coords: Coordinates, type: ServiceType) => void;
  searchBlockSpots: (coords: Coordinates) => void;
  searchBlockFood: (coords: Coordinates) => void;
  searchBlockServices: (coords: Coordinates) => void;
  searchBlockTourism: (coords: Coordinates) => void;
};

async function geocodeCity(cityName: string): Promise<google.maps.LatLngLiteral | null> {
  try {
    const clientId = getOrCreateClientId();
    const res = await fetch('/api/google/geocode-address', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
      },
      body: JSON.stringify({ query: cityName, language: 'es' }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const loc = json?.ok ? json?.result?.location : null;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {
    // ignore
  }
  return null;
}

function boundsAround(c: Coordinates, delta = 0.4) {
  const bounds = new google.maps.LatLngBounds();
  bounds.extend({ lat: c.lat + delta, lng: c.lng + delta });
  bounds.extend({ lat: c.lat - delta, lng: c.lng - delta });
  return bounds;
}

export function useStageNavigation({
  directionsResponse,
  dailyItinerary,
  toggles,
  setSelectedDayIndex,
  setHoveredPlace,
  setMapBounds,
  resetPlaces,
  clearSearch,
  searchPlaces,
  searchBlockSpots,
  searchBlockFood,
  searchBlockServices,
  searchBlockTourism,
}: UseStageNavigationParams) {
  const focusMapOnStage = useCallback(
    async (dayIndex: number | null) => {
      // CASO: Volver a la Vista General
      if (dayIndex === null) {
        setSelectedDayIndex(null);

        const routeBounds = directionsResponse?.routes?.[0]?.bounds ?? null;
        setMapBounds(routeBounds);

        resetPlaces();
        setHoveredPlace(null);
        return;
      }

      if (typeof google === 'undefined' || !dailyItinerary) return;
      const dailyPlan = dailyItinerary[dayIndex];
      if (!dailyPlan) return;

      setSelectedDayIndex(dayIndex);
      resetPlaces();
      setHoveredPlace(null);

      let coords: Coordinates | undefined = dailyPlan.coordinates;
      if (!coords) {
        const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
        const coord = await geocodeCity(cleanTo);
        coords = coord ? { lat: coord.lat, lng: coord.lng } : undefined;
      }

      if (coords) {
        setMapBounds(boundsAround(coords));
      }
    },
    [dailyItinerary, directionsResponse, resetPlaces, setHoveredPlace, setMapBounds, setSelectedDayIndex]
  );

  const handleSearchNearDay = useCallback(
    async (dayIndex: number) => {
      if (typeof google === 'undefined' || !dailyItinerary) return;
      const dailyPlan = dailyItinerary[dayIndex];
      if (!dailyPlan || !dailyPlan.isDriving) return;

      setSelectedDayIndex(dayIndex);
      setHoveredPlace(null);

      clearSearch();
      resetPlaces();

      let searchCoords: Coordinates | undefined = dailyPlan.coordinates;

      if (!searchCoords) {
        const cleanTo = dailyPlan.to.replace('📍 Parada Táctica: ', '').split('|')[0];
        const geocoded = await geocodeCity(cleanTo);
        searchCoords = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : undefined;
      }

      if (!searchCoords) return;

      setMapBounds(boundsAround(searchCoords));

      const activeTypes = Object.entries(toggles)
        .filter(([, isActive]) => isActive)
        .map(([type]) => type as ServiceType);

      if (activeTypes.length === 0) return;

      const hasSpots = activeTypes.includes('camping');
      const hasFood = activeTypes.some((t) => t === 'restaurant' || t === 'supermarket');
      const hasServices = activeTypes.some((t) => t === 'gas' || t === 'laundry');
      const hasTourism = activeTypes.includes('tourism');

      if (hasSpots) searchBlockSpots(searchCoords);
      if (hasFood) searchBlockFood(searchCoords);
      if (hasServices) searchBlockServices(searchCoords);
      if (hasTourism) searchBlockTourism(searchCoords);

      activeTypes.forEach((type) => {
        const isBlockType =
          type === 'camping' ||
          type === 'restaurant' ||
          type === 'supermarket' ||
          type === 'gas' ||
          type === 'laundry' ||
          type === 'tourism';

        if (type !== 'custom' && type !== 'search' && type !== 'found' && !isBlockType) {
          searchPlaces(searchCoords, type);
        }
      });
    },
    [
      clearSearch,
      dailyItinerary,
      resetPlaces,
      searchBlockFood,
      searchBlockServices,
      searchBlockSpots,
      searchBlockTourism,
      searchPlaces,
      setHoveredPlace,
      setMapBounds,
      setSelectedDayIndex,
      toggles,
    ]
  );

  return { focusMapOnStage, handleSearchNearDay };
}
