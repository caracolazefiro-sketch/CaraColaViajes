import { useState, useMemo, useEffect } from 'react';

export type Language = 'es' | 'en'; // ✅ Exportamos también por si acaso
export type UnitSystem = 'metric' | 'imperial';

interface TranslationMap {
    [key: string]: string;
}

// ✅ CORRECCIÓN: Añadido 'export' para que StageSelector pueda usarla
export interface LanguageSettings {
    lang: Language;
    units: UnitSystem;
    dateFormat: string;
    translations: TranslationMap;
}

const translations: Record<Language, TranslationMap> = {
    es: {
        'APP_TITLE': 'CaraCola Viajes',
        'APP_SUBTITLE': 'Tu ruta en autocaravana',
        'HEADER_LOGOUT': 'Salir',
        'HEADER_MY_TRIPS': 'Mis Viajes',
        'HEADER_ARCHIVE_TITLE': '📂 Archivo de Rutas',
        'HEADER_GREETING': 'Hola,',
        'AUTH_MAGIC_LINK': 'Magic Link',
        'AUTH_PASSWORD': 'Contraseña',
        'AUTH_REGISTER': 'Registrarse',
        'AUTH_EMAIL_PLACEHOLDER': 'Tu email...',
        'AUTH_PASSWORD_PLACEHOLDER': 'Contraseña...',
        'AUTH_SEND_LINK': 'Enviar Link',
        'AUTH_CREATE_ACCOUNT': 'Crear Cuenta',
        'AUTH_LOGIN': 'Entrar',
        'ALERT_LINK_SENT': '¡Enlace enviado! Revisa tu correo.',
        'ALERT_REGISTRATION_SUCCESS': '¡Registro correcto! Revisa tu email.',
        'CONFIRM_DELETE_TRIP': '¿Seguro que quieres borrar este viaje de la nube?',
        'TRIP_UNNAMED': 'Viaje sin nombre',
        'LOADING_LIBRARY': 'Cargando biblioteca...',
        'NO_TRIPS_SAVED': 'Aún no has guardado ningún viaje.',
        'ACTION_COPY_DEBUG': 'Copiar Datos Técnicos (JSON)',
        'ALERT_DEBUG_COPIED': '📋 Datos del viaje copiados al portapapeles.',
        'ACTION_DELETE_TRIP': 'Borrar Viaje',
        'ACTION_LOAD_TRIP': 'Cargar este viaje',
        'HEADER_AUDIT': 'Audit',
        'FORM_TITLE': 'Configuración del Viaje',
        'FORM_TRIP_NAME': 'Nombre del Viaje',
        'FORM_START_DATE': 'Inicio',
        'FORM_END_DATE': 'Regreso (Opcional)',
        'FORM_ORIGIN': 'Origen',
        'FORM_DESTINATION': 'Destino Principal',
        'FORM_WAYPOINTS_TITLE': '🛏️ Añadir Pernoctas',
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
        'FORM_WAYPOINT_SEARCH_PLACEHOLDER': '🔍 Buscar pernocta...',
        'FORM_NO_WAYPOINTS': 'No hay pernoctas añadidas.',
        'FORM_VALIDATE': 'Validar',
        'LOCATION_VALIDATED': 'Ubicación validada',
        'LOCATION_NOT_FOUND': 'Google no ha podido localizar este sitio.',
        'STATS_DAYS': 'días',
        'STATS_KM': 'km',
        'STATS_LITERS': 'litros',
        'STATS_COST': '€',
        'STATS_DAYS_LONG': 'Duración Total',
        'STATS_KM_LONG': 'Distancia Total',
        'STATS_COST_LONG': 'Coste Estimado',
        'STATS_DAY': 'Día',
        'DASHBOARD_EDIT': 'Editar',
        'ITINERARY_TITLE': 'Itinerario Completo',
        'ITINERARY_DAYS_TITLE': 'Tu Ruta:',
        'ITINERARY_GENERAL': 'General',
        'ITINERARY_DRIVING': 'Etapa de Conducción',
        'ITINERARY_STAY': 'Día de Estancia',
        'ITINERARY_RELAX': 'Relax',
        'ITINERARY_PLAN': 'MI PLAN',
        'ITINERARY_PRINT': 'Imprimir / Guardar PDF',
        'ITINERARY_ADD_DAY': 'Añadir un día de estancia aquí',
        'ITINERARY_REMOVE_DAY': 'Eliminar este día',
        'CLICK_FOR_DETAILS': 'Haz clic en una fila para ver detalles 👇',
        'ITINERARY_GENERATED_ON': 'Itinerario generado el',
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
        'SERVICE_CAMPING': 'Spots de Pernocta',
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
        'HEADER_ARCHIVE_TITLE': '📂 Route Archive',
        'HEADER_GREETING': 'Hello,',
        'AUTH_MAGIC_LINK': 'Magic Link',
        'AUTH_PASSWORD': 'Password',
        'AUTH_REGISTER': 'Register',
        'AUTH_EMAIL_PLACEHOLDER': 'Your email...',
        'AUTH_PASSWORD_PLACEHOLDER': 'Password...',
        'AUTH_SEND_LINK': 'Send Link',
        'AUTH_CREATE_ACCOUNT': 'Create Account',
        'AUTH_LOGIN': 'Login',
        'ALERT_LINK_SENT': 'Link sent! Check your email.',
        'ALERT_REGISTRATION_SUCCESS': 'Registration successful! Check your email.',
        'CONFIRM_DELETE_TRIP': 'Are you sure you want to delete this trip from the cloud?',
        'TRIP_UNNAMED': 'Unnamed Trip',
        'LOADING_LIBRARY': 'Loading library...',
        'NO_TRIPS_SAVED': 'You have not saved any trips yet.',
        'ACTION_COPY_DEBUG': 'Copy Technical Data (JSON)',
        'ALERT_DEBUG_COPIED': '📋 Trip data copied to clipboard.',
        'ACTION_DELETE_TRIP': 'Delete Trip',
        'ACTION_LOAD_TRIP': 'Load this trip',
        'HEADER_AUDIT': 'Audit',
        'FORM_TITLE': 'Trip Configuration',
        'FORM_TRIP_NAME': 'Trip Name',
        'FORM_START_DATE': 'Start Date',
        'FORM_END_DATE': 'Return Date (Optional)',
        'FORM_ORIGIN': 'Origin',
        'FORM_DESTINATION': 'Main Destination',
        'FORM_WAYPOINTS_TITLE': '🛏️ Add Overnight Stops',
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
        'FORM_WAYPOINT_SEARCH_PLACEHOLDER': '🔍 Search overnight stop...',
        'FORM_NO_WAYPOINTS': 'No overnight stops added.',
        'FORM_VALIDATE': 'Validate',
        'LOCATION_VALIDATED': 'Location validated',
        'LOCATION_NOT_FOUND': 'Google could not locate this place.',
        'STATS_DAYS': 'days',
        'STATS_KM': 'mi',
        'STATS_LITERS': 'gal',
        'STATS_COST': '$',
        'STATS_DAYS_LONG': 'Total Duration',
        'STATS_KM_LONG': 'Total Distance',
        'STATS_COST_LONG': 'Estimated Cost',
        'STATS_DAY': 'Day',
        'DASHBOARD_EDIT': 'Edit',
        'ITINERARY_TITLE': 'Full Itinerary',
        'ITINERARY_DAYS_TITLE': 'Your Route:',
        'ITINERARY_GENERAL': 'General',
        'ITINERARY_DRIVING': 'Driving Stage',
        'ITINERARY_STAY': 'Stay Day',
        'ITINERARY_RELAX': 'Relax',
        'ITINERARY_PLAN': 'MY PLAN',
        'ITINERARY_PRINT': 'Print / Save PDF',
        'ITINERARY_ADD_DAY': 'Add a stay day here',
        'ITINERARY_REMOVE_DAY': 'Remove this day',
        'CLICK_FOR_DETAILS': 'Click a row to see details 👇',
        'ITINERARY_GENERATED_ON': 'Itinerary generated on',
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
        'SERVICE_CAMPING': 'Overnight Spots',
        'ACTION_SAVE': 'Save',
        'ACTION_SHARE': 'Share',
        'ACTION_DELETE': 'Delete',
        'ACTION_LOADING': 'Saving...',
    }
};

export function useLanguage() {
    const [language, setLanguage] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('caracola_lang') as Language) || 'es';
        }
        return 'es';
    });

    const settings: LanguageSettings = useMemo(() => {
        const isImperial = language === 'en';
        return {
            lang: language,
            units: isImperial ? 'imperial' : 'metric',
            dateFormat: isImperial ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
            translations: translations[language],
        };
    }, [language]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('caracola_lang', language);
            document.documentElement.lang = language; 
        }
    }, [language]);

    const t = (key: string): string => {
        return settings.translations[key] || key;
    };
    
    const convert = (value: number, unit: 'km' | 'liter' | 'currency' | 'kph'): number => {
        if (settings.units === 'metric') return value; 
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