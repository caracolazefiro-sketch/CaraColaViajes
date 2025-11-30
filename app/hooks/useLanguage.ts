import { useState, useMemo, useEffect } from 'react';

type Language = 'es' | 'en';
type UnitSystem = 'metric' | 'imperial';

interface TranslationMap {
    [key: string]: string;
}

interface LanguageSettings {
    lang: Language;
    units: UnitSystem;
    dateFormat: string; // DD/MM/YYYY vs MM/DD/YYYY
    translations: TranslationMap;
}

const translations: Record<Language, TranslationMap> = {
    es: {
        'APP_TITLE': 'CaraCola Viajes',
        'APP_SUBTITLE': 'Tu ruta en autocaravana',
        'HEADER_LOGOUT': 'Salir',
        'HEADER_MY_TRIPS': 'Mis Viajes',
        'HEADER_AUDIT': 'Audit',
        'FORM_TITLE': 'Configuración del Viaje',
        'FORM_START_DATE': 'Inicio',
        'FORM_END_DATE': 'Regreso (Opcional)',
        'FORM_ORIGIN': 'Origen',
        'FORM_DESTINATION': 'Destino Principal',
        'FORM_WAYPOINTS_TITLE': '➕ Añadir Paradas Intermedias',
        'FORM_ROUND_TRIP': '🔄 Vuelta a Casa (Circular)',
        'FORM_ROUND_TRIP_SHORT': 'Circular',
        'FORM_DAILY_RHYTHM': 'Ritmo Máximo (KM/día)',
        'FORM_FUEL_CONSUMPTION': 'Consumo (L/100km)',
        'FORM_FUEL_PRICE': 'Precio Diésel (€/L)',
        'FORM_NO_TOLLS': '🚫 Evitar Peajes',
        'FORM_CALCULATE': '🚀 Calcular Itinerario',
        'FORM_LOADING': 'Calculando Ruta...',
        'FORM_CITY_PLACEHOLDER': 'Ciudad, calle o coords',
        'FORM_CABO_NORTE_PLACEHOLDER': 'Ej: Cabo Norte',
        'FORM_WAYPOINT_SEARCH_PLACEHOLDER': '🔍 Buscar parada...',
        'FORM_NO_WAYPOINTS': 'No hay paradas intermedias añadidas.',
        'FORM_VALIDATE': 'Validar',
        'LOCATION_VALIDATED': 'Ubicación validada',
        'LOCATION_NOT_FOUND': 'Google no ha podido localizar este sitio.',
        
        'STATS_DAYS': 'días',
        'STATS_KM': 'km',
        'STATS_LITERS': 'litros',
        'STATS_COST': '€',
        'DASHBOARD_EDIT': 'Editar',
        
        'ITINERARY_TITLE': 'Itinerario Completo',
        'ITINERARY_DAYS_TITLE': 'Tu Ruta:',
        'ITINERARY_GENERAL': 'General',
        'ITINERARY_DRIVING': 'Etapa de Conducción',
        'ITINERARY_STAY': 'Día de Estancia',
        'ITINERARY_RELAX': 'Relax',
        'ITINERARY_PLAN': 'MI PLAN',
        'ITINERARY_PRINT': 'Imprimir / Guardar PDF',
        
        'MAP_SEARCH_PLACEHOLDER': 'Buscar en esta zona...',
        'MAP_ADD': 'Añadir',
        
        'SERVICE_WATER': 'Aguas',
        'SERVICE_GAS': 'Gas',
        'SERVICE_EAT': 'Comer',
        'SERVICE_SUPERMARKET': 'Super',
        'SERVICE_LAUNDRY': 'Lavar',
        'SERVICE_TOURISM': 'Turismo',
        'SERVICE_CUSTOM': 'Propios',
        'SERVICE_SEARCH': 'Búsqueda',
        'SERVICE_CAMPING': 'Áreas y Campings',
        
        'ACTION_SAVE': 'Guardar',
        'ACTION_SHARE': 'Compartir',
        'ACTION_DELETE': 'Borrar',
        'ACTION_LOADING': 'Guardando...',
    },
    en: {
        'APP_TITLE': 'CaraCola Trips',
        'APP_SUBTITLE': 'Your Motorhome Route Planner',
        'HEADER_LOGOUT': 'Logout',
        'HEADER_MY_TRIPS': 'My Trips',
        'HEADER_AUDIT': 'Audit',
        'FORM_TITLE': 'Trip Configuration',
        'FORM_START_DATE': 'Start Date',
        'FORM_END_DATE': 'Return Date (Optional)',
        'FORM_ORIGIN': 'Origin',
        'FORM_DESTINATION': 'Main Destination',
        'FORM_WAYPOINTS_TITLE': '➕ Add Waypoints',
        'FORM_ROUND_TRIP': '🔄 Round Trip',
        'FORM_ROUND_TRIP_SHORT': 'Circular',
        'FORM_DAILY_RHYTHM': 'Max Daily Rhythm (Mi/day)',
        'FORM_FUEL_CONSUMPTION': 'Consumption (Gal/100mi)',
        'FORM_FUEL_PRICE': 'Diesel Price ($/Gal)',
        'FORM_NO_TOLLS': '🚫 Avoid Tolls',
        'FORM_CALCULATE': '🚀 Calculate Itinerary',
        'FORM_LOADING': 'Calculating Route...',
        'FORM_CITY_PLACEHOLDER': 'City, street, or coords',
        'FORM_CABO_NORTE_PLACEHOLDER': 'Ex: Cabo Norte',
        'FORM_WAYPOINT_SEARCH_PLACEHOLDER': '🔍 Search waypoint...',
        'FORM_NO_WAYPOINTS': 'No intermediate stops added.',
        'FORM_VALIDATE': 'Validate',
        'LOCATION_VALIDATED': 'Location validated',
        'LOCATION_NOT_FOUND': 'Google could not locate this place.',

        'STATS_DAYS': 'days',
        'STATS_KM': 'mi',
        'STATS_LITERS': 'gal',
        'STATS_COST': '$',
        'DASHBOARD_EDIT': 'Edit',

        'ITINERARY_TITLE': 'Full Itinerary',
        'ITINERARY_DAYS_TITLE': 'Your Route:',
        'ITINERARY_GENERAL': 'General',
        'ITINERARY_DRIVING': 'Driving Stage',
        'ITINERARY_STAY': 'Stay Day',
        'ITINERARY_RELAX': 'Relax',
        'ITINERARY_PLAN': 'MY PLAN',
        'ITINERARY_PRINT': 'Print / Save PDF',

        'MAP_SEARCH_PLACEHOLDER': 'Search this area...',
        'MAP_ADD': 'Add',

        'SERVICE_WATER': 'Water',
        'SERVICE_GAS': 'Gas',
        'SERVICE_EAT': 'Eat',
        'SERVICE_SUPERMARKET': 'Super',
        'SERVICE_LAUNDRY': 'Laundry',
        'SERVICE_TOURISM': 'Tourism',
        'SERVICE_CUSTOM': 'Own Spots',
        'SERVICE_SEARCH': 'Search',
        'SERVICE_CAMPING': 'Campsites & Areas',

        'ACTION_SAVE': 'Save',
        'ACTION_SHARE': 'Share',
        'ACTION_DELETE': 'Delete',
        'ACTION_LOADING': 'Saving...',
    }
};

