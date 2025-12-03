import { useState, useMemo } from 'react';
import { PlaceWithDistance } from '../types';

export type SortOption = 'score' | 'distance' | 'rating';

export interface SearchFilters {
  minRating: number;
  searchRadius: number;
  sortBy: SortOption;
}

export const useSearchFilters = () => {
  const [minRating, setMinRating] = useState(0);
  const [searchRadius, setSearchRadius] = useState(20);
  const [sortBy, setSortBy] = useState<SortOption>('score');

  // Filtrar y ordenar lugares
  const filterAndSort = (places: PlaceWithDistance[]): PlaceWithDistance[] => {
    if (!places || places.length === 0) return [];

    // 1️⃣ FILTRAR por rating mínimo (descartar < minRating)
    let filtered = places.filter(place => {
      const rating = place.rating || 0;
      return rating >= minRating;
    });

    // 2️⃣ FILTRAR por radio (descartar > searchRadius)
    filtered = filtered.filter(place => {
      const distanceKm = (place.distanceFromCenter || 0) / 1000;
      return distanceKm <= searchRadius;
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

    return sorted;
  };

  return {
    minRating,
    setMinRating,
    searchRadius,
    setSearchRadius,
    sortBy,
    setSortBy,
    filterAndSort,
  };
};
