'use client';

import React, { useState, useEffect } from 'react';
import { DailyPlan, PlaceWithDistance, ServiceType, WeatherData } from '../types';
import { getWeatherIcon } from '../constants';
import ElevationChart from './ElevationChart';

// Iconos
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconMountain = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
const IconPlus = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const IconLink = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);

// JERARQUÍA DE ORDEN PARA "MI PLAN"
const CATEGORY_ORDER: Record<string, number> = {
    camping: 1,
    water: 2,
    gas: 3,
    supermarket: 4,
    laundry: 5,
    restaurant: 6,
    tourism: 7,
    custom: 99 // Lo último
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
    
    // ORDENAR LOS SITIOS GUARDADOS
    const saved = (day.savedPlaces || []).sort((a, b) => {
        const orderA = CATEGORY_ORDER[a.type || 'custom'] || 99;
        const orderB = CATEGORY_ORDER[b.type || 'custom'] || 99;
        return orderA - orderB;
    });

    const isSaved = (id?: string) => id ? saved.some(p => p.place_id === id) : false;
    
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'far_future' | 'error'>('loading');
    const [elevationData, setElevationData] = useState<{ distance: number, elevation: number }[] | null>(null);
    const [loadingElevation, setLoadingElevation] = useState(false);
    
    // ESTADO FORMULARIO MANUAL
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [customLat, setCustomLat] = useState('');
    const [customLng, setCustomLng] = useState('');
    const [customType, setCustomType] = useState<ServiceType>('custom');

    // CLIMA
    useEffect(() => {
        if (!day.coordinates || !day.isoDate) return;
        const fetchWeather = async () => {
            setWeatherStatus('loading');
            const today = new Date();
            const tripDate = new Date(day.isoDate);
            const diffDays = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 || diffDays > 14) { setWeatherStatus('far_future'); return; }
            if (!day.coordinates) return;
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${day.coordinates.lat}&longitude=${day.coordinates.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${day.isoDate}&end_date=${day.isoDate}`);
                const data = await res.json();
                if (data.daily) {
                    setWeather({ code: data.daily.weather_code[0], maxTemp: data.daily.temperature_2m_max[0], minTemp: data.daily.temperature_2m_min[0], rainProb: data.daily.precipitation_probability_max[0] });
                    setWeatherStatus('success');
                } else setWeatherStatus('error');
            } catch (e) { setWeatherStatus('error'); }
        };
        fetchWeather();
        setElevationData(null);
    }, [day.coordinates, day.isoDate]);

    // ELEVACION
    const handleCalcElevation = () => {
        if (typeof google === 'undefined' || !day.coordinates) return;
        setLoadingElevation(true);
        const cleanFrom = day.from.split('|')[0];
        const ds = new google.maps.DirectionsService();
        if (!day.coordinates) return;
        const dest = new google.maps.LatLng(day.coordinates.lat, day.coordinates.lng);
        ds.route({
            origin: cleanFrom, destination: dest, travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === 'OK' && result) {
                const path = result.routes[0].overview_path;
                const es = new google.maps.ElevationService();
                es.getElevationAlongPath({ path: path, samples: 100 }, (elevations, statusElev) => {
                    setLoadingElevation(false);
                    if (statusElev === 'OK' && elevations) {
                        const data = elevations.map((e, i) => ({ distance: i, elevation: e.elevation }));
                        setElevationData(data);
                    }
                });
            } else { setLoadingElevation(false); }
        });
    };

    // GUARDAR SITIO MANUAL CON COORDENADAS Y LINK
    const handleSaveCustom = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Construir objeto de ubicación si hay coordenadas
        let geometry = undefined;
        if (customLat && customLng && typeof google !== 'undefined') {
             geometry = {
                 location: new google.maps.LatLng(parseFloat(customLat), parseFloat(customLng))
             };
        }

        const newPlace: PlaceWithDistance = {
            name: customName,
            vicinity: customDesc, 
            link: customLink, // Guardamos el link real
            place_id: `custom-${Date.now()}`, 
            type: customType,
            rating: 0,
            distanceFromCenter: 0,
            types: ['custom'],
            geometry: geometry // Si hay geometría, el mapa lo pintará
        };
        
        onAddPlace(newPlace);
        
        // Reset
        setCustomName(''); setCustomDesc(''); setCustomLink(''); setCustomLat(''); setCustomLng('');
        setCustomType('custom'); setShowCustomForm(false);
    };

    // CLICK INTELIGENTE
    const handlePlaceClick = (spot: PlaceWithDistance) => {
        if (spot.link) {
            // Si tiene link propio (Park4Night, web...), usarlo
            window.open(spot.link, '_blank');
        } else if (spot.place_id && !spot.place_id.startsWith('custom-')) {
            // Si es de Google, abrir Maps
            window.open(`https://www.google.com/maps/place/?q=place_id:${spot.place_id}`, '_blank');
        }
        // Si es custom y no tiene link, no hacemos nada
    };

    const ServiceButton = ({ type, icon, label }: { type: ServiceType, icon: string, label: string }) => (
        <button onClick={() => onToggle(type)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 shadow-sm flex-grow justify-center ${toggles[type] ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            <span>{icon}</span> {label}
        </button>
    );

    const ServiceList = ({ type, title, colorClass, icon, markerColor }: { type: ServiceType, title: string, colorClass: string, icon: string, markerColor: string }) => {
        if (!toggles[type] && type !== 'camping') return null; 
        const savedOfType = saved.find(s => s.type === type);
        let list = places[type];
        if (savedOfType && type !== 'tourism') list = [savedOfType]; // Modo foco
        const isLoading = loading[type];

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
                                <button onClick={() => isSaved(spot.place_id) ? (spot.place_id && onRemovePlace(spot.place_id)) : onAddPlace(spot)} className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${isSaved(spot.place_id) ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'}`}>{isSaved(spot.place_id) ? 'Borrar' : 'Elegir'}</button>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && list.length === 0 && <p className="text-[10px] text-gray-400 italic">Sin resultados.</p>}
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

            {day.isDriving && (
                <div className="mt-2">
                    {!elevationData && !loadingElevation && (
                        <button onClick={handleCalcElevation} className="w-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded border border-gray-300 flex items-center justify-center gap-2 transition">
                            <IconMountain /> Analizar Desnivel (Pava-Check) 🏔️
                        </button>
                    )}
                    {loadingElevation && <p className="text-xs text-center text-gray-400 animate-pulse py-2">Calculando...</p>}
                    {elevationData && <ElevationChart data={elevationData} />}
                </div>
            )}

            {/* LISTA DE PLAN ORDENADA */}
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
                                    <span className="font-medium text-green-900 truncate">{place.name}</span>
                                    {place.link && <IconLink />}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); place.place_id && onRemovePlace(place.place_id); }} className="text-red-400 hover:text-red-600"><IconTrash /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BOTÓN AÑADIR PERSONALIZADO */}
            <button onClick={() => setShowCustomForm(!showCustomForm)} className="w-full mt-3 mb-2 bg-gray-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition shadow-sm">
                <IconPlus /> {showCustomForm ? 'Cancelar' : 'Añadir Sitio Personalizado'}
            </button>

            {/* FORMULARIO AÑADIR */}
            {showCustomForm && (
                <form onSubmit={handleSaveCustom} className="bg-gray-100 p-3 rounded-lg mb-4 border border-gray-300 animate-fadeIn">
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Nombre (ej: P4N Área)" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" required />
                            <select value={customType} onChange={e => setCustomType(e.target.value as ServiceType)} className="w-full p-2 text-xs rounded border border-gray-300 bg-white outline-none">
                                <option value="custom">⭐ Otro</option>
                                <option value="camping">🚐 Pernocta</option>
                                <option value="restaurant">🍳 Restaurante</option>
                                <option value="water">💧 Aguas</option>
                                <option value="gas">⛽ Gasolinera</option>
                                <option value="supermarket">🛒 Super</option>
                                <option value="tourism">📷 Turismo</option>
                            </select>
                        </div>
                        <input type="text" placeholder="Link URL (ej: https://park4night...)" value={customLink} onChange={e => setCustomLink(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                        <input type="text" placeholder="Descripción corta (ej: Cerca del río)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                        
                        {/* COORDENADAS OPCIONALES PARA MAPA */}
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Lat (ej: 39.49)" value={customLat} onChange={e => setCustomLat(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                            <input type="text" placeholder="Lng (ej: -0.32)" value={customLng} onChange={e => setCustomLng(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                        </div>
                        <p className="text-[9px] text-gray-500 italic">* Pon coordenadas si quieres ver la chincheta en el mapa.</p>

                        <button type="submit" className="w-full bg-green-600 text-white py-1.5 rounded text-xs font-bold hover:bg-green-700">Guardar en Mi Plan</button>
                    </div>
                </form>
            )}

            {day.isDriving && (
                <div className="pt-3 border-t border-dashed border-red-200 mt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <div className="px-2 py-1.5 rounded-lg bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 flex items-center gap-1 cursor-default shadow-sm flex-grow justify-center"><span>🚐</span> Spots</div>
                        <ServiceButton type="water" icon="💧" label="Aguas" />
                        <ServiceButton type="gas" icon="⛽" label="Gas" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <ServiceButton type="restaurant" icon="🍳" label="Comer" />
                        <ServiceButton type="supermarket" icon="🛒" label="Super" />
                        <ServiceButton type="laundry" icon="🧺" label="Lavar" />
                        <ServiceButton type="tourism" icon="📷" label="Turismo" />
                    </div>
                    <div className="space-y-2">
                        <ServiceList type="camping" title="Áreas y Campings" colorClass="text-red-800" icon="🚐" markerColor="bg-red-600" />
                        <ServiceList type="water" title="Cambio de Aguas" colorClass="text-cyan-600" icon="💧" markerColor="bg-cyan-500" />
                        <ServiceList type="gas" title="Gasolineras" colorClass="text-orange-600" icon="⛽" markerColor="bg-orange-500" />
                        <ServiceList type="restaurant" title="Restaurantes" colorClass="text-blue-800" icon="🍳" markerColor="bg-blue-600" />
                        <ServiceList type="supermarket" title="Supermercados" colorClass="text-green-700" icon="🛒" markerColor="bg-green-600" />
                        <ServiceList type="laundry" title="Lavanderías" colorClass="text-purple-700" icon="🧺" markerColor="bg-purple-600" />
                        <ServiceList type="tourism" title="Turismo" colorClass="text-yellow-600" icon="📷" markerColor="bg-yellow-500" />
                    </div>
                </div>
            )}
            {!day.isDriving && <p className="text-sm text-gray-700 mt-2">Día de relax en {rawCityName}.</p>}
        </div>
    );
};

export default DaySpotsList;