'use client';

import React, { useState } from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import { getWeatherIcon } from '../constants';
import ElevationChart from './ElevationChart';
import AddPlaceForm from './AddPlaceForm';
import StarRating from './StarRating';
import { useWeather } from '../hooks/useWeather';
import { useElevation } from '../hooks/useElevation';
import { ServiceIcons } from './ServiceIcons';

// Iconos
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconMountain = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
interface IconPlusProps {
    className?: string;
}
const IconPlus: React.FC<IconPlusProps> = ({ className = "h-4 w-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const IconLink = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
const IconLock = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>);

const CATEGORY_ORDER: Record<string, number> = {
    camping: 1, water: 2, gas: 3, supermarket: 4, laundry: 5, restaurant: 6, tourism: 7, custom: 8
};

interface ServiceButtonProps {
    type: ServiceType;
    label: string;
    toggles: Record<ServiceType, boolean>;
    onToggle: (type: ServiceType) => void;
    count?: number;
}

const ServiceButton: React.FC<ServiceButtonProps> = ({ type, label, toggles, onToggle, count = 0 }) => {
    const Icon = ServiceIcons[type as keyof typeof ServiceIcons];
    const isActive = toggles[type];
    
    return (
        <button 
            onClick={() => onToggle(type)} 
            className={`relative px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 shadow-sm hover:scale-105 active:scale-95 ${
                isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700 shadow-blue-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
        >
            {/* Icono */}
            {Icon && (
                <div className={`p-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <Icon size={16} className={isActive ? 'text-white' : 'text-gray-600'} />
                </div>
            )}
            
            {/* Label */}
            <span className="text-[10px] leading-tight text-center">{label}</span>
            
            {/* Contador de resultados */}
            {count > 0 && (
                <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                    isActive 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-600 text-white'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );
};

interface ServiceListProps {
    type: ServiceType;
    title: string;
    colorClass: string;
    markerColor: string;
    places: Record<ServiceType, PlaceWithDistance[]>;
    loading: Record<ServiceType, boolean>;
    toggles: Record<ServiceType, boolean>;
    saved: PlaceWithDistance[];
    t: (key: string) => string;
    isSaved: (id?: string) => boolean;
    onAddPlace: (place: PlaceWithDistance) => void;
    onRemovePlace: (placeId: string) => void;
    onHover: (place: PlaceWithDistance | null) => void;
    handlePlaceClick: (spot: PlaceWithDistance) => void;
    handleEditStart: (place: PlaceWithDistance) => void;
    auditMode: boolean;
}

const ServiceList: React.FC<ServiceListProps> = ({
    type, title, colorClass, markerColor, places, loading, toggles, saved, t, isSaved, onAddPlace, onRemovePlace, onHover, handlePlaceClick, handleEditStart, auditMode
}) => {
    const Icon = ServiceIcons[type as keyof typeof ServiceIcons];
    const isSpecialType = type === 'search' || type === 'custom';
    const savedOfType = saved.filter(s => s.type === type);
    const hasResults = places[type]?.length > 0 || savedOfType.length > 0;
    
    // Si toggle OFF y no hay lugares guardados → no mostrar nada
    if (!toggles[type] && savedOfType.length === 0 && !isSpecialType) return null;
    if (type === 'search' && !hasResults && !toggles[type]) return null;
    if (type === 'custom' && !hasResults) return null;

    // Construir lista: siempre mostrar guardados, añadir búsquedas solo si toggle ON
    let list: PlaceWithDistance[] = [];
    if (type === 'custom' || type === 'search' || type === 'found') {
        list = savedOfType;
    } else if (savedOfType.length > 0 && toggles[type]) {
        // Toggle ON: guardados + búsquedas
        list = [...savedOfType, ...places[type]].filter((v,i,a)=>a.findIndex(t=>(t.place_id === v.place_id))===i);
    } else if (savedOfType.length > 0 && !toggles[type]) {
        // Toggle OFF: solo guardados
        list = savedOfType;
    } else if (toggles[type]) {
        // Toggle ON sin guardados: solo búsquedas
        list = places[type];
    }

    const isLoading = loading[type];
    if ((type === 'custom' || type === 'search' || type === 'found') && list.length === 0) return null;

    return (
        <div className="animate-fadeIn mt-4">
            <h5 className={`text-xs font-bold ${colorClass} mb-2 border-b border-gray-100 pb-1 flex justify-between items-center`}><span className="flex items-center gap-1">{Icon && <Icon size={14} />} {title}</span>{!isLoading && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{list.length}</span>}</h5>
            {isLoading && <p className="text-[10px] text-gray-400 animate-pulse">{t('FORM_LOADING')}</p>}
            {!isLoading && list.length > 0 && (
                <div className="space-y-2">
                    {list.map((spot, idx) => {
                        // Calcular badges
                        const isTop3 = idx < 3;
                        const isExcellent = (spot.rating || 0) >= 4.5;
                        const isPopular = (spot.user_ratings_total || 0) >= 100;
                        const isNearby = (spot.distanceFromCenter || 999999) < 3000;
                        
                        return (
                        <div key={`${type}-${idx}`} className={`group bg-white p-3 rounded border ${isSaved(spot.place_id) ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200'} hover:border-blue-400 transition-all flex gap-3 shadow-sm`} onMouseEnter={() => onHover(spot)} onMouseLeave={() => onHover(null)}>
                            <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${markerColor}`}>{idx + 1}</div>
                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handlePlaceClick(spot)}>
                                {/* Nombre + Badges */}
                                <div className="flex items-start gap-2 mb-1">
                                    <h6 className="text-sm font-bold text-gray-800 flex-1 leading-tight">{spot.name}</h6>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {isTop3 && <span className="text-sm" title="Top 3 mejores">🏆</span>}
                                        {isExcellent && <span className="text-sm" title="Excelente valoración">💎</span>}
                                        {isPopular && <span className="text-sm" title="Muy popular">🔥</span>}
                                        {isNearby && <span className="text-sm" title="Muy cerca">📍</span>}
                                    </div>
                                </div>
                                
                                {/* Línea de métricas principales */}
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                    {spot.rating !== undefined && (
                                        <StarRating rating={spot.rating} size={12} />
                                    )}
                                    {spot.user_ratings_total !== undefined && (
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            reviews: {spot.user_ratings_total}
                                        </span>
                                    )}
                                    {spot.distanceFromCenter !== undefined && (
                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                            dist: {(spot.distanceFromCenter / 1000).toFixed(1)}km
                                        </span>
                                    )}
                                    {spot.score !== undefined && (
                                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-300">
                                            score: {spot.score}/100
                                        </span>
                                    )}
                                </div>
                                
                                {/* Dirección */}
                                <div className="text-[10px] text-gray-500 truncate">
                                    {spot.vicinity?.split(',').slice(0, 2).join(', ')}
                                </div>
                                
                                {/* Nota personal (si existe) */}
                                {spot.note && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-gray-700 italic">
                                        💡 {spot.note}
                                    </div>
                                )}
                                
                                {auditMode && (
                                    <div className="mt-1 pt-1 border-t border-gray-200 space-y-0.5">
                                        <div className="flex gap-1 flex-wrap text-[9px]">
                                            {spot.type && (
                                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono border border-blue-200">
                                                    type: {spot.type}
                                                </span>
                                            )}
                                            {spot.distanceFromCenter !== undefined && (
                                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono border border-purple-200">
                                                    dist: {Math.round(spot.distanceFromCenter)}m
                                                </span>
                                            )}
                                            {spot.user_ratings_total !== undefined && (
                                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-mono border border-orange-200">
                                                    reviews: {spot.user_ratings_total}
                                                </span>
                                            )}
                                            {spot.score !== undefined && (
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono border border-green-200">
                                                    score: {spot.score}/100
                                                </span>
                                            )}
                                        </div>
                                        {spot.types && spot.types.length > 0 && (
                                            <div className="text-[8px] text-gray-500 font-mono">
                                                Google types: {spot.types.slice(0, 3).join(', ')}
                                            </div>
                                        )}
                                        {spot.opening_hours !== undefined && (
                                            <div className="text-[8px] font-mono">
                                                <span className={spot.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}>
                                                    {spot.opening_hours.open_now ? '🟢 Abierto' : '🔴 Cerrado'}
                                                </span>
                                            </div>
                                        )}
                                        {spot.place_id && (
                                            <div className="text-[8px] text-gray-400 font-mono truncate">
                                                ID: {spot.place_id}
                                            </div>
                                        )}
                                        {spot.photoUrl ? (
                                            <div className="text-[8px] text-green-600 font-mono">
                                                📷 Foto disponible
                                            </div>
                                        ) : (
                                            <div className="text-[8px] text-red-600 font-mono">
                                                ❌ Sin foto
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {type === 'custom' || type === 'search' || type === 'found' ? (
                                <div className="flex gap-1 items-center">
                                    {(type === 'custom' || type === 'search' || type === 'found') && (
                                        <span title={spot.isPublic === false ? "Private" : "Public"}>{spot.isPublic === false ? <IconLock /> : <IconEye />}</span>
                                    )}
                                    {(type === 'custom' || type === 'search' || type === 'found') && (
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(spot); }} className="text-blue-400 hover:text-blue-600 p-1"><IconEdit /></button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); spot.place_id && onRemovePlace(spot.place_id); }} className="text-red-400 hover:text-red-600 p-1"><IconTrash /></button>
                                </div>
                            ) : (
                                <button onClick={() => isSaved(spot.place_id) ? (spot.place_id && onRemovePlace(spot.place_id)) : onAddPlace(spot)} className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${isSaved(spot.place_id) ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'}`}>{isSaved(spot.place_id) ? 'Borrar' : t('MAP_ADD')}</button>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
            {!isLoading && list.length === 0 && type !== 'custom' && <p className="text-[10px] text-gray-400 italic">Sin resultados.</p>}
        </div>
    );
};

interface DaySpotsListProps { 
    day: DailyPlan;
    places: Record<ServiceType, PlaceWithDistance[]>;
    loading: Record<ServiceType, boolean>;
    toggles: Record<ServiceType, boolean>;
    onToggle: (type: ServiceType) => void;
    onAddPlace: (place: PlaceWithDistance) => void;
    onRemovePlace: (placeId: string) => void;
    onHover: (place: PlaceWithDistance | null) => void;
    t: (key: string) => string;
    convert: (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => number;
    auditMode: boolean;
}

const DaySpotsList: React.FC<DaySpotsListProps> = ({ 
    day, places, loading, toggles, onToggle, onAddPlace, onRemovePlace, onHover, t, convert, auditMode 
}) => {
    
    const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split('|')[0].trim();
    const { routeWeather, weatherStatus } = useWeather(day.coordinates, day.isoDate, day.startCoordinates);
    const { elevationData, loadingElevation, calculateElevation, clearElevation } = useElevation();

    const [showForm, setShowForm] = useState(false);
    const [placeToEdit, setPlaceToEdit] = useState<PlaceWithDistance | null>(null);

    const saved = (day.savedPlaces || []).sort((a, b) => (CATEGORY_ORDER[a.type || 'custom'] || 99) - (CATEGORY_ORDER[b.type || 'custom'] || 99));
    const isSaved = (id?: string) => id ? saved.some(p => p.place_id === id) : false;

    // Detectamos si estamos en modo imperial (si 1 km != 1 unidad)
    const isImperial = convert(1, 'km') !== 1;
    const speedUnit = isImperial ? 'mph' : 'km/h';
    const tempUnit = isImperial ? '°F' : '°C';

    // Helper para convertir temperatura
    const formatTemp = (celsius: number) => {
        if (isImperial) {
            return Math.round((celsius * 9/5) + 32);
        }
        return Math.round(celsius);
    };

    const handleEditStart = (place: PlaceWithDistance) => {
        if (!place.place_id) return;
        setPlaceToEdit(place);
        setShowForm(true);
        // NO borramos aquí - esperamos a que guarde
    };

    const handleFormSave = (place: PlaceWithDistance) => {
        console.log('📥 Recibiendo en handleFormSave:', { name: place.name, type: place.type, isPublic: place.isPublic });
        // Si estamos editando, primero borramos el original
        if (placeToEdit && placeToEdit.place_id) {
            onRemovePlace(placeToEdit.place_id);
        }
        onAddPlace(place);
        setShowForm(false);
        setPlaceToEdit(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setPlaceToEdit(null);
        // No hacemos nada más - el lugar sigue en la lista
    };

    const handlePlaceClick = (spot: PlaceWithDistance) => {
        if (spot.link) window.open(spot.link, '_blank');
        else if (spot.place_id && !spot.place_id.startsWith('custom-')) window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
    };

    return (
        <div className={`p-4 rounded-xl space-y-4 h-full overflow-y-auto transition-all ${day.isDriving ? 'bg-red-50 border-l-4 border-red-600' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-red-800' : 'text-orange-800'}`}>
                        {day.isDriving ? t('ITINERARY_DRIVING') : t('ITINERARY_STAY')}
                    </h4>
                    <p className="text-md font-semibold text-gray-800">
                        {day.from.split('|')[0]} <span className="text-gray-400">➝</span> {rawCityName}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 font-mono">{day.date}</p>
                        {day.isDriving && (
                            <p className="text-xs text-red-600 font-bold ml-4">
                                {convert(day.distance, 'km').toFixed(0)} {isImperial ? 'mi' : 'km'}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* 🌡️ WIDGET CLIMA: SEMÁFORO DE RUTA + TEMPERATURA */}
                <div className="bg-white/90 p-2 rounded-lg shadow-sm border border-gray-100 text-right min-w-[90px]">
                    {weatherStatus === 'loading' && <div className="text-[10px] text-gray-400">{t('FORM_LOADING')}</div>}
                    {weatherStatus === 'far_future' && <div className="text-[10px] text-gray-400 leading-tight">📅 +14 {t('STATS_DAYS')}</div>}
                    {weatherStatus === 'success' && routeWeather && routeWeather.end && (
                        <div>
                            <div className="flex justify-end gap-2 items-center mb-1">
                                {routeWeather.summary === 'danger' && <span className="animate-pulse text-red-600" title="Alert">⚠️</span>}
                                <span className="text-2xl">{getWeatherIcon(routeWeather.end.code)}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-800">
                                {/* 🌡️ CONVERSIÓN DE TEMPERATURA AQUÍ */}
                                {formatTemp(routeWeather.end.maxTemp)}° <span className="text-gray-400">/ {formatTemp(routeWeather.end.minTemp)}°{tempUnit}</span>
                            </div>
                            
                            <div className="flex flex-col text-[9px] mt-1 gap-0.5">
                                <span className={`${routeWeather.end.rainProb > 50 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                    💧 {routeWeather.end.rainProb}%
                                </span>
                                <span className={`${routeWeather.end.windSpeed > 25 ? 'text-orange-600 font-bold' : 'text-gray-400'}`} title="Wind">
                                    {/* 🔄 Conversión de unidad de viento: kph a mph si es necesario */}
                                    💨 {Math.round(convert(routeWeather.end.windSpeed, 'kph'))} {speedUnit}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Aviso de Peligro si el semáforo es Rojo */}
            {weatherStatus === 'success' && routeWeather?.summary === 'danger' && (
                <div className="bg-red-100 border border-red-200 text-red-800 p-2 rounded text-xs flex items-center gap-2">
                    <span className="text-lg">🚨</span>
                    <div>
                        <span className="font-bold block">{isImperial ? 'Caution on Route' : 'Precaución en ruta'}</span>
                        {isImperial 
                            ? `Strong wind (${Math.round(convert(routeWeather.end?.windSpeed || 0, 'kph'))} mph) or bad weather.`
                            : `Viento fuerte (${Math.round(routeWeather.end?.windSpeed || 0)} km/h) o condiciones adversas.`
                        }
                    </div>
                </div>
            )}

            {saved.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-green-500 shadow-md animate-fadeIn mt-2">
                    <h5 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1 border-b border-green-200 pb-1"><span>✅</span> {t('ITINERARY_PLAN')}:</h5>
                    <div className="space-y-1">
                        {saved.map((place, i) => {
                            const Icon = ServiceIcons[place.type as keyof typeof ServiceIcons] || ServiceIcons.custom;
                            return (
                            <div key={i} className="flex justify-between items-center text-xs bg-green-50 p-1.5 rounded cursor-pointer hover:bg-green-100" onMouseEnter={() => onHover(place)} onMouseLeave={() => onHover(null)} onClick={() => handlePlaceClick(place)}>
                                <div className="truncate flex-1 mr-2 flex items-center gap-2">
                                    <span className="text-gray-600">
                                        <Icon size={16} />
                                    </span>
                                    <div>
                                        <span className="font-medium text-green-900 truncate block">{place.name}</span>
                                        {place.link && <a href={place.link} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}><IconLink /> {isImperial ? 'View Link' : 'Ver Link'}</a>}
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center">
                                    {(place.type === 'custom' || place.type === 'search' || place.type === 'found') && (
                                        <span title={place.isPublic === false ? "Private" : "Public"}>{place.isPublic === false ? <IconLock /> : <IconEye />}</span>
                                    )}
                                    {(place.type === 'custom' || place.type === 'search' || place.type === 'found') && (
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(place); }} className="text-blue-400 hover:text-blue-600 p-1"><IconEdit /></button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); place.place_id && onRemovePlace(place.place_id); }} className="text-red-400 hover:text-red-600 p-1"><IconTrash /></button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL POPUP PARA EL FORMULARIO */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleFormCancel}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                {placeToEdit ? (isImperial ? 'Edit Place' : 'Editar Lugar') : (isImperial ? 'Add Place' : 'Añadir Sitio')}
                            </h3>
                            <button onClick={handleFormCancel} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-4">
                            <AddPlaceForm initialData={placeToEdit} rawCityName={rawCityName} onSave={handleFormSave} onCancel={handleFormCancel} />
                        </div>
                    </div>
                </div>
            )}

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-red-200 mt-2">
                    {/* Grid de botones de servicios compacto */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <ServiceButton type="camping" label="Spots" toggles={toggles} onToggle={onToggle} count={places.camping?.length || 0} />
                        <ServiceButton type="water" label={t('SERVICE_WATER')} toggles={toggles} onToggle={onToggle} count={places.water?.length || 0} />
                        <ServiceButton type="gas" label={t('SERVICE_GAS')} toggles={toggles} onToggle={onToggle} count={places.gas?.length || 0} />
                        <ServiceButton type="restaurant" label={t('SERVICE_EAT')} toggles={toggles} onToggle={onToggle} count={places.restaurant?.length || 0} />
                        <ServiceButton type="supermarket" label={t('SERVICE_SUPERMARKET')} toggles={toggles} onToggle={onToggle} count={places.supermarket?.length || 0} />
                        <ServiceButton type="laundry" label={t('SERVICE_LAUNDRY')} toggles={toggles} onToggle={onToggle} count={places.laundry?.length || 0} />
                        <ServiceButton type="tourism" label={t('SERVICE_TOURISM')} toggles={toggles} onToggle={onToggle} count={places.tourism?.length || 0} />
                        <ServiceButton type="custom" label={t('SERVICE_CUSTOM')} toggles={toggles} onToggle={onToggle} count={saved.filter(s => s.type === 'custom').length} />
                        {saved.filter(s => s.type === 'search').length > 0 && (
                            <ServiceButton type="search" label="Buscados" toggles={toggles} onToggle={onToggle} count={saved.filter(s => s.type === 'search').length} />
                        )}
                        {saved.filter(s => s.type === 'found').length > 0 && (
                            <ServiceButton type="found" label="Encontrados" toggles={toggles} onToggle={onToggle} count={saved.filter(s => s.type === 'found').length} />
                        )}
                        {/* Botón Añadir Sitio como parte del grid */}
                        <button 
                            onClick={() => { setPlaceToEdit(null); setShowForm(true); }} 
                            className="px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 shadow-sm hover:scale-105 active:scale-95 bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md"
                        >
                            <div className="p-1 rounded-full bg-gray-100">
                                <IconPlus className="text-gray-600" />
                            </div>
                            <span className="text-[10px] leading-tight text-center">{t('MAP_ADD')} {isImperial ? 'Place' : 'Sitio'}</span>
                        </button>
                    </div>
                    <div className="space-y-2">
                        <ServiceList type="camping" title={t('SERVICE_CAMPING')} colorClass="text-red-800" markerColor="bg-red-600" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="water" title={t('SERVICE_WATER')} colorClass="text-cyan-600" markerColor="bg-cyan-500" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="gas" title={t('SERVICE_GAS')} colorClass="text-orange-600" markerColor="bg-orange-500" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="restaurant" title={t('SERVICE_EAT')} colorClass="text-blue-800" markerColor="bg-blue-600" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="supermarket" title={t('SERVICE_SUPERMARKET')} colorClass="text-green-700" markerColor="bg-green-600" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="laundry" title={t('SERVICE_LAUNDRY')} colorClass="text-purple-700" markerColor="bg-purple-600" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="tourism" title={t('SERVICE_TOURISM')} colorClass="text-yellow-600" markerColor="bg-yellow-500" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        <ServiceList type="custom" title={t('SERVICE_CUSTOM')} colorClass="text-gray-600" markerColor="bg-gray-400" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        {saved.filter(s => s.type === 'search').length > 0 && (
                            <ServiceList type="search" title="Buscados" colorClass="text-blue-600" markerColor="bg-blue-500" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        )}
                        {saved.filter(s => s.type === 'found').length > 0 && (
                            <ServiceList type="found" title="Encontrados" colorClass="text-teal-600" markerColor="bg-teal-500" places={places} loading={loading} toggles={toggles} saved={saved} t={t} isSaved={isSaved} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} onHover={onHover} handlePlaceClick={handlePlaceClick} handleEditStart={handleEditStart} auditMode={auditMode} />
                        )}
                    </div>
                     <div className="mt-4 pt-2 border-t border-gray-100">
                        {!elevationData && !loadingElevation && (
                            <button onClick={() => calculateElevation(day.from, day.coordinates)} className="w-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded border border-gray-300 flex items-center justify-center gap-2 transition">
                                <IconMountain /> {isImperial ? 'Check Elevation' : 'Analizar Desnivel'}
                            </button>
                        )}
                        {loadingElevation && <p className="text-xs text-center text-gray-400 animate-pulse py-2">{t('FORM_LOADING')}</p>}
                        {elevationData && (
                            <div className="relative">
                                <button 
                                    onClick={clearElevation} 
                                    className="absolute top-2 left-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all hover:scale-110"
                                    title={isImperial ? 'Close' : 'Cerrar'}
                                >
                                    ✕
                                </button>
                                <ElevationChart data={elevationData} />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {!day.isDriving && <p className="text-sm text-gray-700 mt-2">{isImperial ? `Relax day in ${rawCityName}.` : `Día de relax en ${rawCityName}.`}</p>}
        </div>
    );
};

export default DaySpotsList;