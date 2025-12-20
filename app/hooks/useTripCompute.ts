import { useCallback, useRef } from 'react';
import type { ToastType } from './useToast';
import type { TripFormData } from './useTripCalculator';
import type { TripResult } from '../types';
import { getDirectionsAndCost } from '../actions';
import { normalizeForGoogle } from '../utils/googleNormalize';

type ShowToast = (message: string, type?: ToastType) => void;

type UseTripComputeParams<TForm extends TripFormData & { tripName: string; etapas: string }> = {
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  setResults: React.Dispatch<React.SetStateAction<TripResult>>;
  resetPlaces: () => void;
  calculateRoute: (formData: TripFormData) => void;
  setApiTripId: (tripId: string) => void;
  resetUi: () => void;
  showToast: ShowToast;
};

const computeTripName = (formData: { tripName?: string; origen: string; destino: string; fechaInicio: string }) => {
  if (formData.tripName) return formData.tripName;
  const origen = formData.origen.split(',')[0];
  const destino = formData.destino.split(',')[0];
  const fecha = new Date(formData.fechaInicio).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  return `${origen} → ${destino} (${fecha})`;
};

export function useTripCompute<TForm extends TripFormData & { tripName: string; etapas: string }>({
  formData,
  setFormData,
  setResults,
  resetPlaces,
  calculateRoute,
  setApiTripId,
  resetUi,
  showToast,
}: UseTripComputeParams<TForm>) {
  const computeSeqRef = useRef(0);

  const handleCalculateAll = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const seq = ++computeSeqRef.current;

      const tripIdForLogs = `trip-${Date.now()}`;
      setApiTripId(tripIdForLogs);

      const tripNameForLogs = computeTripName(formData);
      if (!formData.tripName) {
        setFormData((prev) => ({ ...prev, tripName: tripNameForLogs }));
      }

      resetUi();
      resetPlaces();

      // 1) UI (cliente): DirectionsRenderer con A/B
      calculateRoute(formData);

      // 2) Logs/caché (servidor)
      try {
        const normalizedWaypoints = (formData.etapas || '')
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
          .map(normalizeForGoogle);

        const res = await getDirectionsAndCost({
          tripId: tripIdForLogs,
          tripName: tripNameForLogs,
          origin: normalizeForGoogle(formData.origen),
          destination: normalizeForGoogle(formData.destino),
          waypoints: normalizedWaypoints,
          travel_mode: 'driving',
          kmMaximoDia: formData.kmMaximoDia,
          fechaInicio: formData.fechaInicio,
          fechaRegreso: formData.fechaRegreso,
        });

        // Si el usuario ha lanzado otro cálculo después, ignoramos este resultado
        if (computeSeqRef.current !== seq) return;

        if (res.error) {
          showToast('Servidor: ' + res.error, 'error');
        } else {
          // IMPORTANT: Update UI with server itinerary (includes durationMin/startCoordinates/overviewPolyline)
          const serverItinerary = res.dailyItinerary;
          if (serverItinerary?.length) {
            setResults((prev) => ({
              ...prev,
              dailyItinerary: serverItinerary,
              overviewPolyline: res.overviewPolyline ?? prev.overviewPolyline ?? null,
              totalDays: serverItinerary.length,
            }));
          }
          showToast('Ruta calculada y logs enviados', 'success');
        }
      } catch (err) {
        if (computeSeqRef.current !== seq) return;
        showToast('Error generando logs (servidor)', 'error');
        console.error(err);
      }
    },
    [calculateRoute, formData, resetPlaces, resetUi, setApiTripId, setFormData, setResults, showToast]
  );

  return { handleCalculateAll };
}
