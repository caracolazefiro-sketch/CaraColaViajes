import { useState, useCallback } from 'react';
import { DailyPlan } from '../types';

export interface MotorState {
  origen: string;
  destino: string;
  itinerary: DailyPlan[] | null;
  loading: boolean;
  error: string | null;
}

export function useMotor() {
  const [state, setState] = useState<MotorState>({
    origen: '',
    destino: '',
    itinerary: null,
    loading: false,
    error: null,
  });

  const setOrigen = useCallback((origen: string) => {
    setState(prev => ({ ...prev, origen }));
  }, []);

  const setDestino = useCallback((destino: string) => {
    setState(prev => ({ ...prev, destino }));
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
    if (!state.origen || !state.destino) {
      setError('Por favor completa origen y destino');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { getDirectionsAndCost } = await import('../actions');
      
      console.log('🚀 MOTOR: Calculando ruta');
      console.log('  Origen:', state.origen);
      console.log('  Destino:', state.destino);

      const result = await getDirectionsAndCost({
        origin: state.origen,
        destination: state.destino,
        waypoints: [],
        travel_mode: 'driving',
        kmMaximoDia: 300,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaRegreso: '',
      });

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
  }, [state.origen, state.destino, setError, setItinerary, setLoading]);

  return {
    state,
    setOrigen,
    setDestino,
    setItinerary,
    setLoading,
    setError,
    calculate,
    resetForm,
  };
}
