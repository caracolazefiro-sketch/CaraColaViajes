'use client';

import { useState } from 'react';
import { DailyPlan } from '@/app/types';

interface MotorState {
  origen: string;
  destino: string;
  itinerary: DailyPlan[] | null;
  loading: boolean;
  error: string | null;
  logs: string[];
}

export function useMotor() {
  const [state, setState] = useState<MotorState>({
    origen: '',
    destino: '',
    itinerary: null,
    loading: false,
    error: null,
    logs: []
  });

  const addLog = (message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
    console.log(message);
  };

  const setOrigen = (value: string) => {
    setState(prev => ({ ...prev, origen: value }));
    addLog(`📍 Origen: ${value}`);
  };

  const setDestino = (value: string) => {
    setState(prev => ({ ...prev, destino: value }));
    addLog(`🎯 Destino: ${value}`);
  };

  const calcularRuta = async () => {
    if (!state.origen || !state.destino) {
      const err = 'Origen y Destino son requeridos';
      setState(prev => ({ ...prev, error: err }));
      addLog(`❌ Error: ${err}`);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    addLog(`⏳ Calculando ruta: ${state.origen} → ${state.destino}`);

    try {
      const { getDirectionsAndCost } = await import('@/app/actions');
      
      addLog(`🔗 Llamando Google Directions API...`);
      const result = await getDirectionsAndCost({
        origin: state.origen,
        destination: state.destino,
        waypoints: [],
        travel_mode: 'driving',
        kmMaximoDia: 300,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaRegreso: ''
      });

      if (result.error) {
        throw new Error(result.error);
      }

      addLog(`✅ Ruta calculada exitosamente`);
      if (result.debugLog) {
        result.debugLog.forEach(log => addLog(log));
      }

      setState(prev => ({
        ...prev,
        itinerary: result.dailyItinerary || null,
        loading: false
      }));

      addLog(`📊 Itinerario: ${result.dailyItinerary?.length || 0} días`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Error desconocido';
      setState(prev => ({ ...prev, error, loading: false }));
      addLog(`❌ Error: ${error}`);
    }
  };

  return {
    ...state,
    setOrigen,
    setDestino,
    calcularRuta,
    addLog,
    clearLogs: () => setState(prev => ({ ...prev, logs: [] }))
  };
}
