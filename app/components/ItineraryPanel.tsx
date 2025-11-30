'use client';

import React from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import DaySpotsList from './DaySpotsList';

// Iconos locales
const IconPrint = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);
const IconPlusSm = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const IconTrashSm = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

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
    onSelectDay: (index: number | null) => void;
    t: (key: string) => string; // Traducción
    convert: (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => number; // Conversión
}

export default function ItineraryPanel({
    dailyItinerary, selectedDayIndex, origin, destination, places, loadingPlaces,
    toggles, auditMode, onToggle, onAddPlace, onRemovePlace, onHover,
    onAddDay, onRemoveDay, onSelectDay, t, convert
}: ItineraryPanelProps) {

    if (!dailyItinerary) return null;

    // Conversiones
    const unitKm = convert(1, 'km') === 1 ? 'km' : 'mi';

    return (
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px] print:h-auto print:overflow-visible">
            <div className='p-0 h-full overflow-hidden print:h-auto print:overflow-visible'>
                
                {selectedDayIndex === null ? (
                    // VISTA RESUMEN (LISTA DE DÍAS)
                    <div className="text-center pt-8 overflow-y-auto h-full p-4 print:h-auto print:overflow-visible">
                        <h4 className="text-xl font-extrabold text-red-600 mb-1">{t('ITINERARY_TITLE')}</h4>
                        <div className="text-sm font-bold text-gray-700 mb-2 bg-red-50 inline-block px-3 py-1 rounded-full">{origin} ➝ {destination}</div>
                        
                        <div className="flex justify-center mb-4 no-print">
                            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition shadow-lg">
                                <IconPrint /> {t('ITINERARY_PRINT')}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-4 no-print">{t('CLICK_FOR_DETAILS')}</p>
                        
                        <div className="space-y-4 text-left">
                            {dailyItinerary.map((day, index) => {
                                const displayDistance = convert(day.distance, 'km').toFixed(0);
                                return (
                                    <div 
                                        key={index} 
                                        onClick={() => onSelectDay(index)}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all shadow-sm bg-white print-break group"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold text-red-700 text-sm flex items-center gap-1">
                                                    {day.isDriving ? '🚐' : '🏖️'} {t('STATS_DAY')} {day.day}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {day.date}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {day.isDriving ? `${displayDistance} ${unitKm}` : t('ITINERARY_RELAX')}
                                                </span>
                                                
                                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onAddDay(index); }}
                                                        className="text-green-600 hover:bg-green-100 p-1.5 rounded-full text-xs font-bold border border-green-200 bg-white shadow-sm"
                                                        title={t('ITINERARY_ADD_DAY')}
                                                    >
                                                        <IconPlusSm />
                                                    </button>
                                                    {!day.isDriving && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onRemoveDay(index); }}
                                                            className="text-red-500 hover:bg-red-100 p-1.5 rounded-full text-xs font-bold border border-red-200 bg-white shadow-sm"
                                                            title={t('ITINERARY_REMOVE_DAY')}
                                                        >
                                                            <IconTrashSm />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-800 font-medium mb-2">
                                            {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                        </div>
                                        
                                        {/* LISTA DE SITIOS GUARDADOS EN EL RESUMEN */}
                                        {day.savedPlaces && day.savedPlaces.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                                <h6 className="text-[10px] font-bold text-green-700">{t('ITINERARY_PLAN')}:</h6>
                                                {day.savedPlaces.map((place, i) => (
                                                    <div key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                                        <span className="font-bold text-lg leading-none">
                                                        {place.type === 'camping' ? '🚐' : 
                                                            place.type === 'restaurant' ? '🍳' : 
                                                            place.type === 'water' ? '💧' :
                                                            place.type === 'gas' ? '⛽' :
                                                            place.type === 'supermarket' ? '🛒' :
                                                            place.type === 'laundry' ? '🧺' :
                                                            place.type === 'tourism' ? '📷' : '⭐'}
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
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    // VISTA DETALLE
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
                        t={t} convert={convert}
                    />
                )}
            </div>
        </div>
    );
}