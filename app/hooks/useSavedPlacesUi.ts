import { useCallback } from 'react';
import type { PlaceWithDistance, TripResult } from '../types';
import type { ToastType } from './useToast';

type ShowToast = (message: string, type?: ToastType) => void;

type UseSavedPlacesUiParams = {
  selectedDayIndex: number | null;
  results: TripResult;
  setResults: (next: TripResult) => void;
  showToast: ShowToast;
};

export function useSavedPlacesUi({
  selectedDayIndex,
  results,
  setResults,
  showToast,
}: UseSavedPlacesUiParams) {
  const handleAddPlace = useCallback(
    (place: PlaceWithDistance) => {
      if (selectedDayIndex === null || !results.dailyItinerary) return;

      const updatedItinerary = [...results.dailyItinerary];
      const currentDay = updatedItinerary[selectedDayIndex];
      if (!currentDay.savedPlaces) currentDay.savedPlaces = [];

      if (currentDay.savedPlaces.some((p) => p.place_id === place.place_id)) {
        showToast(`"${place.name}" ya está guardado en este día`, 'warning');
        return;
      }

      const placeToAdd = place.type === 'search' || place.type === 'found'
        ? { ...place, isPublic: place.isPublic ?? false }
        : place;

      currentDay.savedPlaces.push(placeToAdd);
      setResults({ ...results, dailyItinerary: updatedItinerary });
      showToast(`"${place.name}" añadido correctamente`, 'success');
    },
    [results, selectedDayIndex, setResults, showToast]
  );

  const handleRemovePlace = useCallback(
    (placeId: string) => {
      if (selectedDayIndex === null || !results.dailyItinerary) return;

      const updatedItinerary = [...results.dailyItinerary];
      const currentDay = updatedItinerary[selectedDayIndex];
      if (currentDay.savedPlaces) {
        currentDay.savedPlaces = currentDay.savedPlaces.filter((p) => p.place_id !== placeId);
        setResults({ ...results, dailyItinerary: updatedItinerary });
      }
    },
    [results, selectedDayIndex, setResults]
  );

  return { handleAddPlace, handleRemovePlace };
}
