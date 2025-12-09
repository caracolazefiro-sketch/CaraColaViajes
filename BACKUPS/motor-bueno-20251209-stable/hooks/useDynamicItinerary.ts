import { useMemo } from 'react';
import { DailyPlan } from '../types';

// Tipo para puntos de segmentación (matches useMotor.ts state.segmentationData.points)
interface SegmentationPoint {
  lat: number;
  lng: number;
  day: number;
  distance: number;
  cityName?: string;
  coordinates?: { lat: number; lng: number };
  cityCoordinates?: { lat: number; lng: number };
  realDistance?: number;
  isManualWaypoint?: boolean;
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
}

export interface DynamicDay {
  dayNumber: number;
  date: string; // DD/MM/YYYY con formato consistente
  type: 'driving' | 'stay';
  from: string;
  to: string;
  distance: number;
  cityName: string;
  isManualWaypoint: boolean;
  coordinates?: { lat: number; lng: number };
  startCoordinates?: { lat: number; lng: number };
  // Para días de estancia
  isStay?: boolean;
  stayCity?: string;
}

/**
 * Hook que genera el itinerario completo con días de conducción + días de estancia.
 *
 * Centraliza toda la lógica de cálculo de fechas en un solo lugar.
 *
 * @param serverItinerary - Itinerario base del servidor (sin días extra)
 * @param segmentationPoints - Puntos de segmentación del frontend
 * @param extraDays - Objeto con días extra por ciudad { "Jaén, Spain": 2 }
 * @param startCity - Ciudad de origen
 * @returns Array completo de días con fechas calculadas correctamente
 */
export function useDynamicItinerary(
  serverItinerary: DailyPlan[] | undefined,
  segmentationPoints: SegmentationPoint[] | undefined,
  extraDays: Record<string, number>,
  startCity: string
): DynamicDay[] {
  return useMemo(() => {
    if (!serverItinerary || !segmentationPoints || serverItinerary.length === 0) {
      return [];
    }

    const result: DynamicDay[] = [];
    let currentDayNumber = 1;

    // Función auxiliar para parsear DD/MM/YYYY
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    // Función auxiliar para formatear Date a DD/MM/YYYY
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Comenzar desde la fecha del primer día del servidor
    const currentDate = parseDate(serverItinerary[0].date);

    // Día 1: Origen → Primer punto
    const firstPoint = segmentationPoints[0];
    const firstServerDay = serverItinerary[0];

    const firstDrivingDay: DynamicDay = {
      dayNumber: currentDayNumber++,
      date: formatDate(currentDate),
      type: 'driving',
      from: startCity,
      to: firstPoint.cityName || 'Unknown',
      distance: firstServerDay.distance,
      cityName: firstPoint.cityName || 'Unknown',
      isManualWaypoint: firstPoint.isManualWaypoint || false,
      coordinates: firstPoint.coordinates,
      startCoordinates: firstServerDay.startCoordinates,
    };

    result.push(firstDrivingDay);
    currentDate.setDate(currentDate.getDate() + 1);

    // Días de estancia en el primer punto
    const firstPointExtraDays = extraDays[firstPoint.cityName || ''] || 0;
    for (let i = 0; i < firstPointExtraDays; i++) {
      const stayDay: DynamicDay = {
        dayNumber: currentDayNumber++,
        date: formatDate(currentDate),
        type: 'stay',
        from: firstPoint.cityName || 'Unknown',
        to: firstPoint.cityName || 'Unknown',
        distance: 0,
        cityName: firstPoint.cityName || 'Unknown',
        isManualWaypoint: firstPoint.isManualWaypoint || false,
        isStay: true,
        stayCity: firstPoint.cityName || 'Unknown',
        coordinates: firstPoint.coordinates,
      };

      result.push(stayDay);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Iterar por los puntos restantes (desde el segundo en adelante)
    segmentationPoints.slice(1).forEach((point, idx) => {
      // Día de conducción hacia este punto
      // idx + 1 porque el índice 0 de slice(1) corresponde al serverItinerary[1]
      const serverDayIdx = idx + 1;
      const serverDay = serverItinerary[serverDayIdx];

      if (serverDay) {
        const drivingDay: DynamicDay = {
          dayNumber: currentDayNumber++,
          date: formatDate(currentDate),
          type: 'driving',
          from: serverDay.from,
          to: serverDay.to,
          distance: serverDay.distance,
          cityName: point.cityName || 'Unknown',
          isManualWaypoint: point.isManualWaypoint || false,
          coordinates: point.coordinates,
          startCoordinates: serverDay.startCoordinates,
        };

        result.push(drivingDay);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Días de estancia en este punto
      const extraDaysCount = extraDays[point.cityName || ''] || 0;
      for (let i = 0; i < extraDaysCount; i++) {
        const stayDay: DynamicDay = {
          dayNumber: currentDayNumber++,
          date: formatDate(currentDate),
          type: 'stay',
          from: point.cityName || 'Unknown',
          to: point.cityName || 'Unknown',
          distance: 0,
          cityName: point.cityName || 'Unknown',
          isManualWaypoint: point.isManualWaypoint || false,
          isStay: true,
          stayCity: point.cityName || 'Unknown',
          coordinates: point.coordinates,
        };

        result.push(stayDay);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return result;
  }, [serverItinerary, segmentationPoints, extraDays, startCity]);
}
