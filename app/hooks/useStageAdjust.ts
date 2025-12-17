import { useCallback, useState } from 'react';
import type { TripFormData } from './useTripCalculator';
import type { ToastType } from './useToast';
import type { TripResult } from '../types';
import { getDirectionsAndCost } from '../actions';
import { normalizeForComparison, normalizeForGoogle } from '../utils/googleNormalize';

type ShowToast = (message: string, type?: ToastType) => void;

type UseStageAdjustParams<TForm extends TripFormData & { tripName?: string; etapas: string }> = {
  results: TripResult;
  setResults: React.Dispatch<React.SetStateAction<TripResult>>;
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  showToast: ShowToast;
  tripId?: string | null;
};

export function useStageAdjust<TForm extends TripFormData & { tripName?: string; etapas: string }>({
  results,
  setResults,
  formData,
  setFormData,
  showToast,
  tripId,
}: UseStageAdjustParams<TForm>) {
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingDayIndex, setAdjustingDayIndex] = useState<number | null>(null);

  const handleAdjustDay = useCallback((dayIndex: number) => {
    setAdjustingDayIndex(dayIndex);
    setAdjustModalOpen(true);
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustModalOpen(false);
    setAdjustingDayIndex(null);
  }, []);

  const handleConfirmAdjust = useCallback(
    async (newDestination: string, newCoordinates: { lat: number; lng: number }) => {
      if (adjustingDayIndex === null || !results.dailyItinerary) return;

      showToast('Recalculando ruta...', 'info');

      try {
        console.log('🔧 Ajustando día', adjustingDayIndex, 'a:', newDestination);

        // 1. Actualizar la etapa ajustada en el itinerario local
        const updatedItinerary = [...results.dailyItinerary];
        updatedItinerary[adjustingDayIndex] = {
          ...updatedItinerary[adjustingDayIndex],
          to: newDestination,
          coordinates: newCoordinates,
        };

        // 2. Si es la última etapa, solo actualizar el destino final
        if (adjustingDayIndex === updatedItinerary.length - 1) {
          console.log('✅ Última etapa - solo actualizar destino');
          setResults({ ...results, dailyItinerary: updatedItinerary });
          showToast('Parada actualizada correctamente', 'success');
          closeAdjustModal();
          return;
        }

        // 3. Si es etapa intermedia, RECALCULAR LA RUTA COMPLETA
        // Arquitectura correcta:
        // 1. Extraer waypoints OBLIGATORIOS desde formData.etapas
        // 2. Reemplazar el ajustado con newDestination
        // 3. Enviar a Google: Origin → Obligatorios → Destino
        // 4. Regenerar itinerario DESDE CERO
        // 5. Actualizar formData.etapas con nuevos waypoints

        console.log('🔄 Recalculando ruta COMPLETA desde origen original');

        // PASO 1: Extraer waypoints OBLIGATORIOS desde formData.etapas
        const waypointsFromForm = formData.etapas
          .split('|')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        console.log('📦 Waypoints obligatorios (formData.etapas):', waypointsFromForm);

        // PASO 2: INSERTAR en el índice correcto
        // Lógica: El usuario ajusta un día intermedio
        // Ese día tiene un destino ESPERADO (parada táctica o waypoint)
        // El siguiente día tiene el SIGUIENTE WAYPOINT REAL
        // Insertar el nuevo destino ANTES del siguiente waypoint

        let updatedMandatoryWaypoints: string[];

        if (adjustingDayIndex < updatedItinerary.length - 1) {
          // No es la última etapa, buscar el siguiente waypoint real
          const nextDayDestination = updatedItinerary[adjustingDayIndex + 1].to;

          console.log('🔍 DEBUG ÍNDICE:');
          console.log('  adjustingDayIndex:', adjustingDayIndex);
          console.log('  updatedItinerary.length:', updatedItinerary.length);
          console.log('  updatedItinerary[adjustingDayIndex]:', updatedItinerary[adjustingDayIndex]);
          console.log('  updatedItinerary[adjustingDayIndex + 1]:', updatedItinerary[adjustingDayIndex + 1]);
          console.log('  nextDayDestination:', nextDayDestination);
          console.log('  waypointsFromForm:', waypointsFromForm);

          // Buscar dónde está ese waypoint en formData.etapas (normalizando acentos)
          const normalizedNextDest = normalizeForComparison(nextDayDestination);
          const nextWaypointIndex = waypointsFromForm.findIndex((wp) => {
            const normalizedWp = normalizeForComparison(wp);
            const cityPart = normalizedNextDest.split(',')[0];
            return normalizedWp.includes(cityPart) || normalizedNextDest.includes(normalizedWp.split(',')[0]);
          });

          console.log('  nextWaypointIndex encontrado:', nextWaypointIndex);

          if (nextWaypointIndex !== -1) {
            // Insertar ANTES del siguiente waypoint
            updatedMandatoryWaypoints = [
              ...waypointsFromForm.slice(0, nextWaypointIndex),
              newDestination,
              ...waypointsFromForm.slice(nextWaypointIndex),
            ];
            console.log('  ✅ Insertando en índice', nextWaypointIndex);
          } else {
            // Si no encontramos el siguiente waypoint, agregar al final
            updatedMandatoryWaypoints = [...waypointsFromForm, newDestination];
            console.log('  ⚠️ No encontrado, agregando al final');
          }
        } else {
          // Si es la última etapa, agregar al final
          updatedMandatoryWaypoints = [...waypointsFromForm, newDestination];
          console.log('  📌 Última etapa, agregando al final');
        }

        console.log('📦 Waypoints después del ajuste:', updatedMandatoryWaypoints);

        const originCityName = normalizeForGoogle(formData.origen);
        const destCityName = normalizeForGoogle(formData.destino);
        const normalizedWaypoints = updatedMandatoryWaypoints.map((wp) => normalizeForGoogle(wp));

        console.log('📍 Ruta NUEVA a Google:');
        console.log(`  Origen: ${originCityName}`);
        normalizedWaypoints.forEach((wp, i) => {
          console.log(`  Waypoint ${i + 1}: ${wp}`);
        });
        console.log(`  Destino: ${destCityName}`);

        // PASO 3: Enviar a Google la ruta NUEVA
        const recalcResult = await getDirectionsAndCost({
          tripId: tripId ?? undefined,
          tripName: formData.tripName || '',
          origin: originCityName,
          destination: destCityName,
          waypoints: normalizedWaypoints,
          travel_mode: 'driving',
          kmMaximoDia: formData.kmMaximoDia,
          fechaInicio: results.dailyItinerary[0].isoDate || formData.fechaInicio,
          fechaRegreso: '',
        });

        if (recalcResult.error || !recalcResult.dailyItinerary) {
          console.error('❌ Error recalculando:', recalcResult.error);
          if (recalcResult.debugLog) {
            console.log('📊 Server Debug Log:');
            recalcResult.debugLog.forEach((line: string) => {
              console.log(line);
            });
          }
          showToast('Error: ' + (recalcResult.error || 'No se pudo recalcular'), 'error');
          closeAdjustModal();
          return;
        }

        console.log('✅ Recalculado exitosamente. Itinerario nuevo:');
        if (recalcResult.debugLog) {
          recalcResult.debugLog.forEach((line: string) => {
            console.log(line);
          });
        }

        // PASO 4: El itinerario ya viene COMPLETO desde el servidor
        // (incluyendo segmentación de 300 km/día con localidades reales)
        // No necesitamos fusionar con días anteriores
        const finalItinerary = recalcResult.dailyItinerary;

        console.log(
          '📊 Itinerario final (regenerado desde cero, segmentado en servidor):',
          finalItinerary.length,
          'días'
        );
        console.log('📊 Itinerario después de segmentación:', finalItinerary.length, 'días');

        // PASO 5: ACTUALIZAR formData.etapas con los waypoints obligatorios
        // Extraer waypoints obligatorios del itinerario nuevo
        const obligatoryWaypoints = finalItinerary
          .slice(0, -1) // Excluir último día (destino)
          .filter((day: { to?: string }) => !String(day.to ?? '').includes('📍 Parada Táctica'))
          .map((day: { to?: string }) => String(day.to ?? ''));

        console.log('📝 Actualizando formData.etapas:', obligatoryWaypoints);

        setFormData((prev) => ({
          ...prev,
          etapas: obligatoryWaypoints.join('|'),
        }));

        setResults({
          ...results,
          totalDays: finalItinerary?.length || null,
          distanceKm: recalcResult.distanceKm ?? results.distanceKm,
          liters:
            recalcResult.distanceKm != null
              ? (recalcResult.distanceKm * formData.consumo) / 100
              : results.liters,
          totalCost:
            recalcResult.distanceKm != null
              ? ((recalcResult.distanceKm * formData.consumo) / 100) * formData.precioGasoil
              : results.totalCost,
          overviewPolyline: recalcResult.overviewPolyline ?? results.overviewPolyline ?? null,
          dailyItinerary: finalItinerary,
        });

        showToast('Ruta recalculada correctamente', 'success');
      } catch (error) {
        console.error('💥 Error recalculando:', error);
        showToast(
          'Error al recalcular ruta: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          'error'
        );
      }

      closeAdjustModal();
    },
    [adjustingDayIndex, closeAdjustModal, formData, results, setFormData, setResults, showToast, tripId]
  );

  return {
    adjustModalOpen,
    adjustingDayIndex,
    handleAdjustDay,
    handleConfirmAdjust,
    closeAdjustModal,
  };
}
