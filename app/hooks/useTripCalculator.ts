import { useState } from 'react';
import { TripResult, DailyPlan } from '../types';

export interface TripFormData {
    fechaInicio: string;
    origen: string;
    fechaRegreso: string;
    destino: string;
    etapas: string;
    consumo: number;
    precioGasoil: number;
    kmMaximoDia: number;
    evitarPeajes: boolean;
    vueltaACasa: boolean;
}

interface Converter {
    (value: number, unit: 'km' | 'liter' | 'currency' | 'kph'): number;
}

// Helpers de fechas
const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateISO = (d: Date) => d.toISOString().split('T')[0];
const addDay = (d: Date) => {
    const n = new Date(d);
    n.setDate(n.getDate() + 1);
    return n;
};

const emptyResults: TripResult = {
    totalDays: null,
    distanceKm: null,
    totalCost: null,
    liters: null,
    dailyItinerary: null,
    overviewPolyline: null,
    error: null,
};

export function useTripCalculator(_convert: Converter, _units: 'metric' | 'imperial') {
    void _convert;
    void _units;

    const [results, setResults] = useState<TripResult>(emptyResults);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Server-side is the source of truth for route + itinerary.
    // We keep this method for UX (reset state + show blocking overlay).
    const calculateRoute = async (_formData: TripFormData) => {
        void _formData;
        setLoading(true);
        setDirectionsResponse(null);
        setResults(emptyResults);
    };

    const recalculateDates = (itinerary: DailyPlan[], startDate: string) => {
        let currentDate = new Date(startDate);
        return itinerary.map((day, index) => {
            const updatedDay = {
                ...day,
                day: index + 1,
                date: formatDate(currentDate),
                isoDate: formatDateISO(currentDate),
            };
            currentDate = addDay(currentDate);
            return updatedDay;
        });
    };

    const addDayToItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        const currentItinerary = [...results.dailyItinerary];
        const previousDay = currentItinerary[index];
        if (!previousDay) return;

        const newDay: DailyPlan = {
            day: 0,
            date: '',
            isoDate: '',
            from: previousDay.to,
            to: previousDay.to,
            distance: 0,
            isDriving: false,
            type: 'overnight',
            coordinates: previousDay.coordinates,
            savedPlaces: [],
        };

        currentItinerary.splice(index + 1, 0, newDay);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    const removeDayFromItinerary = (index: number, startDate: string) => {
        if (!results.dailyItinerary) return;
        const currentItinerary = [...results.dailyItinerary];
        if (index < 0 || index >= currentItinerary.length) return;

        currentItinerary.splice(index, 1);
        const finalItinerary = recalculateDates(currentItinerary, startDate);
        setResults({ ...results, dailyItinerary: finalItinerary, totalDays: finalItinerary.length });
    };

    return {
        results,
        setResults,
        directionsResponse,
        setDirectionsResponse,
        loading,
        setLoading,
        calculateRoute,
        addDayToItinerary,
        removeDayFromItinerary,
    };
}