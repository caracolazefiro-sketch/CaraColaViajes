// Tipos locales para aislamiento total del MOTOR
export interface DailyPlan {
  day: number;
  date: string;
  from: string;
  to: string;
  distance: number;
  isDriving: boolean;
  coordinates?: { lat: number; lng: number };
  startCoordinates?: { lat: number; lng: number };
}
