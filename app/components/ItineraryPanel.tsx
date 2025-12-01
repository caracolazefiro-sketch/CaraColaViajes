// app/components/ItineraryPanel.tsx
'use client';

import React from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import DaySpotsList from './DaySpotsList';
// --- NUEVOS ICONOS LUCIDE ---
import { Printer, Plus, Trash2, Tent, Droplet, Fuel, ShoppingCart, WashingMachine, Utensils, Landmark, Star } from 'lucide-react';
// ----------------------------

// Función Helper (recreada para renderizar en el resumen y mantener la consistencia)
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

interface ItineraryPanelProps {
    dailyItinerary: DailyPlan[] | null;
    selectedDayIndex: number | null;
    origin: string;
    destination: string;
    places: Record<ServiceType, PlaceWithDistance[]>;
    loadingPlaces: Record<ServiceType, boolean>;
    toggles: Record<ServiceType, boolean>;
    auditMode: boolean;
    onToggle: (type: ServiceType) => void;
    onAddPlace: (place: PlaceWithDistance) => void;
    onRemovePlace: (placeId: string) => void;
    onHover: (place: PlaceWithDistance | null) => void;
    onAddDay: (index: number) => void;
    onRemoveDay: (index: number) => void;
    onSelectDay: (index: number) => void;
}

export default function ItineraryPanel({ 
    dailyItinerary,
    selectedDayIndex,
    origin,
    destination,
    places,
    loadingPlaces,
    toggles,
    auditMode,
    onToggle,
    onAddPlace,
    onRemovePlace,
    onHover,
    onAddDay,
    onRemoveDay,
    onSelectDay
}: ItineraryPanelProps) {

    if (!dailyItinerary) return null;

    return (
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px] print:h-auto print:overflow-visible">
            <div className='p-0 h-full overflow-hidden print:h-auto print:overflow-visible'>
                
                {selectedDayIndex === null ? (
                    // VISTA RESUMEN (LISTA DE DÍAS)
                    <div className="text-center pt-8 overflow-y-auto h-full p-4 print:h-auto print:overflow-visible">
                        <h4 className="text-xl font-extrabold text-red-600 mb-1">Itinerario Completo</h4>
                        <div className="text-sm font-bold text-gray-700 mb-2 bg-red-50 inline-block px-3 py-1 rounded-full">{origin} ➝ {destination}</div>
                        
                        <div className="flex justify-center mb-4 no-print">
                            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition shadow-lg">
                                <Printer className="h-5 w-5" /> Imprimir / Guardar PDF
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-4 no-print">Haz clic en una fila para ver detalles 👇</p>
                        
                        <div className="space-y-4 text-left">
                            {dailyItinerary.map((day, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => onSelectDay(index)}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all shadow-sm bg-white print-break group"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-red-700 text-sm flex items-center gap-1">
                                                {day.isDriving ? '🚐' : '🏖️'} Día {day.day}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {day.date}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                {day.isDriving ? `${day.distance.toFixed(0)} km` : 'Relax'}
                                            </span>
                                            
                                            {/* BOTONES */}
                                            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddDay(index); }}
                                                    className="text-green-600 hover:bg-green-100 p-1.5 rounded-full text-xs font-bold border border-green-200 bg-white shadow-sm"
                                                    title="Añadir un día de estancia aquí"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                {!day.isDriving && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRemoveDay(index); }}
                                                        className="text-red-500 hover:bg-red-100 p-1.5 rounded-full text-xs font-bold border border-red-200 bg-white shadow-sm"
                                                        title="Eliminar este día"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-800 font-medium mb-2">
                                        {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                    </div>
                                    
                                    {day.savedPlaces && day.savedPlaces.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                            {day.savedPlaces.map((place, i) => (
                                                <div key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                                    <span className="font-bold text-lg leading-none">
                                                       {getServiceIconComponent(place.type || 'custom', "h-4 w-4")}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold block text-green-800">{place.name}</span>
                                                        <span className="text-[10px] text-gray-500">{place.vicinity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <DaySpotsList 
                        day={dailyItinerary[selectedDayIndex]} 
                        places={places} 
                        loading={loadingPlaces} 
                        toggles={toggles} 
                        auditMode={auditMode} 
                        onToggle={onToggle} 
                        onAddPlace={onAddPlace} 
                        onRemovePlace={onRemovePlace} 
                        onHover={onHover}
                    />
                )}
            </div>
        </div>
    );
}