'use client';

import React from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import DaySpotsList from './DaySpotsList';
import { ServiceIcons } from './ServiceIcons';
import { IconPrinter, IconPlus, IconTrash2, IconTruck, IconSearch, IconSettings } from '../lib/svgIcons';

// Iconos locales
const IconPrint = () => <IconPrinter size={16} />;
const IconPlusSm = () => <IconPlus size={16} />;
const IconTrashSm = () => <IconTrash2 size={16} />;

interface ItineraryPanelProps {
    dailyItinerary: DailyPlan[] | null;
    selectedDayIndex: number | null;
    origin: string;
    destination: string;
    tripName?: string;
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
    onSearchNearDay: (dayIndex: number) => void; // Nueva prop
    onAdjustDay: (dayIndex: number) => void; // Nueva prop - Ajustar destino
    t: (key: string) => string; // Traducción
    convert: (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => number; // Conversión
    // 🔥 NUEVOS PROPS PARA FILTRADO
    minRating?: number;
    setMinRating?: (rating: number) => void;
    searchRadius?: number;
    setSearchRadius?: (radius: number) => void;
    sortBy?: 'score' | 'distance' | 'rating';
    setSortBy?: (sort: 'score' | 'distance' | 'rating') => void;
}

export default function ItineraryPanel({
    dailyItinerary, selectedDayIndex, origin, destination, tripName, places, loadingPlaces,
    toggles, auditMode, onToggle, onAddPlace, onRemovePlace, onHover,
    onAddDay, onRemoveDay, onSelectDay, onSearchNearDay, onAdjustDay, t, convert,
    minRating = 0, setMinRating, searchRadius = 50, setSearchRadius, sortBy = 'score', setSortBy
}: ItineraryPanelProps) {

    if (!dailyItinerary) return null;

    // Conversiones y cálculos
    const unitKm = convert(1, 'km') === 1 ? 'km' : 'mi';
    const totalDistance = dailyItinerary.reduce((sum, day) => sum + day.distance, 0);
    const displayTotalKm = totalDistance ? convert(totalDistance, 'km').toFixed(0) : '0';
    const firstDate = dailyItinerary[0]?.date;
    const lastDate = dailyItinerary[dailyItinerary.length - 1]?.date;

    const formatDuration = (minutes?: number) => {
        if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return '';
        const m = Math.round(minutes);
        const h = Math.floor(m / 60);
        const mm = m % 60;
        if (h <= 0) return `${mm}m`;
        return `${h}h ${mm.toString().padStart(2, '0')}m`;
    };

    return (
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full print:h-auto print:overflow-visible">
            <div className='p-0 h-full overflow-hidden print:h-auto print:overflow-visible'>
                
                {selectedDayIndex === null ? (
                    // VISTA RESUMEN (LISTA DE DÍAS)
                    <div className="overflow-y-auto h-full print:h-auto print:overflow-visible">
                        
                        {/* HEADER COMPACTO Y ELEGANTE */}
                        <div className="bg-gradient-to-br from-blue-50 via-white to-red-50 border-b border-gray-200 p-4 pb-3">
                            {tripName && (
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <IconTruck size={20} className="text-red-600" />
                                    <h3 className="text-lg font-bold text-gray-800">{tripName}</h3>
                                </div>
                            )}
                            
                            {/* Caja compacta con toda la info en una línea */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 mb-2">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    {/* Ruta */}
                                    <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                                        <span>{origin.split(',')[0]}</span>
                                        <span className="text-red-500">→</span>
                                        <span>{destination.split(',')[0]}</span>
                                    </div>
                                    
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    
                                    {/* Fechas */}
                                    <div className="text-center">
                                        <div className="font-bold text-gray-800">{firstDate?.split('/').slice(0,2).join('/')}<span className="text-gray-400 mx-0.5">/</span>{lastDate?.split('/').slice(0,2).join('/')}</div>
                                    </div>
                                    
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    
                                    {/* Distancia */}
                                    <div className="text-center">
                                        <span className="font-extrabold text-red-600 text-base">{displayTotalKm}</span>
                                        <span className="text-gray-500 ml-0.5">{unitKm}</span>
                                    </div>
                                    
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    
                                    {/* Días */}
                                    <div className="text-center">
                                        <span className="font-extrabold text-red-600 text-base">{dailyItinerary.length}</span>
                                        <span className="text-gray-500 ml-0.5">{dailyItinerary.length === 1 ? 'día' : 'días'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón imprimir minimalista */}
                            <div className="flex justify-center items-center gap-1.5 text-gray-600 hover:text-gray-900 cursor-pointer transition no-print mb-2" onClick={() => window.print()}>
                                <IconPrint />
                                <span className="text-xs font-semibold">PDF</span>
                            </div>
                        </div>

                        {/* LISTA DE DÍAS */}
                        <div className="p-4 space-y-3"
>
                            {dailyItinerary.map((day, index) => {
                                const displayDistance = day.distance ? convert(day.distance, 'km').toFixed(0) : '0';
                                const durationLabel = day.isDriving ? formatDuration(day.durationMin) : '';
                                const fromLabel = (day.from || '').split('|')[0];
                                const toLabel = (day.to || '').replace('📍 Parada Táctica: ', '').split('|')[0];
                                const nonDrivingLabel = (toLabel || fromLabel).trim();
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
                                                    {day.isDriving
                                                        ? `${displayDistance} ${unitKm}${durationLabel ? ` · ${durationLabel}` : ''}`
                                                        : t('ITINERARY_RELAX')}
                                                </span>
                                                
                                                {/* Botón buscar servicios cerca de esta etapa */}
                                                {day.isDriving && day.coordinates && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSearchNearDay(index); }}
                                                        className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-full border border-blue-200 bg-white shadow-sm transition-all hover:scale-105"
                                                        title="🔍 Buscar Servicios: Encuentra campings, gasolineras y restaurantes cerca de esta etapa. Ahorra tiempo localizando lo importante sin salir de tu ruta."
                                                    >
                                                        <IconSearch className="h-4 w-4" />
                                                    </button>
                                                )}
                                                
                                                {/* Botón ajustar destino de esta etapa */}
                                                {day.isDriving && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onAdjustDay(index); }}
                                                        className="text-orange-600 hover:bg-orange-100 p-1.5 rounded-full border border-orange-200 bg-white shadow-sm transition-all hover:scale-105"
                                                        title="⚙️ Ajustar Parada: Cambia el destino de esta etapa y recalcula automáticamente el resto del viaje. Perfecto para desvíos o sitios mejores."
                                                    >
                                                        <IconSettings className="h-4 w-4" />
                                                    </button>
                                                )}
                                                
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
                                            {day.isDriving ? (
                                                <>
                                                    {fromLabel} ➝ {toLabel}
                                                </>
                                            ) : (
                                                <>{nonDrivingLabel}</>
                                            )}
                                        </div>
                                        
                                        {/* LISTA DE SITIOS GUARDADOS EN EL RESUMEN */}
                                        {day.savedPlaces && day.savedPlaces.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                                <h6 className="text-[10px] font-bold text-green-700">{t('ITINERARY_PLAN')}:</h6>
                                                {day.savedPlaces.map((place, i) => {
                                                    const Icon = ServiceIcons[place.type as keyof typeof ServiceIcons] || ServiceIcons.custom;
                                                    return (
                                                    <div key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                                        <span className="text-gray-600">
                                                            <Icon size={16} />
                                                        </span>
                                                        <div>
                                                            <span className="font-bold block text-green-800">{place.name}</span>
                                                            <span className="text-[10px] text-gray-500">{place.vicinity}</span>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
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
                        minRating={minRating}
                        setMinRating={setMinRating}
                        searchRadius={searchRadius}
                        setSearchRadius={setSearchRadius}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        t={t} convert={convert}
                    />
                )}
            </div>
        </div>
    );
}