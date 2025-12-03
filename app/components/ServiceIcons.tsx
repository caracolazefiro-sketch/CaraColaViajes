// Iconos SVG para servicios - Implementación directa sin dependencias de Lucide
import {
    IconMoon, IconDroplet, IconFuel, IconUtensilsCrossed, IconShoppingCart,
    IconWashingMachine, IconCamera, IconStar, IconSearch, IconMapPin
} from '../lib/svgIcons';

export const ServiceIcons = {
    camping: IconMoon,
    water: IconDroplet,
    gas: IconFuel,
    restaurant: IconUtensilsCrossed,
    supermarket: IconShoppingCart,
    laundry: IconWashingMachine,
    tourism: IconCamera,
    custom: IconStar,
    search: IconSearch,
    found: IconMapPin,
} as const;

export type ServiceIconType = keyof typeof ServiceIcons;

// Colores para cada tipo de servicio
export const ServiceColors: Record<string, string> = {
    camping: '#DC2626',      // red-600
    water: '#0891B2',        // cyan-600
    gas: '#EA580C',          // orange-600
    restaurant: '#2563EB',   // blue-600
    supermarket: '#16A34A',  // green-600
    laundry: '#9333EA',      // purple-600
    tourism: '#CA8A04',      // yellow-600
    custom: '#4B5563',       // gray-600
    search: '#3B82F6',       // blue-500 - Búsqueda intencional
    found: '#14B8A6',        // teal-500 - Descubrimiento en mapa
};

// Genera un data URL SVG para usar como icono de marcador en Google Maps
export function createMarkerIcon(type: string, size = 24): string {
    const color = ServiceColors[type] || ServiceColors.custom;
    
    // SVG paths para cada icono (extraídos de Lucide)
    const paths: Record<string, string> = {
        camping: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',  // Moon
        water: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',  // Droplet
        gas: 'M3 2h10v14H3zM7 21v-7M17 6h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2M17 10h3',  // Fuel
        restaurant: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',  // UtensilsCrossed
        supermarket: 'M9 21m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M20 21m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12',  // ShoppingCart
        laundry: 'M3 6h3M17 6h.01M3 2h18a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2M12 13m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0',  // WashingMachine
        tourism: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',  // Camera
        custom: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2',  // Star
        search: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2',  // Star (placeholder)
    };
    
    const path = paths[type] || paths.custom;
    
    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="white" stroke="${color}" stroke-width="2.5"/>
            <g transform="translate(7, 7)">
                <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.42)"/>
            </g>
        </svg>
    `.trim();
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