export function useLanguage() {
    // 1. Estado del idioma y unidad (Recupera del localStorage si existe)
    const [language, setLanguage] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('caracola_lang') as Language) || 'es';
        }
        return 'es';
    });

    // 2. Definición de settings basados en el idioma
    const settings: LanguageSettings = useMemo(() => {
        const isImperial = language === 'en';
        return {
            lang: language,
            units: isImperial ? 'imperial' : 'metric',
            dateFormat: isImperial ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
            translations: translations[language],
        };
    }, [language]);

    // 3. Efecto para guardar el idioma en localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('caracola_lang', language);
            document.documentElement.lang = language; 
        }
    }, [language]);

    // Función de traducción simple
    const t = (key: keyof TranslationMap | string): string => {
        // Aseguramos que la salida sea siempre STRING
        return settings.translations[key] || key;
    };
    
    // Función de conversión (KM/Liters a Miles/Gallons/Euros a Dólares)
    const convert = (value: number, unit: 'km' | 'liter' | 'currency' | 'kph'): number => {
        if (settings.units === 'metric') {
            return value; // No conversion needed
        }
        
        switch (unit) {
            case 'km': return value * 0.621371; 
            case 'liter': return value * 0.264172; 
            case 'currency': return value * 1.08; 
            case 'kph': return value * 0.621371; 
            default: return value;
        }
    };
    
    const setLang = (newLang: Language) => {
        setLanguage(newLang);
    };

    return { settings, t, convert, setLang, language };
}