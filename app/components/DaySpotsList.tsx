'use client';

import React, { useState } from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType } from '../types';
import { getWeatherIcon } from '../constants';
import ElevationChart from './ElevationChart';
import AddPlaceForm from './AddPlaceForm';
// Hooks
import { useWeather } from '../hooks/useWeather';
import { useElevation } from '../hooks/useElevation';

// Iconos
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconMountain = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
const IconPlus = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const IconLink = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
const IconLock = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>);

const CATEGORY_ORDER: Record<string, number> = {
    camping: 1, water: 2, gas: 3, supermarket: 4, laundry: 5, restaurant: 6, tourism: 7, custom: 8
};

interface DaySpotsListProps { 
    day: DailyPlan;
    places: Record<ServiceType, PlaceWithDistance[]>;
    loading: Record<ServiceType, boolean>;
    toggles: Record<ServiceType, boolean>;
    auditMode: boolean; 
    onToggle: (type: ServiceType) => void;
    onAddPlace: (place: PlaceWithDistance) => void;
    onRemovePlace: (placeId: string) => void;
    onHover: (place: PlaceWithDistance | null) => void;
}

const DaySpotsList: React.FC<DaySpotsListProps> = ({ day, places, loading, toggles, auditMode, onToggle, onAddPlace, onRemovePlace, onHover }) => {
    
    const rawCityName = day.to.replace('📍 Parada Táctica: ', '').replace('📍 Parada de Pernocta: ', '').split('|')[0].trim();
    
    // Hooks
    const { weather, weatherStatus } = useWeather(day.coordinates, day.isoDate);
    const { elevationData, loadingElevation, calculateElevation } = useElevation();

    // Estado Formulario
    const [showForm, setShowForm] = useState(false);
    const [placeToEdit, setPlaceToEdit] = useState<PlaceWithDistance | null>(null);

    const saved = (day.savedPlaces || []).sort((a, b) => (CATEGORY_ORDER[a.type || 'custom'] || 99) - (CATEGORY_ORDER[b.type || 'custom'] || 99));
    const isSaved = (id?: string) => id ? saved.some(p => p.place_id === id) : false;

    const handleEditStart = (place: PlaceWithDistance) => {
        if (!place.place_id) return;
        setPlaceToEdit(place);
        // Eliminamos temporalmente para evitar duplicados al guardar (como antes)
        onRemovePlace(place.place_id); 
        setShowForm(true);
    };

    const handleFormSave = (place: PlaceWithDistance) => {
        onAddPlace(place);
        setShowForm(false);
        setPlaceToEdit(null);
    };

    const handleFormCancel = () => {
        // Si cancelamos y estábamos editando, deberíamos restaurar el sitio.
        // Como simplificación por ahora, si el usuario cancela la edición de algo borrado, lo pierde (igual que antes).
        // UX improvement para el futuro: No borrar hasta Guardar.
        setShowForm(false);
        setPlaceToEdit(null);
    };

    const handlePlaceClick = (spot: PlaceWithDistance) => {
        if (spot.link) window.open(spot.link, '_blank');
        else if (spot.place_id && !spot.place_id.startsWith('custom-')) window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
    };

    const ServiceButton = ({ type, icon, label }: { type: ServiceType, icon: string, label: string }) => (
        <button onClick={() => onToggle(type)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 shadow-sm justify-center ${toggles[type] ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            <span>{icon}</span> {label}
        </button>
    );

    const ServiceList = ({ type, title, colorClass, icon, markerColor }: { type: ServiceType, title: string, colorClass: string, icon: string, markerColor: string }) => {
        if (!toggles[type] && type !== 'camping') return null; 
        const savedOfType = saved.find(s => s.type === type);
        let list = places[type];
        if (type === 'custom') list = saved.filter(s => s.type === 'custom');
        else if (savedOfType) list = [savedOfType];

        const isLoading = loading[type];
        if (type === 'custom' && list.length === 0) return null;

        return (
            <div className="animate-fadeIn mt-4">
                <h5 className={`text-xs font-bold ${colorClass} mb-2 border-b border-gray-100 pb-1 flex justify-between items-center`}><span className="flex items-center gap-1"><span>{icon}</span> {title}</span>{!isLoading && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{list.length}</span>}</h5>
                {isLoading && <p className="text-[10px] text-gray-400 animate-pulse">Buscando...</p>}
                {!isLoading && list.length > 0 && (
                    <div className="space-y-2">
                        {list.map((spot, idx) => (
                            <div key={`${type}-${idx}`} className={`group bg-white p-2 rounded border ${isSaved(spot.place_id) ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200'} hover:border-blue-400 transition-all flex gap-2 items-center shadow-sm`} onMouseEnter={() => onHover(spot)} onMouseLeave={() => onHover(null)}>
                                <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${markerColor}`}>{idx + 1}</div>
                                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handlePlaceClick(spot)}>
                                    <h6 className="text-xs font-bold text-gray-800 truncate">{spot.name}</h6>
                                    <div className="flex items-center gap-2">{spot.rating ? <span className="text-[10px] font-bold text-orange-500">★ {spot.rating}</span> : null}<span className="text-[10px] text-gray-400 truncate">{spot.vicinity?.split(',')[0]}</span></div>
                                    {auditMode && <div className="mt-1 pt-1 border-t border-gray-100 text-[9px] font-mono text-gray-500 bg-gray-50 p-1 rounded"><p><strong>Tags:</strong> {spot.types?.slice(0, 3).join(', ')}...</p></div>}
                                </div>
                                {type === 'custom' ? (
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(spot); }} className="text-blue-400 hover:text-blue-600 p-1"><IconEdit /></button>
                                        <button onClick={(e) => { e.stopPropagation(); spot.place_id && onRemovePlace(spot.place_id); }} className="text-red-400 hover:text-red-600 p-1"><IconTrash /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => isSaved(spot.place_id) ? (spot.place_id && onRemovePlace(spot.place_id)) : onAddPlace(spot)} className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${isSaved(spot.place_id) ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'}`}>{isSaved(spot.place_id) ? 'Borrar' : 'Elegir'}</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && list.length === 0 && type !== 'custom' && <p className="text-[10px] text-gray-400 italic">Sin resultados.</p>}
            </div>
        );
    };

    return (
        <div className={`p-4 rounded-xl space-y-4 h-full overflow-y-auto transition-all ${day.isDriving ? 'bg-red-50 border-l-4 border-red-600' : 'bg-orange-50 border-l-4 border-orange-400'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className={`text-xl font-extrabold ${day.isDriving ? 'text-red-800' : 'text-orange-800'}`}>
                        {day.isDriving ? 'Etapa de Conducción' : 'Día de Estancia'}
                    </h4>
                    <p className="text-md font-semibold text-gray-800">
                        {day.from.split('|')[0]} <span className="text-gray-400">➝</span> {rawCityName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{day.date}</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg shadow-sm border border-gray-100 text-right min-w-[80px]">
                    {weatherStatus === 'loading' && <div className="text-[10px] text-gray-400">Cargando...</div>}
                    {weatherStatus === 'far_future' && <div className="text-[10px] text-gray-400 leading-tight">📅 +14 días</div>}
                    {weatherStatus === 'success' && weather && (
                        <><div className="text-2xl">{getWeatherIcon(weather.code)}</div><div className="text-xs font-bold text-gray-800">{Math.round(weather.maxTemp)}° <span className="text-gray-400">/ {Math.round(weather.minTemp)}°</span></div><div className="text-[10px] text-blue-600 font-bold">💧 {weather.rainProb}%</div></>
                    )}
                </div>
            </div>

            {saved.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-green-500 shadow-md animate-fadeIn mt-2">
                    <h5 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1 border-b border-green-200 pb-1"><span>✅</span> MI PLAN:</h5>
                    <div className="space-y-1">
                        {saved.map((place, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-green-50 p-1.5 rounded cursor-pointer hover:bg-green-100" onMouseEnter={() => onHover(place)} onMouseLeave={() => onHover(null)} onClick={() => handlePlaceClick(place)}>
                                <div className="truncate flex-1 mr-2 flex items-center gap-2">
                                    <span className="font-bold text-lg">
                                       {place.type === 'camping' ? '🚐' : place.type === 'restaurant' ? '🍳' : place.type === 'water' ? '💧' : place.type === 'gas' ? '⛽' : place.type === 'supermarket' ? '🛒' : place.type === 'laundry' ? '🧺' : place.type === 'tourism' ? '📷' : '⭐'}
                                    </span>
                                    <div>
                                        <span className="font-medium text-green-900 truncate block">{place.name}</span>
                                        {place.link && <a href={place.link} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}><IconLink /> Ver Link</a>}
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center">
                                    {place.type === 'custom' && (
                                        <span title={place.isPublic ? "Público" : "Privado"}>{place.isPublic ? <IconEye /> : <IconLock />}</span>
                                    )}
                                    {place.type === 'custom' && (
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(place); }} className="text-blue-400 hover:text-blue-600 p-1"><IconEdit /></button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); place.place_id && onRemovePlace(place.place_id); }} className="text-red-400 hover:text-red-600 p-1"><IconTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!showForm ? (
                <button onClick={() => { setPlaceToEdit(null); setShowForm(true); }} className="w-full mt-3 mb-2 bg-gray-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition shadow-sm">
                    <IconPlus /> Añadir Sitio Personalizado
                </button>
            ) : (
                <AddPlaceForm initialData={placeToEdit} rawCityName={rawCityName} onSave={handleFormSave} onCancel={handleFormCancel} />
            )}

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-red-200 mt-2">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="px-2 py-1.5 rounded-lg bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 flex items-center gap-1 cursor-default shadow-sm justify-center"><span>🚐</span> Spots</div>
                        <ServiceButton type="water" icon="💧" label="Aguas" />
                        <ServiceButton type="gas" icon="⛽" label="Gas" />
                        <ServiceButton type="restaurant" icon="🍳" label="Comer" />
                        <ServiceButton type="supermarket" icon="🛒" label="Super" />
                        <ServiceButton type="laundry" icon="🧺" label="Lavar" />
                        <ServiceButton type="tourism" icon="📷" label="Turismo" />
                        <ServiceButton type="custom" icon="⭐" label="Otros" />
                    </div>
                    <div className="space-y-2">
                        <ServiceList type="camping" title="Áreas y Campings" colorClass="text-red-800" icon="🚐" markerColor="bg-red-600" />
                        <ServiceList type="water" title="Cambio de Aguas" colorClass="text-cyan-600" icon="💧" markerColor="bg-cyan-500" />
                        <ServiceList type="gas" title="Gasolineras" colorClass="text-orange-600" icon="⛽" markerColor="bg-orange-500" />
                        <ServiceList type="restaurant" title="Restaurantes" colorClass="text-blue-800" icon="🍳" markerColor="bg-blue-600" />
                        <ServiceList type="supermarket" title="Supermercados" colorClass="text-green-700" icon="🛒" markerColor="bg-green-600" />
                        <ServiceList type="laundry" title="Lavanderías" colorClass="text-purple-700" icon="🧺" markerColor="bg-purple-600" />
                        <ServiceList type="tourism" title="Turismo y Visitas" colorClass="text-yellow-600" icon="📷" markerColor="bg-yellow-500" />
                        <ServiceList type="custom" title="Sitios Personalizados" colorClass="text-gray-600" icon="⭐" markerColor="bg-gray-400" />
                    </div>
                     <div className="mt-4 pt-2 border-t border-gray-100">
                        {!elevationData && !loadingElevation && (
                            <button onClick={() => calculateElevation(day.from, day.coordinates)} className="w-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded border border-gray-300 flex items-center justify-center gap-2 transition">
                                <IconMountain /> Analizar Desnivel
                            </button>
                        )}
                        {loadingElevation && <p className="text-xs text-center text-gray-400 animate-pulse py-2">Calculando...</p>}
                        {elevationData && <ElevationChart data={elevationData} />}
                    </div>
                </div>
            )}
            {!day.isDriving && <p className="text-sm text-gray-700 mt-2">Día de relax en {rawCityName}.</p>}
        </div>
    );
};

export default DaySpotsList;