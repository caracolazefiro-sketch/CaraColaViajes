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
  setDirectionsResponse?: React.Dispatch<React.SetStateAction<google.maps.DirectionsResult | null>>;
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  showToast: ShowToast;
  tripId?: string | null;
};

export function useStageAdjust<TForm extends TripFormData & { tripName?: string; etapas: string }>({
  results,
  setResults,
  setDirectionsResponse,
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

      const stripDecorations = (raw: string) =>
        String(raw ?? '')
          .replace('📍 Parada Táctica: ', '')
          .replace('📍 Parada de Pernocta: ', '')
          .split('|')[0]
          .trim();

      const coordsToParam = (c?: { lat: number; lng: number }) => (c ? `${c.lat},${c.lng}` : undefined);

      showToast('Recalculando ruta...', 'info');

      try {
        console.log('🔧 Ajustando día', adjustingDayIndex, 'a:', newDestination);

        const previousDestinationRaw = String(results.dailyItinerary[adjustingDayIndex]?.to ?? '');
        const previousDestination = stripDecorations(previousDestinationRaw);

        // 1. Actualizar la etapa ajustada en el itinerario local
        const updatedItinerary = [...results.dailyItinerary];
        updatedItinerary[adjustingDayIndex] = {
          ...updatedItinerary[adjustingDayIndex],
          to: newDestination,
          coordinates: newCoordinates,
        };

        const lastDrivingIndex = (() => {
          let last = -1;
          for (let i = 0; i < updatedItinerary.length; i++) {
            if (updatedItinerary[i]?.isDriving) last = i;
          }
          return last;
        })();

        // Caso importante: si el día ajustado es la ÚLTIMA etapa de conducción, normalmente el usuario
        // está cambiando el DESTINO del viaje (aunque luego haya días de estancia).
        // Si lo tratamos como waypoint, el itinerario queda incoherente.
        const isAdjustingLastDrivingStage = lastDrivingIndex !== -1 && adjustingDayIndex === lastDrivingIndex;

        // 2. Si es la última etapa, solo actualizar el destino final
        if (adjustingDayIndex === updatedItinerary.length - 1) {
          console.log('✅ Última etapa - solo actualizar destino');
          setResults({ ...results, dailyItinerary: updatedItinerary });
          // Si solo cambiamos el destino del día final, forzamos que el mapa no se quede con una ruta vieja.
          setDirectionsResponse?.(null);
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
          .map((s) => stripDecorations(s))
          .filter((s) => s.length > 0);

        // 🔧 Auto-heal: si `etapas` quedó contaminado por paradas de segmentación (p.ej. "Cáceres"),
        // eliminarlas antes de volver a llamar a Directions.
        // Usamos `dailyItinerary.type === 'tactical'` como señal fuerte de "no es waypoint obligatorio".
        const tacticalStops = new Set(
          (results.dailyItinerary || [])
            .filter((d) => d.type === 'tactical')
            .map((d) => stripDecorations(String(d.to ?? '')))
            .filter((s) => s.length > 0)
            .map((s) => normalizeForComparison(s))
        );
        if (tacticalStops.size > 0) {
          const before = waypointsFromForm;
          waypointsFromForm = waypointsFromForm.filter((wp) => {
            const key = normalizeForComparison(stripDecorations(String(wp)));
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

        const matchesLoosely = (a: string, b: string) => {
          const na = normalizeForComparison(stripDecorations(a));
          const nb = normalizeForComparison(stripDecorations(b));
          if (!na || !nb) return false;
          if (na === nb) return true;
          // Match por “parte ciudad” (antes de coma) para tolerar formatos distintos
          const ca = na.split(',')[0];
          const cb = nb.split(',')[0];
          return na.includes(cb) || nb.includes(ca) || ca === cb;
        };

        // Caso especial: si el usuario ajusta una parada táctica para "llegar ya" al DESTINO final,
        // NO debemos insertar el destino como waypoint, porque Google generará un último leg 0km (Destino→Destino).
        const approxEq = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) <= eps;
        const finalCoords = updatedItinerary[updatedItinerary.length - 1]?.coordinates;
        const isFinalDestinationByText = matchesLoosely(newDestination, formData.destino);
        const isFinalDestinationByCoords =
          !!finalCoords && approxEq(finalCoords.lat, newCoordinates.lat) && approxEq(finalCoords.lng, newCoordinates.lng);
        const isAdjustingToFinalDestination = isFinalDestinationByText || isFinalDestinationByCoords;

        // Si el usuario ya había intentado antes y el sistema dejó el nuevo destino mal colocado
        // (p.ej. Dax después de París), lo eliminamos primero para reinsertarlo en el sitio correcto.
        const beforeDedup = waypointsFromForm;
        waypointsFromForm = waypointsFromForm.filter((wp) => !matchesLoosely(wp, newDestination));
        if (beforeDedup.length !== waypointsFromForm.length) {
          console.log('🧹 Eliminando ocurrencias previas del nuevo destino en etapas:', {
            newDestination,
            before: beforeDedup,
            after: waypointsFromForm,
          });
        }

        const findFirstDayIndexForWaypoint = (wp: string) => {
          for (let i = 0; i < updatedItinerary.length; i++) {
            const d = updatedItinerary[i];
            if (!d) continue;
            if (matchesLoosely(String(d.to ?? ''), wp)) return i;
          }
          return -1;
        };

        const findWaypointIndex = (target: string) => {
          const normTarget = normalizeForComparison(stripDecorations(target));
          const cityPart = normTarget.split(',')[0];
          return waypointsFromForm.findIndex((wp) => {
            const normWp = normalizeForComparison(stripDecorations(wp));
            const wpCityPart = normWp.split(',')[0];
            return normWp.includes(cityPart) || normTarget.includes(wpCityPart);
          });
        };

        let updatedMandatoryWaypoints: string[];

        const previousWaypointIndex = findWaypointIndex(previousDestination);
        const isAdjustingTacticalStop = previousWaypointIndex === -1;
        if (previousWaypointIndex !== -1) {
          updatedMandatoryWaypoints = [...waypointsFromForm];
          updatedMandatoryWaypoints[previousWaypointIndex] = newDestination;
          console.log('  ✅ Reemplazando waypoint existente en índice', previousWaypointIndex);
        } else {
          console.log('  ℹ️ No se encontró el waypoint previo en formData.etapas; aplicando inserción fallback');

          if (isAdjustingToFinalDestination) {
            updatedMandatoryWaypoints = [...waypointsFromForm];
            console.log('  ✅ Ajuste hacia DESTINO final: no insertar waypoint (evita leg 0km).', {
              newDestination,
              destino: formData.destino,
              updatedMandatoryWaypoints,
            });
          } else {

          // ✅ Estrategia determinista (itinerario maestro):
          // Si el servidor nos marca en qué leg cae este día (entre qué paradas obligatorias),
          // insertamos el nuevo destino EXACTAMENTE en ese tramo.
          const dayMetaLegIndex = results.dailyItinerary?.[adjustingDayIndex]?.masterLegIndex;
          if (
            typeof dayMetaLegIndex === 'number' &&
            Number.isFinite(dayMetaLegIndex) &&
            results.dailyItinerary?.[adjustingDayIndex]?.type === 'tactical'
          ) {
            const insertIndex = Math.max(0, Math.min(waypointsFromForm.length, Math.trunc(dayMetaLegIndex)));
            updatedMandatoryWaypoints = [
              ...waypointsFromForm.slice(0, insertIndex),
              newDestination,
              ...waypointsFromForm.slice(insertIndex),
            ];
            console.log('  ✅ Insertando por masterLegIndex:', { dayMetaLegIndex, insertIndex, updatedMandatoryWaypoints });
          } else {

            // Fallback heurístico (solo si no tenemos meta del servidor)
            const forwardNextAnchor = (() => {
              const candidates = waypointsFromForm
                .map((wp, idx) => ({ wp, idx, dayIdx: findFirstDayIndexForWaypoint(wp) }))
                .filter((x) => x.dayIdx !== -1 && x.dayIdx > adjustingDayIndex)
                .sort((a, b) => a.dayIdx - b.dayIdx);
              return candidates[0] ?? null;
            })();

            console.log('🔍 DEBUG ÍNDICE (fallback táctico):', {
              adjustingDayIndex,
              waypointsFromForm,
              forwardNextAnchor,
            });

            if (forwardNextAnchor) {
              updatedMandatoryWaypoints = [
                ...waypointsFromForm.slice(0, forwardNextAnchor.idx),
                newDestination,
                ...waypointsFromForm.slice(forwardNextAnchor.idx),
              ];
              console.log('  ✅ Insertando antes del siguiente waypoint real:', {
                before: forwardNextAnchor.wp,
                idx: forwardNextAnchor.idx,
                dayIdx: forwardNextAnchor.dayIdx,
              });
            } else {
              updatedMandatoryWaypoints = [...waypointsFromForm, newDestination];
              console.log('  ⚠️ No encontrado waypoint ancla; agregando al final');
            }
          }
          }
        }

        console.log('📦 Waypoints después del ajuste:', updatedMandatoryWaypoints);

        // Si estamos ajustando la última etapa de conducción, este ajuste se interpreta como cambio de DESTINO.
        // Actualizamos formData.destino para mantener consistencia en UI/persistencia.
        if (isAdjustingLastDrivingStage) {
          setFormData((prev) => ({ ...prev, destino: newDestination }));
        }

        const firstDay = updatedItinerary[0];
        const originParam = coordsToParam(firstDay?.startCoordinates) || normalizeForGoogle(stripDecorations(formData.origen));

        const lastDay = updatedItinerary[updatedItinerary.length - 1];
        const destinationParam = isAdjustingLastDrivingStage
          ? coordsToParam(newCoordinates) || normalizeForGoogle(stripDecorations(newDestination))
          : coordsToParam(lastDay?.coordinates) || normalizeForGoogle(stripDecorations(formData.destino));

        const findCoordsForText = (text: string) => {
          const key = normalizeForComparison(stripDecorations(text));
          if (!key) return undefined;
          for (const d of updatedItinerary) {
            const cand = normalizeForComparison(stripDecorations(String(d.to ?? '')));
            if (!cand) continue;
            if (cand === key || cand.includes(key) || key.includes(cand)) {
              if (d.coordinates) return d.coordinates;
            }
          }
          return undefined;
        };

        const waypointLabelByCoords = new Map<string, string>();
        const normalizeCoordsKey = (raw: string) => String(raw).replace(/\s+/g, '');

        // Asegurar que ORIGEN/DESTINO también se traduzcan si Google devuelve "lat,lng".
        const originLabel = stripDecorations(formData.origen);
        const destinationLabel = stripDecorations(isAdjustingLastDrivingStage ? newDestination : formData.destino);
        if (originParam && coordsToParam(firstDay?.startCoordinates)) {
          waypointLabelByCoords.set(normalizeCoordsKey(originParam), originLabel);
        }
        if (destinationParam && coordsToParam(isAdjustingLastDrivingStage ? newCoordinates : lastDay?.coordinates)) {
          waypointLabelByCoords.set(normalizeCoordsKey(destinationParam), destinationLabel);
        }

        const normalizedWaypoints = updatedMandatoryWaypoints.map((wp) => {
          const cleanWp = stripDecorations(wp);

          if (wp === newDestination) {
            const coordParam = coordsToParam(newCoordinates);
            if (coordParam) waypointLabelByCoords.set(normalizeCoordsKey(coordParam), cleanWp);
            return coordParam || normalizeForGoogle(cleanWp);
          }

          const coords = findCoordsForText(wp);
          const coordParam = coordsToParam(coords);
          if (coordParam) waypointLabelByCoords.set(normalizeCoordsKey(coordParam), cleanWp);
          return coordParam || normalizeForGoogle(cleanWp);
        });

        console.log('📍 Ruta NUEVA a Google:');
        console.log(`  Origen: ${originParam}`);
        normalizedWaypoints.forEach((wp, i) => {
          console.log(`  Waypoint ${i + 1}: ${wp}`);
        });
        console.log(`  Destino: ${destinationParam}`);

        // PASO 3: Enviar a Google la ruta NUEVA
        const recalcResult = await getDirectionsAndCost({
          tripId: tripId ?? undefined,
          tripName: formData.tripName || '',
          origin: originParam,
          destination: destinationParam,
          waypoints: normalizedWaypoints,
          travel_mode: 'driving',
          kmMaximoDia: formData.kmMaximoDia,
          fechaInicio: results.dailyItinerary[0].isoDate || formData.fechaInicio,
          fechaRegreso: formData.fechaRegreso || '',
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
        const applyWaypointLabels = (it: typeof recalcResult.dailyItinerary) => {
          if (!it) return it;
          return it.map((d) => {
            const fromKey = normalizeCoordsKey(coordsToParam(d.startCoordinates) || stripDecorations(String(d.from ?? '')));
            const toKey = normalizeCoordsKey(coordsToParam(d.coordinates) || stripDecorations(String(d.to ?? '')));

            const mappedFrom = waypointLabelByCoords.get(fromKey);
            const mappedTo = waypointLabelByCoords.get(toKey);
            return {
              ...d,
              from: mappedFrom ?? d.from,
              to: mappedTo ?? d.to,
            };
          });
        };

        let finalItinerary = applyWaypointLabels(recalcResult.dailyItinerary);

        // ✅ Comportamiento “humano”: si el usuario ajusta una parada técnica del día N,
        // ese día N debe terminar en el nuevo destino (aunque supere kmMaximoDia),
        // y la segmentación continúa desde ahí.
        if (finalItinerary && isAdjustingTacticalStop) {
          // Coordenadas de Google pueden venir con redondeos distintos entre respuestas; toleramos un pequeño delta.
          const approxEq = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) <= eps;
          const looksLikeSameCoords = (c?: { lat: number; lng: number }) =>
            !!c && approxEq(c.lat, newCoordinates.lat) && approxEq(c.lng, newCoordinates.lng);

          const destKey = normalizeForComparison(stripDecorations(newDestination));

          const findReachIndex = () => {
            for (let i = 0; i < finalItinerary.length; i++) {
              const d = finalItinerary[i];
              if (!d?.isDriving) continue;
              if (looksLikeSameCoords(d.coordinates)) return i;

              const candKey = normalizeForComparison(stripDecorations(String(d.to ?? '')));
              if (destKey && candKey && (candKey === destKey || candKey.includes(destKey) || destKey.includes(candKey))) {
                return i;
              }

              const raw = stripDecorations(String(d.to ?? '')).replace(/\s+/g, '');
              const coordKey = normalizeCoordsKey(coordsToParam(newCoordinates) ?? '');
              if (coordKey && raw === coordKey) return i;
            }
            return -1;
          };

          const reachIdx = findReachIndex();
          if (reachIdx !== -1 && reachIdx > adjustingDayIndex) {
            const mergedSlice = finalItinerary.slice(adjustingDayIndex, reachIdx + 1);
            const first = mergedSlice[0];
            const totalKm = mergedSlice.reduce((acc, d) => acc + (Number(d.distance) || 0), 0);

            const mergedDay = {
              ...first,
              to: stripDecorations(newDestination),
              coordinates: { lat: newCoordinates.lat, lng: newCoordinates.lng },
              distance: totalKm,
              type: 'overnight' as const,
              masterKind: 'anchor' as const,
            };

            const nextDays = finalItinerary.slice(reachIdx + 1);
            finalItinerary = [...finalItinerary.slice(0, adjustingDayIndex), mergedDay, ...nextDays];

            // Reindexar días y fechas manteniendo la fecha de inicio del itinerario
            const start = new Date(finalItinerary[0].isoDate || formData.fechaInicio);
            const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const cursor = new Date(start);
            finalItinerary = finalItinerary.map((d, idx) => {
              const out = {
                ...d,
                day: idx + 1,
                date: fmt(cursor),
                isoDate: cursor.toISOString(),
              };
              cursor.setDate(cursor.getDate() + 1);
              return out;
            });

            console.log('🧩 Merge táctico→destino (ajuste de día):', { adjustingDayIndex, reachIdx, totalKm });
          }
        }

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
          // Si era cambio de destino, dejamos los waypoints obligatorios tal cual estaban.
          etapas: isAdjustingLastDrivingStage ? prev.etapas : updatedMandatoryWaypoints.join('|'),
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

        // 🔁 Importante: si hay un DirectionsResult client-side (DirectionsRenderer), el mapa prioriza eso.
        // Tras ajustar parada, lo reseteamos para que TripMap pinte el overviewPolyline nuevo del servidor.
        setDirectionsResponse?.(null);

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
    [adjustingDayIndex, closeAdjustModal, formData, results, setDirectionsResponse, setFormData, setResults, showToast, tripId]
  );

  return {
    adjustModalOpen,
    adjustingDayIndex,
    handleAdjustDay,
    handleConfirmAdjust,
    closeAdjustModal,
  };
}
