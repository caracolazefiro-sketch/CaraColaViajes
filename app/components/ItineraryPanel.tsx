'use client';

import React from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import DaySpotsList from './DaySpotsList';
import { ServiceIcons } from './ServiceIcons';
import { IconAlertCircle, IconDroplet, IconPrinter, IconPlus, IconTrash2, IconTruck, IconSearch, IconSettings, IconWind, WeatherIcon } from '../lib/svgIcons';
import { useWeather } from '../hooks/useWeather';

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

    const isImperial = convert(1, 'km') !== 1;

    return (
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full print:h-auto print:overflow-visible">
            <div className='p-0 h-full overflow-hidden print:h-auto print:overflow-visible'>
                
                {selectedDayIndex === null ? (
                    // VISTA RESUMEN (LISTA DE DÍAS)
                    <div className="overflow-y-auto h-full print:h-auto print:overflow-visible">
                        
                        {/* HEADER COMPACTO Y ELEGANTE */}
                        <div className="bg-gradient-to-br from-blue-50 via-white to-red-50 border-b border-gray-200 p-3 pb-2">
                            {tripName && (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <IconTruck size={18} className="text-red-600" />
                                    <h3 className="text-base font-bold text-gray-800">{tripName}</h3>
                                </div>
                            )}
                            
                            {/* Caja compacta con toda la info en una línea */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 mb-2">
                                <div className="flex items-center justify-between gap-3 text-[11px]">
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
                                        <span className="font-extrabold text-red-600 text-sm">{displayTotalKm}</span>
                                        <span className="text-gray-500 ml-0.5">{unitKm}</span>
                                    </div>
                                    
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    
                                    {/* Días */}
                                    <div className="text-center">
                                        <span className="font-extrabold text-red-600 text-sm">{dailyItinerary.length}</span>
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
                        <div className="p-3 space-y-2">
                            {dailyItinerary.map((day, index) => {
                                const displayDistance = day.distance ? convert(day.distance, 'km').toFixed(0) : '0';
                                const durationLabel = day.isDriving ? formatDuration(day.durationMin) : '';
                                const fromLabel = (day.from || '').split('|')[0];
                                const toLabel = (day.to || '').replace('📍 Parada Táctica: ', '').split('|')[0];
                                const nonDrivingLabel = (toLabel || fromLabel).trim();

                                // Reuse print formatter for on-screen compact route labels (remove postal/country).
                                const fromCompact = formatPrintPlace(fromLabel);
                                const toCompact = formatPrintPlace(toLabel);
                                const nonDrivingCompact = formatPrintPlace(nonDrivingLabel);
                                return (
                                    <div 
                                        key={index} 
                                        onClick={() => onSelectDay(index)}
                                        className="border border-gray-200 rounded-lg p-3 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all shadow-sm bg-white print-break group print:rounded-none print:p-2 print:border-b print:border-gray-200"
                                    >
                                        {/* 🖨️ PDF: 3 bloques justificados (mismo ancho en todas las etapas) */}
                                        <div className="hidden print:grid w-full items-center gap-0 text-[10px] text-gray-800 whitespace-nowrap overflow-visible grid-cols-[minmax(0,1.35fr)_minmax(0,0.55fr)_minmax(0,1.1fr)]">
                                            {/* BLOQUE 1: DÍA + FECHA + RUTA */}
                                            <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-3">
                                                <span className={`font-extrabold ${day.isDriving ? 'text-red-700' : 'text-orange-700'} shrink-0`}>
                                                    {formatPrintDayLabel(day.day, isImperial)}
                                                </span>
                                                <span className="text-gray-500 font-semibold shrink-0">{formatPrintDate(day.date)}</span>
                                                <span className="text-gray-300 shrink-0">•</span>
                                                <span className="font-semibold text-gray-800 truncate min-w-0">
                                                    {day.isDriving
                                                        ? `${formatPrintPlace(fromLabel)}>${formatPrintPlace(toLabel)}`
                                                        : formatPrintPlace(nonDrivingLabel)}
                                                </span>
                                            </div>

                                            {/* BLOQUE 2: KMS + TIEMPO DE CONDUCCIÓN */}
                                            <div className="flex items-center justify-center gap-2 min-w-0 px-3 border-l border-gray-200 overflow-hidden">
                                                <span className={`font-extrabold ${day.isDriving ? 'text-red-700' : 'text-gray-500'} shrink-0`}>
                                                    {displayDistance}
                                                    <span className="text-gray-500 font-semibold">{unitKm}</span>
                                                </span>
                                                <span className={`font-bold ${day.isDriving ? 'text-blue-700' : 'text-gray-500'} min-w-0 flex-1 truncate text-center`}>
                                                    {day.isDriving ? (durationLabel || '-') : (t('ITINERARY_RELAX') || '-')}
                                                </span>
                                            </div>

                                            {/* BLOQUE 3: CONDICIONES METEOROLÓGICAS */}
                                            <div className="flex items-center justify-start min-w-0 pl-3 border-l border-gray-200 text-[9px] tracking-tight">
                                                <PrintDayInlineWeather day={day} convert={convert} isImperial={isImperial} t={t} />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-1.5 print:hidden">
                                            <div className="flex items-baseline gap-2 min-w-0">
                                                <span className="font-bold text-red-700 text-xs flex items-center gap-1 shrink-0">
                                                    {day.isDriving ? '🚐' : '🏖️'} {t('STATS_DAY')} {day.day}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate">
                                                    {day.date}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono px-0 py-0 rounded">
                                                    {day.isDriving ? (
                                                        <span className="whitespace-nowrap">
                                                            <span className="text-red-600 font-bold">{displayDistance}</span>{' '}
                                                            <span className="text-gray-500">{unitKm}</span>
                                                            {durationLabel ? (
                                                                <>
                                                                    <span className="text-gray-300"> · </span>
                                                                    <span className="text-blue-600 font-bold">{durationLabel}</span>
                                                                </>
                                                            ) : null}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">{t('ITINERARY_RELAX')}</span>
                                                    )}
                                                </span>
                                                
                                                {/* Botón buscar servicios cerca de esta etapa */}
                                                {day.isDriving && day.coordinates && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSearchNearDay(index); }}
                                                        className="text-blue-600 hover:bg-blue-100 p-1 rounded-full border border-blue-200 bg-white shadow-sm transition-all no-print"
                                                        title="🔍 Buscar Servicios: Encuentra campings, gasolineras y restaurantes cerca de esta etapa. Ahorra tiempo localizando lo importante sin salir de tu ruta."
                                                    >
                                                        <IconSearch className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                
                                                {/* Botón ajustar destino de esta etapa */}
                                                {day.isDriving && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onAdjustDay(index); }}
                                                        className="text-orange-600 hover:bg-orange-100 p-1 rounded-full border border-orange-200 bg-white shadow-sm transition-all no-print"
                                                        title="⚙️ Ajustar Parada: Cambia el destino de esta etapa y recalcula automáticamente el resto del viaje. Perfecto para desvíos o sitios mejores."
                                                    >
                                                        <IconSettings className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                
                                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity no-print">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onAddDay(index); }}
                                                        className="text-green-600 hover:bg-green-100 p-1 rounded-full text-[10px] font-bold border border-green-200 bg-white shadow-sm"
                                                        title={t('ITINERARY_ADD_DAY')}
                                                    >
                                                        <IconPlusSm />
                                                    </button>
                                                    {!day.isDriving && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onRemoveDay(index); }}
                                                            className="text-red-500 hover:bg-red-100 p-1 rounded-full text-[10px] font-bold border border-red-200 bg-white shadow-sm"
                                                            title={t('ITINERARY_REMOVE_DAY')}
                                                        >
                                                            <IconTrashSm />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-gray-800 font-medium mb-1.5 print:hidden">
                                            {day.isDriving ? (
                                                <>
                                                    {fromCompact} ➝ {toCompact}
                                                </>
                                            ) : (
                                                <>{nonDrivingCompact}</>
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

function formatPrintDayLabel(dayNumber: number, isImperial: boolean) {
    const prefix = isImperial ? 'DAY' : 'DIA';
    const n = Number.isFinite(dayNumber) ? String(dayNumber).padStart(2, '0') : '00';
    return `${prefix}${n}`;
}

function formatPrintDate(input: string) {
    const raw = String(input || '').trim();
    // Prefer DD/MM/YY when possible
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
        const dd = String(m[1]).padStart(2, '0');
        const mm = String(m[2]).padStart(2, '0');
        const yy = String(m[3]).slice(-2);
        return `${dd}/${mm}/${yy}`;
    }
    return raw;
}

function formatPrintPlace(input: string) {
    const raw = String(input || '').trim();
    if (!raw) return '';

    // Keep only the first pipe-separated part (UI uses "label|meta").
    const firstPart = raw.split('|')[0]?.trim() ?? raw;

    // Remove tactical prefix if present.
    const noTactical = firstPart.replace(/^📍\s*Parada\s*Táctica:\s*/i, '').trim();

    // Keep only the city-ish part before commas (drop country/region).
    const beforeComma = noTactical.split(',')[0]?.trim() ?? noTactical;

    // Strip leading postal/route codes like "40100 Dax" or "08001 Barcelona".
    const noPostal = beforeComma.replace(/^\d{4,6}\s+/, '').trim();

    // Collapse excess whitespace.
    return noPostal.replace(/\s{2,}/g, ' ');
}

function PrintDayInlineWeather({
    day,
    t,
    convert,
    isImperial,
}: {
    day: DailyPlan;
    t: (key: string) => string;
    convert: (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => number;
    isImperial: boolean;
}) {
    const endCoords = day.coordinates ?? day.startCoordinates;
    const { routeWeather, weatherStatus } = useWeather(endCoords, day.isoDate, day.startCoordinates);

    const speedUnit = isImperial ? 'mph' : 'km/h';

    const formatTemp = (celsius: number) => {
        if (isImperial) return Math.round((celsius * 9 / 5) + 32);
        return Math.round(celsius);
    };

    if (!endCoords) {
        return (
            <span className="inline-flex items-center gap-1 text-gray-500">
                <IconAlertCircle size={12} /> {isImperial ? 'No coords' : 'Sin coords'}
            </span>
        );
    }

    if (weatherStatus === 'loading') {
        return <span className="text-gray-500">{t('FORM_LOADING')}</span>;
    }
    if (weatherStatus === 'far_future') {
        return <span className="text-gray-500">+14 {t('STATS_DAYS')}</span>;
    }
    if (weatherStatus === 'error' || !routeWeather?.end) {
        return <span className="text-gray-500">{isImperial ? 'No weather' : 'Sin clima'}</span>;
    }

    const end = routeWeather.end;
    const windDisplay = Math.round(convert(end.windSpeed, 'kph'));
    const tone = routeWeather.summary;

    const start = routeWeather.start;
    const worstWindKph = Math.max(start?.windSpeed ?? 0, end.windSpeed ?? 0);
    const worstRain = Math.max(start?.rainProb ?? 0, end.rainProb ?? 0);
    const codes = [start?.code, end.code].filter((c): c is number => typeof c === 'number');
    const hasSnow = codes.some((c) => (c >= 71 && c <= 77) || c === 85 || c === 86);

    // Compact alert tag for print: keep it short so it never needs truncation.
    const thresholds = tone === 'danger'
        ? { wind: 50, rain: 80 }
        : { wind: 25, rain: 40 };

    const alertParts: string[] = [];
    if (tone !== 'good') {
        if (hasSnow) alertParts.push(isImperial ? 'Snow' : 'Nieve');
        if (worstWindKph > thresholds.wind) {
            const worstWindDisplay = Math.round(convert(worstWindKph, 'kph'));
            alertParts.push(`${isImperial ? 'Wind' : 'Viento'} ${worstWindDisplay}${speedUnit}`);
        }
        if (worstRain > thresholds.rain) {
            alertParts.push(`${isImperial ? 'Rain' : 'Lluvia'} ${Math.round(worstRain)}%`);
        }
    }

    const alertText = alertParts.length ? alertParts.join(' · ') : null;

    return (
        <span className="inline-flex items-center gap-1 text-gray-700 whitespace-nowrap">
            <span className={tone === 'danger' ? 'text-red-700' : tone === 'caution' ? 'text-orange-700' : 'text-gray-700'}>
                <WeatherIcon code={end.code} size={13} className="inline-block" />
            </span>
            <span className="font-semibold">{formatTemp(end.maxTemp)}°/{formatTemp(end.minTemp)}°</span>
            {alertText && (
                <span className={`inline-flex items-center gap-1 ${tone === 'danger' ? 'text-red-800' : 'text-orange-800'} font-semibold`}>
                    <IconAlertCircle size={12} className="inline-block" />
                    <span>{alertText}</span>
                </span>
            )}
            <span className={`inline-flex items-center gap-1 ${end.rainProb > 50 ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                <IconDroplet size={12} className="inline-block" />
                <span>{end.rainProb}%</span>
            </span>
            <span className={`inline-flex items-center gap-1 ${end.windSpeed > 50 ? 'text-red-700 font-semibold' : end.windSpeed > 25 ? 'text-orange-700 font-semibold' : 'text-gray-600'}`}>
                <IconWind size={12} className="inline-block" />
                <span>{windDisplay}{speedUnit}</span>
            </span>
        </span>
    );
}