export interface Coordinates { lat: number; lng: number; }

export type ServiceType = 'camping' | 'restaurant' | 'gas' | 'supermarket' | 'laundry' | 'tourism' | 'custom' | 'search' | 'found';

export interface PlaceWithDistance {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    vicinity?: string; 
    place_id?: string;
    opening_hours?: { isOpen?: () => boolean; open_now?: boolean };
    geometry?: { location?: Coordinates; }; 
    distanceFromCenter?: number; 
    type?: ServiceType;
    photoUrl?: string;
    types?: string[]; 
    link?: string; 
    isPublic?: boolean;
    note?: string;
    score?: number; // Score combinado de calidad/distancia
}

export interface DailyPlan { 
    day: number; 
    date: string; 
    isoDate: string; 
    from: string; 
    to: string; 
    distance: number; 
    isDriving: boolean; 
    // ✅ NUEVO: Coordenadas de inicio para el clima en ruta
    startCoordinates?: Coordinates; 
    coordinates?: Coordinates; // Coordenadas de destino
    type: 'overnight' | 'tactical' | 'start' | 'end';

    // 🔗 Meta “itinerario maestro” (opcional)
    // `masterLegIndex` indica entre qué paradas obligatorias (legs de Google) cae este día.
    // Útil para insertar un nuevo waypoint cuando el usuario ajusta una parada táctica.
    masterLegIndex?: number;
    masterFromStopIndex?: number;
    masterToStopIndex?: number;
    masterKind?: 'tactical' | 'anchor' | 'stay';

    savedPlaces?: PlaceWithDistance[]; 
}

export interface TripResult { 
    totalDays: number | null; 
    distanceKm: number | null; 
    totalCost: number | null; 
    liters?: number | null; 
    // When the route is computed server-side we may not have a client-side DirectionsResult.
    // We keep an encoded polyline so the map can still render the route.
    overviewPolyline?: string | null;
    dailyItinerary: DailyPlan[] | null; 
    error: string | null; 
}

// ✅ MEJORA: Datos climáticos extendidos (Viento y Nieve)
export interface WeatherData { 
    code: number; 
    maxTemp: number; 
    minTemp: number; 
    rainProb: number; 
    windSpeed: number; // Nuevo: Velocidad viento km/h
}