// Acceso aislado a la acción getDirectionsAndCost solo para MOTOR
// Copia local para aislamiento total
import { DailyPlan } from './types';

interface GetDirectionsAndCostParams {
  origin: string;
  destination: string;
  waypoints: string[];
  travel_mode: string;
  kmMaximoDia: number;
  fechaInicio: string;
  fechaRegreso: string;
}

interface GetDirectionsAndCostResult {
  dailyItinerary: DailyPlan[];
  error?: string;
  debugLog?: string[];
}

export async function getDirectionsAndCost(params: GetDirectionsAndCostParams): Promise<GetDirectionsAndCostResult> {
  // Aquí deberías replicar la lógica de app/actions.ts relevante para MOTOR
  // Por ahora, lanza un error para evitar dependencias cruzadas
  throw new Error('getDirectionsAndCost debe ser implementado localmente para MOTOR.');
}
