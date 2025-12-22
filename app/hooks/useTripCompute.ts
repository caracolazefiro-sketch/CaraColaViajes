import { useCallback, useRef } from 'react';
import type { ToastType } from './useToast';
import type { TripFormData } from './useTripCalculator';
import type { TripResult } from '../types';
import { getDirectionsAndCost } from '../actions';
import { normalizeForGoogle } from '../utils/googleNormalize';
import { getOrCreateClientId } from '../utils/client-id';

type ShowToast = (message: string, type?: ToastType) => void;

type UseTripComputeParams<TForm extends TripFormData & { tripName: string; etapas: string }> = {
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  setResults: React.Dispatch<React.SetStateAction<TripResult>>;
  resetPlaces: () => void;
  setLoading: (v: boolean) => void;
  setDirectionsResponse?: React.Dispatch<React.SetStateAction<google.maps.DirectionsResult | null>>;
  setApiTripId: (tripId: string) => void;
  resetUi: () => void;
  showToast: ShowToast;
  authToken?: string | null;
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
  setLoading,
  setDirectionsResponse,
  setApiTripId,
  resetUi,
  showToast,
  authToken,
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

      // UI: bloquear mientras calculamos (todo server-side)
      setLoading(true);
      setDirectionsResponse?.(null);

      // Logs/caché (servidor)
      try {
        const normalizedWaypoints = (formData.etapas || '')
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
          .map(normalizeForGoogle);

        const clientId = getOrCreateClientId();

        const res = await getDirectionsAndCost({
          tripId: tripIdForLogs,
          tripName: tripNameForLogs,
          clientId,
          authToken: authToken || undefined,
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
          setResults((prev) => ({ ...prev, error: res.error || 'Error servidor' }));
        } else {
          // IMPORTANT: Update UI with server itinerary (includes durationMin/startCoordinates/overviewPolyline)
          const serverItinerary = res.dailyItinerary;
          const distanceKmMetric = typeof res.distanceKm === 'number' && Number.isFinite(res.distanceKm) ? res.distanceKm : null;
          const distanceForCalc = distanceKmMetric ?? (serverItinerary?.reduce((sum, d) => sum + (d?.distance || 0), 0) ?? 0);

          // Keep legacy behavior: distanceKm/liters/totalCost are "user unit" derived via converter elsewhere.
          const distanceUserUnit = distanceForCalc;
          const litersUserUnit = (distanceUserUnit / 100) * (formData.consumo || 0);
          const costUserUnit = litersUserUnit * (formData.precioGasoil || 0);

          setResults((prev) => ({
            ...prev,
            error: null,
            dailyItinerary: serverItinerary ?? prev.dailyItinerary,
            overviewPolyline: res.overviewPolyline ?? prev.overviewPolyline ?? null,
            totalDays: serverItinerary?.length ?? prev.totalDays,
            distanceKm: distanceUserUnit,
            liters: litersUserUnit,
            totalCost: costUserUnit,
          }));

          showToast('Ruta calculada y logs enviados', 'success');
        }
      } catch (err) {
        if (computeSeqRef.current !== seq) return;
        showToast('Error generando logs (servidor)', 'error');
        console.error(err);
        setResults((prev) => ({ ...prev, error: 'Error generando logs (servidor)' }));
      } finally {
        if (computeSeqRef.current === seq) {
          setLoading(false);
        }
      }
    },
    [formData, resetPlaces, resetUi, setApiTripId, setDirectionsResponse, setFormData, setLoading, setResults, showToast, authToken]
  );

  return { handleCalculateAll };
}
