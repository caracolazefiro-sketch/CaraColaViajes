// app/components/ItineraryPanel.tsx
// ... (Añadir importaciones de Lucide al inicio del archivo)
import { Trash2, Plus, Printer, Tent, Droplet, Fuel, ShoppingCart, WashingMachine, Utensils, Landmark, Star } from 'lucide-react';

// Función Helper (recreada de DaySpotsList.tsx para limpieza de código)
const getServiceIconComponent = (type: ServiceType, sizeClass: string = "h-4 w-4") => {
    const defaultProps = { className: sizeClass };
    switch (type) {
        case 'camping': return <Tent {...defaultProps} />;
        case 'water': return <Droplet {...defaultProps} />;
        case 'gas': return <Fuel {...defaultProps} />;
        case 'supermarket': return <ShoppingCart {...defaultProps} />;
        case 'laundry': return <WashingMachine {...defaultProps} />;
        case 'restaurant': return <Utensils {...defaultProps} />;
        case 'tourism': return <Landmark {...defaultProps} />;
        case 'custom': return <Star {...defaultProps} />;
        default: return <Star {...defaultProps} />;
    }
};

// ... (cerca de la línea 123)
{day.savedPlaces && day.savedPlaces.length > 0 && (
    <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
        {day.savedPlaces.map((place, i) => (
            <div key={i} className="text-xs text-gray-700 flex items-start gap-2">
                <span className="font-bold text-lg leading-none">
                   {/* REEMPLAZO DE EMOJIS */}
                   {getServiceIconComponent(place.type || 'custom', "h-4 w-4")}
                </span>
                {/* ... (resto de la tarjeta) ... */}
            </div>
        ))}
    </div>
)}
// ...