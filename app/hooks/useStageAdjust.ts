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

        const previousDestination = String(results.dailyItinerary[adjustingDayIndex]?.to ?? '');

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
        let waypointsFromForm = formData.etapas
          .split('|')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        // 🔧 Auto-heal: si `etapas` quedó contaminado por paradas de segmentación (p.ej. "Cáceres"),
        // eliminarlas antes de volver a llamar a Directions.
        // Usamos `dailyItinerary.type === 'tactical'` como señal fuerte de "no es waypoint obligatorio".
        const tacticalStops = new Set(
          (results.dailyItinerary || [])
            .filter((d) => d.type === 'tactical')
            .map((d) => String(d.to ?? '').replace('📍 Parada Táctica: ', '').split('|')[0].trim())
            .filter((s) => s.length > 0)
            .map((s) => normalizeForComparison(s))
        );
        if (tacticalStops.size > 0) {
          const before = waypointsFromForm;
          waypointsFromForm = waypointsFromForm.filter((wp) => {
            const key = normalizeForComparison(String(wp).replace('📍 Parada Táctica: ', '').split('|')[0].trim());
            return !tacticalStops.has(key);
          });
          if (before.length !== waypointsFromForm.length) {
            console.log('🧹 Limpiando etapas contaminadas (tácticas):', { before, after: waypointsFromForm });
          }
        }

        console.log('📦 Waypoints obligatorios (formData.etapas):', waypointsFromForm);

        // PASO 2: Actualizar lista de waypoints obligatorios
        // Caso A (normal): el día ajustado corresponde a un waypoint existente -> REEMPLAZAR.
        // Caso B (fallback): si no encontramos el waypoint (p.ej. era parada táctica), INSERTAR antes del siguiente waypoint.

        const findWaypointIndex = (target: string) => {
          const normTarget = normalizeForComparison(target);
          const cityPart = normTarget.split(',')[0];
          return waypointsFromForm.findIndex((wp) => {
            const normWp = normalizeForComparison(wp);
            const wpCityPart = normWp.split(',')[0];
            return normWp.includes(cityPart) || normTarget.includes(wpCityPart);
          });
        };

        let updatedMandatoryWaypoints: string[];

        const previousWaypointIndex = findWaypointIndex(previousDestination);
        if (previousWaypointIndex !== -1) {
          updatedMandatoryWaypoints = [...waypointsFromForm];
          updatedMandatoryWaypoints[previousWaypointIndex] = newDestination;
          console.log('  ✅ Reemplazando waypoint existente en índice', previousWaypointIndex);
        } else {
          console.log('  ℹ️ No se encontró el waypoint previo en formData.etapas; aplicando inserción fallback');

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

            const nextWaypointIndex = findWaypointIndex(String(nextDayDestination ?? ''));

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
          const err = String(recalcResult.error || 'No se pudo recalcular');
          const isZero = /ZERO_RESULTS/i.test(err);
          const isNotFound = /NOT_FOUND/i.test(err);
          if (isZero || isNotFound) {
            showToast(
              'No hay ruta válida con esa parada. Prueba otra sugerencia o usa la opción con país (ej: "Mérida, España").',
              'warning'
            );
          } else {
            showToast('Error: ' + err, 'error');
          }
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

        // PASO 5: ACTUALIZAR formData.etapas con los waypoints obligatorios del usuario.
        // Importante: NO inferir desde `finalItinerary` porque está segmentado y puede incluir ciudades intermedias
        // (ej: Cáceres) que NO son waypoints obligatorios.
        console.log('📝 Actualizando formData.etapas (waypoints obligatorios):', updatedMandatoryWaypoints);
        setFormData((prev) => ({
          ...prev,
          etapas: updatedMandatoryWaypoints.join('|'),
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
        closeAdjustModal();
      } catch (error) {
        console.error('💥 Error recalculando:', error);
        showToast(
          'Error al recalcular ruta: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          'error'
        );
      }
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
