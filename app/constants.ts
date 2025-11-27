// app/constants.ts

export const MARKER_ICONS: Record<string, string> = {
    camping: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",      
    restaurant: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",   
    water: "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",      
    gas: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",        
    supermarket: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",  
    laundry: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",    
    tourism: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",    
    custom: "http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png" // ⭐ ESTRELLA AMARILLA GRANDE
};

export const ICONS_ITINERARY = {
    startEnd: "http://maps.google.com/mapfiles/ms/icons/red-pushpin.png",
    tactical: "http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png",
};

export const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️'; if (code >= 1 && code <= 3) return '⛅'; if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️'; if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️'; if (code >= 95) return '⛈️'; return '🌡️';
};

export const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();