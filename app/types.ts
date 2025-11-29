export interface Coordinates { lat: number; lng: number; }

export type ServiceType = 'camping' | 'restaurant' | 'water' | 'gas' | 'supermarket' | 'laundry' | 'tourism' | 'custom';

export interface PlaceWithDistance {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    vicinity?: string; // Dirección o Descripción visual
    place_id?: string;
    opening_hours?: { isOpen?: () => boolean; open_now?: boolean };
    geometry?: { location?: any; }; // Aquí guardaremos las coordenadas para el mapa
    distanceFromCenter?: number; 
    type?: ServiceType;
    photoUrl?: string;
    types?: string[]; 
    link?: string; // URL externa (P4N, web...)
    isPublic?: boolean; // <--- NUEVA PROPIEDAD: Control de privacidad
}

export interface DailyPlan { 
    day: number; 
    date: string; 
    isoDate: string; 
    from: string; 
    to: string; 
    distance: number; 
    isDriving: boolean; 
    coordinates?: Coordinates; 
    type: 'overnight' | 'tactical' | 'start' | 'end';
    savedPlaces?: PlaceWithDistance[]; 
}

export interface TripResult { 
    totalDays: number | null; 
    distanceKm: number | null; 
    totalCost: number | null; 
    dailyItinerary: DailyPlan[] | null; 
    error: string | null; 
}

export interface WeatherData { 
    code: number; 
    maxTemp: number; 
    minTemp: number; 
    rainProb: number; 
}