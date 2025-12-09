// ⚠️🚨 RED FLAG - CRITICAL FILE - VERSIÓN ESTABLE V1 - DO NOT MODIFY 🚨⚠️
// ✅ ESTA VERSIÓN FUNCIONA PERFECTAMENTE - NO TOCAR SIN BACKUP
// Este archivo gestiona el estado del MOTOR MVP.
// FUNCIONAMIENTO:
//   - Estado: origen, destino, debugResponse (servidor), segmentationData (cliente)
//   - segmentationData contiene puntos calculados del polyline con nombres de ciudades
//   - Este estado se usa para sincronizar mapa e itinerario
// Los valores por defecto (Salamanca → Paris) son críticos para el funcionamiento.
// Cualquier cambio en la estructura de estado puede romper los 3 mapas de comparación.
// ⚠️🚨 TESTEAR EXHAUSTIVAMENTE CUALQUIER CAMBIO 🚨⚠️
// Fecha estable: 06/12/2025

import { useState, useCallback } from 'react';
import { DailyPlan } from '../types';

export interface MotorState {
  origen: string;
  destino: string;
  fecha: string;
  kmMaximo: number;
  waypoints: string[]; // 🛏️ Pernoctas manuales
  showWaypoints: boolean; // Toggle UI
  extraDays: { [locationKey: string]: number }; // 🛏️ Días extra por ubicación (ej: "Madrid, Spain": 2)
  itinerary: DailyPlan[] | null;
  loading: boolean;
  error: string | null;
  debugRequest: { timestamp?: number; origin?: string; destination?: string; } | null;
  debugResponse: { dailyItinerary?: DailyPlan[]; status?: string; } | null;
  googleRawResponse: Record<string, unknown> | null;
  segmentationData: {
    points: Array<{
      lat: number;
      lng: number;
      day: number;
      distance: number;
      cityName?: string;
      cityCoordinates?: { lat: number; lng: number };
      realDistance?: number;
      isManualWaypoint?: boolean; // 🔵 Waypoint manual (sin alternativas)
      alternatives?: Array<{
        name: string;
        lat: number;
        lng: number;
        rating: number;
        userRatingsTotal: number;
        vicinity?: string;
        distanceFromOrigin: number;
        score: number;
      }>;
    }>;
    startCity: string;
    endCity: string;
  } | null;
}

