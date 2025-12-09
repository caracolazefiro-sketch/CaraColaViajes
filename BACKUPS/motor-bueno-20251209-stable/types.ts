// ⚠️🚨 RED FLAG - CRITICAL FILE - VERSIÓN ESTABLE V1 - DO NOT MODIFY 🚨⚠️
// ✅ ESTA VERSIÓN FUNCIONA PERFECTAMENTE - NO TOCAR SIN BACKUP
// Este archivo define los tipos TypeScript del MOTOR MVP.
// DailyPlan es la estructura que devuelve el servidor con información de cada día.
// IMPORTANTE: El itinerario NO usa estos datos directamente, usa segmentationData
// del cliente (calculado del polyline del mapa) para garantizar coincidencia exacta.
// Cualquier cambio en estos tipos ROMPERÁ la comunicación entre servidor y cliente.
// ⚠️🚨 TESTEAR EXHAUSTIVAMENTE CUALQUIER CAMBIO 🚨⚠️
// Fecha estable: 06/12/2025

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
