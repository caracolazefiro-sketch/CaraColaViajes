import { useState } from 'react';
import { PlaceWithDistance } from '../types';

export type SortOption = 'score' | 'distance' | 'rating';

export interface SearchFilters {
  minRating: number;
  searchRadius: number;
  sortBy: SortOption;
}

const SEARCH_RADIUS_MIN_KM = 5;
const SEARCH_RADIUS_MAX_KM = 25;

// 🔥 FUNCIÓN PURA (sin dependencias de hook): Usa parámetros explícitos
export const filterAndSort = (
  places: PlaceWithDistance[],
  minRating: number,
  searchRadius: number,
  sortBy: SortOption
): PlaceWithDistance[] => {
  if (!places || places.length === 0) return [];

  const MAX_RESULTS_PER_CATEGORY = 20;

  const effectiveRadiusKm = Math.min(
    SEARCH_RADIUS_MAX_KM,
    Math.max(SEARCH_RADIUS_MIN_KM, Number.isFinite(searchRadius) ? searchRadius : SEARCH_RADIUS_MAX_KM)
  );

  // 1️⃣ FILTRAR por rating mínimo (descartar < minRating)
  let filtered = places.filter(place => {
    const isAreasAc = typeof place.place_id === 'string' && place.place_id.startsWith('areasac:');
    const rating = typeof place.rating === 'number' ? place.rating : null;
    // AreasAC (dataset propio) puede no tener rating: no lo descartamos por minRating.
    if (rating == null) return isAreasAc ? true : minRating <= 0;
    return rating >= minRating;
  });

  // 2️⃣ FILTRAR por radio (descartar > searchRadius)
  filtered = filtered.filter(place => {
    const distanceKm = (place.distanceFromCenter || 0) / 1000;
    return distanceKm <= effectiveRadiusKm;
  });

  // 3️⃣ ORDENAR según sortBy
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0);
    } else if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else {
      // 'score' es el default
      return (b.score || 0) - (a.score || 0);
    }
  });

  return sorted.slice(0, MAX_RESULTS_PER_CATEGORY);
};

export const useSearchFilters = () => {
  const [minRating, setMinRating] = useState(0);
  const [searchRadius, _setSearchRadius] = useState(SEARCH_RADIUS_MAX_KM);
  const [sortBy, setSortBy] = useState<SortOption>('score');

  const setSearchRadius = (next: number) => {
    const safe = Math.min(
      SEARCH_RADIUS_MAX_KM,
      Math.max(SEARCH_RADIUS_MIN_KM, Number.isFinite(next) ? next : SEARCH_RADIUS_MAX_KM)
    );
    _setSearchRadius(safe);
  };

  // Función envolvente que usa los estados del hook
  const filterAndSortWithHookState = (places: PlaceWithDistance[]): PlaceWithDistance[] => {
    return filterAndSort(places, minRating, searchRadius, sortBy);
  };

  return {
    minRating,
    setMinRating,
    searchRadius,
    setSearchRadius,
    sortBy,
    setSortBy,
    filterAndSort: filterAndSortWithHookState,
  };
};