export function useMotor() {
  const [state, setState] = useState<MotorState>({
    origen: '', // ⚠️ Vacío para evitar cálculo automático
    destino: '', // ⚠️ Vacío para evitar cálculo automático
    fecha: '2026-02-14',
    kmMaximo: 300,
    waypoints: [], // 🛏️ Sin pernoctas por defecto
    showWaypoints: true, // ✅ Abierto por defecto para mejor UX
    extraDays: {}, // 🛏️ Sin días extra por defecto
    itinerary: null,
    loading: false,
    error: null,
    debugRequest: null,
    debugResponse: null,
    googleRawResponse: null,
    segmentationData: null,
  });

  const setOrigen = useCallback((origen: string) => {
    setState(prev => ({ ...prev, origen }));
  }, []);

  const setDestino = useCallback((destino: string) => {
    setState(prev => ({ ...prev, destino }));
  }, []);

  const setFecha = useCallback((fecha: string) => {
    setState(prev => ({ ...prev, fecha }));
  }, []);

  const setKmMaximo = useCallback((kmMaximo: number) => {
    setState(prev => ({ ...prev, kmMaximo }));
  }, []);

  const setShowWaypoints = useCallback((showWaypoints: boolean) => {
    setState(prev => ({ ...prev, showWaypoints }));
  }, []);

  const addWaypoint = useCallback((waypoint: string) => {
    setState(prev => {
      // Normalizar y validar
      const normalized = waypoint.trim();
      if (!normalized || prev.waypoints.includes(normalized)) {
        return prev; // Vacío o duplicado
      }
      if (prev.waypoints.length >= 23) {
        console.warn('⚠️ Máximo 23 pernoctas (límite Google API)');
        return prev;
      }
      const newWaypoints = [...prev.waypoints, normalized];
      // Log DESPUÉS de actualizar estado
      setTimeout(() => console.log('🔵 Waypoint añadido:', normalized, '| Total:', newWaypoints.length), 0);
      return { ...prev, waypoints: newWaypoints };
    });
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index)
    }));
  }, []);

  const moveWaypointUp = useCallback((index: number) => {
    if (index === 0) return;
    setState(prev => {
      const waypoints = [...prev.waypoints];
      [waypoints[index], waypoints[index - 1]] = [waypoints[index - 1], waypoints[index]];
      return { ...prev, waypoints };
    });
  }, []);

  const moveWaypointDown = useCallback((index: number) => {
    setState(prev => {
      if (index === prev.waypoints.length - 1) return prev;
      const waypoints = [...prev.waypoints];
      [waypoints[index], waypoints[index + 1]] = [waypoints[index + 1], waypoints[index]];
      return { ...prev, waypoints };
    });
  }, []);

  const setItinerary = useCallback((itinerary: DailyPlan[] | null) => {
    setState(prev => ({ ...prev, itinerary }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setSegmentationData = useCallback((segmentationData: MotorState['segmentationData']) => {
    setState(prev => ({ ...prev, segmentationData }));
  }, []);

  const addExtraDay = useCallback((locationKey: string) => {
    setState(prev => ({
      ...prev,
      extraDays: {
        ...prev.extraDays,
        [locationKey]: (prev.extraDays[locationKey] || 0) + 1
      }
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      origen: '',
      destino: '',
      itinerary: null,
      loading: false,
      error: null,
    });
  }, []);

  const calculate = useCallback(async () => {
    // Log con JSON.stringify para ver el estado completo
    console.log('🎯 CALCULATE LLAMADO - waypoints en estado:', JSON.stringify(state.waypoints));
    console.log('🎯 CALCULATE LLAMADO - estado completo:', {
      origen: state.origen,
      destino: state.destino,
      waypoints: state.waypoints,
      kmMaximo: state.kmMaximo
    });

    if (!state.origen || !state.destino) {
      setError('Por favor completa origen y destino');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { getDirectionsAndCost } = await import('../actions');

      const requestData = {
        origin: state.origen,
        destination: state.destino,
        waypoints: state.waypoints, // 🛏️ Pernoctas manuales
        travel_mode: 'driving',
        kmMaximoDia: state.kmMaximo, // ✅ Usar kmMaximo del estado (no hardcoded 300)
        fechaInicio: state.fecha, // ✅ Usar fecha del usuario
        fechaRegreso: '',
      };

      // Guardar request en estado
      setState(prev => ({ ...prev, debugRequest: requestData }));

      console.log('🚀 MOTOR: Calculando ruta');
      console.log('  Origen:', state.origen);
      console.log('  Destino:', state.destino);
      console.log('  🛏️ Waypoints:', state.waypoints.length > 0 ? state.waypoints : 'Ninguno');
      console.log('  km/día:', state.kmMaximo);

      const result = await getDirectionsAndCost(requestData);

      // Guardar response en estado
      setState(prev => ({ ...prev, debugResponse: result, googleRawResponse: result.googleRawResponse }));

      if (result.error) {
        setError(result.error);
        console.error('❌ MOTOR Error:', result.error);
        if (result.debugLog) {
          console.log('📊 Debug Log:');
          result.debugLog.forEach(line => console.log('  ' + line));
        }
      } else {
        setItinerary(result.dailyItinerary || null);
        console.log('✅ MOTOR: Ruta calculada exitosamente');
        console.log('  Días:', result.dailyItinerary?.length);
        if (result.debugLog) {
          result.debugLog.forEach(line => console.log('  ' + line));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('❌ MOTOR Exception:', message);
    } finally {
      setLoading(false);
    }
  }, [state.origen, state.destino, state.waypoints, state.kmMaximo, setError, setItinerary, setLoading]);

  return {
    state,
    setOrigen,
    setDestino,
    setFecha,
    setKmMaximo,
    setShowWaypoints,
    addWaypoint,
    removeWaypoint,
    moveWaypointUp,
    moveWaypointDown,
    addExtraDay,
    setItinerary,
    setLoading,
    setError,
    setSegmentationData,
    calculate,
    resetForm,
  };
}
