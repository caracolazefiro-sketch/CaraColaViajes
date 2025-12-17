import { useCallback } from 'react';
import type { ToastType } from './useToast';
import type { TripFormData } from './useTripCalculator';
import { getDirectionsAndCost } from '../actions';

type ShowToast = (message: string, type?: ToastType) => void;

type UseTripComputeParams<TForm extends TripFormData & { tripName: string; etapas: string }> = {
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  resetPlaces: () => void;
  calculateRoute: (formData: TripFormData) => void;
  setApiTripId: (tripId: string) => void;
  resetUi: () => void;
  showToast: ShowToast;
};

const normalizeForGoogle = (text: string) => {
  const parts = text.split(',');
  const location = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : text.trim();
  return location.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  resetPlaces,
  calculateRoute,
  setApiTripId,
  resetUi,
  showToast,
}: UseTripComputeParams<TForm>) {
  const handleCalculateAll = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

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

        if (res.error) {
          showToast('Servidor: ' + res.error, 'error');
        } else {
          showToast('Ruta calculada y logs enviados', 'success');
        }
      } catch (err) {
        showToast('Error generando logs (servidor)', 'error');
        // eslint-disable-next-line no-console
        console.error(err);
      }
    },
    [calculateRoute, formData, resetPlaces, resetUi, setApiTripId, setFormData, showToast]
  );

  return { handleCalculateAll };
}
