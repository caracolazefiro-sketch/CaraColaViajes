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

type ItineraryDay = NonNullable<TripResult['dailyItinerary']>[number];

function getSavedPlacesUnsafe(day: unknown): unknown {
  if (!day || typeof day !== 'object') return undefined;
  if (!('savedPlaces' in day)) return undefined;
  return (day as { savedPlaces?: unknown }).savedPlaces;
}

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
  const [isRecalculating, setIsRecalculating] = useState(false);

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

      let didStartRecalc = false;

      const stripDecorations = (raw: string) =>
        String(raw ?? '')
          .replace('📍 Parada Táctica: ', '')
          .replace('📍 Parada de Pernocta: ', '')
          .split('|')[0]
          .trim();

      const coordsToParam = (c?: { lat: number; lng: number }) => (c ? `${c.lat},${c.lng}` : undefined);

      const parseCoordsParam = (raw: string): { lat: number; lng: number } | null => {
        const s = String(raw ?? '').replace(/\s+/g, '');
        const m = s.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (!m) return null;
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
      };

      const coordsKeyFromCoords = (c?: { lat: number; lng: number }, precision = 5) =>
        c ? `${c.lat.toFixed(precision)},${c.lng.toFixed(precision)}` : '';

      const approxEq = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) <= eps;

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

        // 3. Si es etapa intermedia, RECALCULAR SOLO DESDE EL DÍA AJUSTADO (prefijo inmutable)
        // Arquitectura:
        // 1) `formData.etapas` = fuente de verdad de paradas mandatory (visible y persistente)
        // 2) Insert/replace determinista en esa lista
        // 3) Recalcular Directions desde el inicio del día ajustado hasta destino final
        // 4) Mantener días anteriores intactos (incluyendo savedPlaces)

        console.log('🔄 Recalculando ruta PARCIAL desde el día ajustado (prefijo inmutable)');

        // PASO 1: Extraer waypoints OBLIGATORIOS desde formData.etapas
        let waypointsFromForm = formData.etapas
          .split('|')
          .map((s) => stripDecorations(s))
          .filter((s) => s.length > 0);

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
        const itineraryStartIso = updatedItinerary[0]?.isoDate || formData.fechaInicio;

        // Prefijo inmutable: días anteriores no se tocan
        const prefix = updatedItinerary.slice(0, adjustingDayIndex);
        const suffixStartDay = updatedItinerary[adjustingDayIndex];

        const suffixOriginParam =
          coordsToParam(suffixStartDay?.startCoordinates) ||
          coordsToParam(parseCoordsParam(String(suffixStartDay?.from ?? '')) ?? undefined) ||
          normalizeForGoogle(stripDecorations(String(suffixStartDay?.from ?? formData.origen)));

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

        const setCoordLabel = (coords: { lat: number; lng: number } | undefined, label: string) => {
          if (!coords) return;
          waypointLabelByCoords.set(coordsKeyFromCoords(coords, 5), label);
          waypointLabelByCoords.set(coordsKeyFromCoords(coords, 4), label);
        };

        // Asegurar que ORIGEN/DESTINO también se traduzcan si Google devuelve "lat,lng".
        // Ojo: cuando recalculamos un "sufijo" desde una etapa intermedia, el origen del sufijo
        // NO es el origen global del viaje (p.ej. día 2 empieza en Burgos, no en Madrid).
        const originLabel = stripDecorations(formData.origen);
        const suffixOriginLabel = stripDecorations(String(suffixStartDay?.from ?? formData.origen));
        const destinationLabel = stripDecorations(isAdjustingLastDrivingStage ? newDestination : formData.destino);
        setCoordLabel(firstDay?.startCoordinates, originLabel);
        setCoordLabel(suffixStartDay?.startCoordinates, suffixOriginLabel);
        setCoordLabel(isAdjustingLastDrivingStage ? newCoordinates : lastDay?.coordinates, destinationLabel);
        if (suffixOriginParam) {
          waypointLabelByCoords.set(
            normalizeCoordsKey(suffixOriginParam),
            adjustingDayIndex === 0 ? originLabel : suffixOriginLabel
          );
        }
        if (destinationParam) waypointLabelByCoords.set(normalizeCoordsKey(destinationParam), destinationLabel);

        const normalizedWaypoints = updatedMandatoryWaypoints.map((wp) => {
          const cleanWp = stripDecorations(wp);

          if (wp === newDestination) {
            const coordParam = coordsToParam(newCoordinates);
            setCoordLabel(newCoordinates, cleanWp);
            if (coordParam) waypointLabelByCoords.set(normalizeCoordsKey(coordParam), cleanWp);
            return coordParam || normalizeForGoogle(cleanWp);
          }

          const coords = findCoordsForText(wp);
          const coordParam = coordsToParam(coords);
          setCoordLabel(coords, cleanWp);
          if (coordParam) waypointLabelByCoords.set(normalizeCoordsKey(coordParam), cleanWp);
          return coordParam || normalizeForGoogle(cleanWp);
        });

        console.log('📍 Ruta NUEVA a Google:');
        console.log(`  Origen: ${suffixOriginParam}`);
        normalizedWaypoints.forEach((wp, i) => {
          console.log(`  Waypoint ${i + 1}: ${wp}`);
        });
        console.log(`  Destino: ${destinationParam}`);

        const legIndexForDay = (() => {
          const meta = results.dailyItinerary?.[adjustingDayIndex]?.masterLegIndex;
          if (typeof meta === 'number' && Number.isFinite(meta)) return Math.max(0, Math.trunc(meta));
          // Fallback: si el destino previo era un waypoint mandatory, el leg es el índice de ese waypoint.
          if (previousWaypointIndex !== -1) return Math.max(0, previousWaypointIndex);
          return 0;
        })();

        // Waypoints restantes desde el leg del día ajustado hacia adelante.
        // Ej: legIndex=0 => incluye wp0; legIndex=1 => incluye wp1...
        const normalizedSuffixWaypoints = normalizedWaypoints.slice(Math.max(0, Math.min(normalizedWaypoints.length, legIndexForDay)));

        // PASO 3: Enviar a Google la ruta NUEVA
        didStartRecalc = true;
        setIsRecalculating(true);
        const recalcResult = await getDirectionsAndCost({
          tripId: tripId ?? undefined,
          tripName: formData.tripName || '',
          origin: suffixOriginParam,
          destination: destinationParam,
          waypoints: normalizedSuffixWaypoints,
          travel_mode: 'driving',
          kmMaximoDia: formData.kmMaximoDia,
          fechaInicio: suffixStartDay?.isoDate || formData.fechaInicio,
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
            const fromCoords = d.startCoordinates ?? parseCoordsParam(String(d.from ?? '')) ?? undefined;
            const toCoords = d.coordinates ?? parseCoordsParam(String(d.to ?? '')) ?? undefined;

            const fromKey =
              coordsKeyFromCoords(fromCoords, 5) ||
              coordsKeyFromCoords(fromCoords, 4) ||
              normalizeCoordsKey(stripDecorations(String(d.from ?? '')));
            const toKey =
              coordsKeyFromCoords(toCoords, 5) ||
              coordsKeyFromCoords(toCoords, 4) ||
              normalizeCoordsKey(stripDecorations(String(d.to ?? '')));

            const mappedFrom = waypointLabelByCoords.get(fromKey);
            const mappedTo = waypointLabelByCoords.get(toKey);
            return {
              ...d,
              from: mappedFrom ?? d.from,
              to: mappedTo ?? d.to,
            };
          });
        };

        let finalSuffixItinerary = applyWaypointLabels(recalcResult.dailyItinerary);

        // ✅ Comportamiento “humano”: si el usuario ajusta una parada técnica del día N,
        // ese día N debe terminar en el nuevo destino (aunque supere kmMaximoDia),
        // y la segmentación continúa desde ahí.
        if (finalSuffixItinerary && isAdjustingTacticalStop) {
          // Coordenadas de Google pueden venir con redondeos distintos entre respuestas; toleramos un pequeño delta.
          const looksLikeSameCoords = (c?: { lat: number; lng: number }) =>
            !!c && approxEq(c.lat, newCoordinates.lat) && approxEq(c.lng, newCoordinates.lng);

          const destKey = normalizeForComparison(stripDecorations(newDestination));

          // La respuesta del servidor empieza en el día ajustado (día 0 del sufijo).
          const oldDay = results.dailyItinerary?.[adjustingDayIndex];
          const oldToKey = normalizeForComparison(stripDecorations(String(oldDay?.to ?? '')));
          const oldEndCoords = oldDay?.coordinates;

          const findMergeStartIndex = () => {
            if (oldEndCoords) {
              for (let i = 0; i < finalSuffixItinerary.length; i++) {
                const d = finalSuffixItinerary[i];
                if (!d?.isDriving || !d.coordinates) continue;
                if (approxEq(d.coordinates.lat, oldEndCoords.lat) && approxEq(d.coordinates.lng, oldEndCoords.lng)) return i;
              }
            }
            if (oldToKey) {
              for (let i = 0; i < finalSuffixItinerary.length; i++) {
                const d = finalSuffixItinerary[i];
                if (!d?.isDriving) continue;
                const candKey = normalizeForComparison(stripDecorations(String(d.to ?? '')));
                if (candKey && (candKey === oldToKey || candKey.includes(oldToKey) || oldToKey.includes(candKey))) return i;
              }
            }
            return 0;
          };

          const mergeStartIdx = findMergeStartIndex();

          const findReachIndex = () => {
            for (let i = 0; i < finalSuffixItinerary.length; i++) {
              const d = finalSuffixItinerary[i];
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
          if (reachIdx !== -1 && reachIdx > mergeStartIdx) {
            const mergedSlice = finalSuffixItinerary.slice(mergeStartIdx, reachIdx + 1);
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

            const nextDays = finalSuffixItinerary.slice(reachIdx + 1);

            // Fix crítico: tras el merge, el día siguiente debe arrancar desde el nuevo destino.
            if (nextDays.length > 0) {
              const next0 = nextDays[0];
              nextDays[0] = {
                ...next0,
                from: stripDecorations(newDestination),
                startCoordinates: { lat: newCoordinates.lat, lng: newCoordinates.lng },
              };
            }

            finalSuffixItinerary = [...finalSuffixItinerary.slice(0, mergeStartIdx), mergedDay, ...nextDays];

            console.log('🧩 Merge táctico→destino (ajuste de día):', {
              adjustingDayIndex,
              mergeStartIdx,
              reachIdx,
              totalKm,
              oldTo: oldDay?.to,
              newTo: newDestination,
            });
          }
        }

        console.log('📊 Sufijo final (segmentado en servidor):', finalSuffixItinerary?.length || 0, 'días');

        // PASO 5: ACTUALIZAR formData.etapas con los waypoints obligatorios del usuario.
        // Importante: NO inferir desde `finalItinerary` porque está segmentado y puede incluir ciudades intermedias
        // (ej: Cáceres) que NO son waypoints obligatorios.
        console.log('📝 Actualizando formData.etapas (waypoints obligatorios):', updatedMandatoryWaypoints);
        setFormData((prev) => ({
          ...prev,
          // Si era cambio de destino, dejamos los waypoints obligatorios tal cual estaban.
          etapas: isAdjustingLastDrivingStage ? prev.etapas : updatedMandatoryWaypoints.join('|'),
        }));

        // Unir prefijo (inmutable) + sufijo recalculado, reindexando días/fechas.
        const combinedRaw = [...prefix, ...(finalSuffixItinerary || [])];

        // Preservar savedPlaces del prefijo (y best-effort del sufijo si isoDate coincide)
        const savedByIso = new Map<string, unknown>();
        for (const d of results.dailyItinerary || []) {
          const saved = getSavedPlacesUnsafe(d);
          if (d?.isoDate && saved != null) savedByIso.set(String(d.isoDate), saved);
        }

        const startIso = itineraryStartIso;
        const start = new Date(startIso);
        const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const cursor = new Date(start);
        const combined = combinedRaw.map((d, idx) => {
          const isoDate = cursor.toISOString();
          const currentSaved = getSavedPlacesUnsafe(d);
          const preservedSaved = idx < prefix.length ? currentSaved : (savedByIso.get(isoDate) ?? currentSaved);
          const out: ItineraryDay = {
            ...d,
            day: idx + 1,
            date: fmt(cursor),
            isoDate,
            savedPlaces: preservedSaved,
          } as unknown as ItineraryDay;
          cursor.setDate(cursor.getDate() + 1);
          return out;
        });

        const combinedDistanceKm = combined.reduce((acc, d) => acc + (Number(d?.distance) || 0), 0);

        const nextDistanceKm =
          combinedDistanceKm > 0
            ? combinedDistanceKm
            : recalcResult.distanceKm != null
              ? recalcResult.distanceKm
              : results.distanceKm;
        const nextLiters =
          nextDistanceKm != null
            ? (nextDistanceKm * formData.consumo) / 100
            : results.liters != null
              ? results.liters
              : null;
        const nextTotalCost =
          nextDistanceKm != null && typeof nextLiters === 'number'
            ? nextLiters * formData.precioGasoil
            : results.totalCost;

        setResults({
          ...results,
          totalDays: combined?.length || null,
          distanceKm: nextDistanceKm,
          liters: nextLiters,
          totalCost: nextTotalCost,
          overviewPolyline: recalcResult.overviewPolyline ?? results.overviewPolyline ?? null,
          dailyItinerary: combined,
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
      } finally {
        if (didStartRecalc) setIsRecalculating(false);
      }
    },
    [adjustingDayIndex, closeAdjustModal, formData, results, setDirectionsResponse, setFormData, setResults, showToast, tripId]
  );

  return {
    adjustModalOpen,
    adjustingDayIndex,
    isRecalculating,
    handleAdjustDay,
    handleConfirmAdjust,
    closeAdjustModal,
  };
}
