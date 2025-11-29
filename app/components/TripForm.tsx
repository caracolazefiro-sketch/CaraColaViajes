'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { TripResult } from '../types';

// Iconos
const IconSearchLoc = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
const IconChevronDown = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>);
const IconChevronUp = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>);

// Iconos Stats
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

interface TripFormProps {
    formData: any;
    setFormData: (data: any) => void;
    loading: boolean;
    results: TripResult; // NUEVO: Recibe los resultados para el resumen
    onSubmit: (e: React.FormEvent) => void;
    showWaypoints: boolean;
    setShowWaypoints: (show: boolean) => void;
}

export default function TripForm({ formData, setFormData, loading, results, onSubmit, showWaypoints, setShowWaypoints }: TripFormProps) {
    
    const [isExpanded, setIsExpanded] = useState(true); // Estado de repliegue
    const [tempStop, setTempStop] = useState('');
    
    const originRef = useRef<google.maps.places.Autocomplete | null>(null);
    const destRef = useRef<google.maps.places.Autocomplete | null>(null);
    const stopRef = useRef<google.maps.places.Autocomplete | null>(null);

    // AUTO-REPLIEGUE: Si termina de cargar y hay resultados, cerramos el formulario
    useEffect(() => {
        if (!loading && results.totalDays !== null) {
            setIsExpanded(false);
        }
    }, [loading, results.totalDays]);

    const currentStops = formData.etapas ? formData.etapas.split('|').filter((s: string) => s.trim().length > 0) : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        let finalValue: string | number | boolean = type === 'checkbox' ? checked : (['precioGasoil', 'consumo', 'kmMaximoDia'].includes(id) ? parseFloat(value) : value);
        setFormData({ ...formData, [id]: finalValue });
    };

    const handleToggleWaypoints = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setShowWaypoints(isChecked);
        if (!isChecked) setFormData({ ...formData, etapas: '' });
    };

    const onPlaceChanged = (field: 'origen' | 'destino' | 'tempStop') => {
        let ref = field === 'origen' ? originRef : field === 'destino' ? destRef : stopRef;
        const place = ref.current?.getPlace();
        if (place && place.formatted_address) {
            if (field === 'tempStop') setTempStop(place.formatted_address);
            else setFormData(prev => ({ ...prev, [field]: place.formatted_address }));
        }
    };

    const handleManualGeocode = (field: 'origen' | 'destino') => {
        const value = formData[field];
        if (!value) return;
        if (typeof google === 'undefined') return;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: value }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const cleanAddress = results[0].formatted_address;
                setFormData(prev => ({ ...prev, [field]: cleanAddress }));
                alert(`✅ Ubicación validada:\n"${cleanAddress}"`);
            } else {
                alert("❌ Google no ha podido localizar este sitio.");
            }
        });
    };

    const addWaypoint = () => {
        if (!tempStop) return;
        const newStops = [...currentStops, tempStop];
        setFormData({ ...formData, etapas: newStops.join('|') });
        setTempStop(''); 
    };

    const removeWaypoint = (indexToRemove: number) => {
        const newStops = currentStops.filter((_: string, index: number) => index !== indexToRemove);
        setFormData({ ...formData, etapas: newStops.join('|') });
    };

    // --- MODO RESUMEN (DASHBOARD) ---
    if (!isExpanded && results.totalDays) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-red-100 no-print transition-all duration-500 ease-in-out cursor-pointer hover:shadow-xl" onClick={() => setIsExpanded(true)}>
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex justify-between items-center text-white rounded-t-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="font-bold text-sm truncate flex items-center gap-2">
                            <span>🏁 {formData.origen.split(',')[0]}</span> 
                            <span className="text-red-200">➝</span> 
                            <span>{formData.destino.split(',')[0]}</span>
                        </h2>
                        {formData.vueltaACasa && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Circular</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold bg-black/20 px-3 py-1 rounded-full">
                        <span title="Modificar Ruta">Editar</span>
                        <IconEdit />
                    </div>
                </div>
                
                {/* BARRA DE DATOS INTEGRADA (Antiguo TripStats) */}
                <div className="flex justify-around items-center p-3 text-gray-700 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5" title="Duración Total">
                        <span className="text-red-500"><IconCalendar /></span> 
                        <span className="font-bold">{results.totalDays} Días</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex items-center gap-1.5" title="Distancia Total">
                        <span className="text-blue-500"><IconMap /></span> 
                        <span className="font-bold">{results.distanceKm?.toFixed(0)} km</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                    <div className="flex items-center gap-1.5 hidden md:flex" title="Coste Estimado">
                        <span className="text-green-600"><IconWallet /></span> 
                        <span className="font-bold">{results.totalCost?.toFixed(0)} €</span>
                    </div>
                </div>
            </div>
        );
    }

    // --- MODO EDICIÓN (FORMULARIO COMPLETO) ---
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100 no-print transition-all duration-500 ease-in-out">
            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => setIsExpanded(false)}>
                <h2 className="text-gray-600 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    ⚙️ Configuración del Viaje
                </h2>
                {results.totalDays && <IconChevronUp />}
            </div>

            <form onSubmit={onSubmit} className="p-5 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* FECHAS */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Inicio</label>
                        <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Regreso (Opcional)</label>
                        <input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>
                    
                    {/* ORIGEN */}
                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">Origen</label>
                        <div className="flex gap-1">
                            <Autocomplete onLoad={ref => originRef.current = ref} onPlaceChanged={() => onPlaceChanged('origen')} className='w-full'>
                                <input type="text" id="origen" value={formData.origen} onChange={handleChange} placeholder="Ciudad, calle o coords" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400" required />
                            </Autocomplete>
                            <button type="button" onClick={() => handleManualGeocode('origen')} className="bg-gray-100 border border-gray-300 text-gray-600 px-3 rounded hover:bg-gray-200" title="Validar">
                                <IconSearchLoc />
                            </button>
                        </div>
                    </div>

                    {/* DESTINO */}
                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">Destino Principal</label>
                        <div className="flex gap-1">
                            <Autocomplete onLoad={ref => destRef.current = ref} onPlaceChanged={() => onPlaceChanged('destino')} className='w-full'>
                                <input type="text" id="destino" value={formData.destino} onChange={handleChange} placeholder="Ej: Cabo Norte" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400" required />
                            </Autocomplete>
                            <button type="button" onClick={() => handleManualGeocode('destino')} className="bg-gray-100 border border-gray-300 text-gray-600 px-3 rounded hover:bg-gray-200" title="Validar">
                                <IconSearchLoc />
                            </button>
                        </div>
                    </div>

                    {/* CHECKBOXES */}
                    <div className="md:col-span-2 lg:col-span-4 bg-red-50 p-3 rounded border border-red-100 flex flex-col md:flex-row gap-6 items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-red-800 font-bold text-xs select-none">
                            <input type="checkbox" className="text-red-600 rounded focus:ring-red-500" checked={showWaypoints} onChange={handleToggleWaypoints} />
                            ➕ Añadir Paradas Intermedias
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-blue-800 font-bold text-xs select-none border-l pl-6 border-red-200">
                            <input type="checkbox" id="vueltaACasa" checked={formData.vueltaACasa || false} onChange={handleChange} className="text-blue-600 rounded focus:ring-blue-500" />
                            🔄 Vuelta a Casa (Circular)
                        </label>
                    </div>

                    {/* ZONA DE PARADAS (CHIPS) */}
                    {showWaypoints && (
                        <div className="md:col-span-2 lg:col-span-4 -mt-2 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <Autocomplete onLoad={ref => stopRef.current = ref} onPlaceChanged={() => onPlaceChanged('tempStop')}>
                                        <input 
                                            type="text" 
                                            value={tempStop} 
                                            onChange={(e) => setTempStop(e.target.value)} 
                                            placeholder="🔍 Buscar parada (Ej: Carcassonne)..." 
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 shadow-sm"
                                        />
                                    </Autocomplete>
                                </div>
                                <button type="button" onClick={addWaypoint} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm">
                                    <IconPlusCircle /> Añadir
                                </button>
                            </div>
                            
                            {currentStops.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {currentStops.map((stop: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-xs shadow-sm animate-fadeIn">
                                            <span className="font-medium">📍 {stop}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => removeWaypoint(index)} 
                                                className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-gray-400 italic text-center">No hay paradas intermedias añadidas.</p>
                            )}
                        </div>
                    )}

                    {/* SLIDERS Y BOTÓN FINAL */}
                    <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Ritmo (Km/día)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.kmMaximoDia} km</span></div>
                            <input type="range" id="kmMaximoDia" min="100" max="1000" step="50" value={formData.kmMaximoDia} onChange={handleChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Consumo (L/100)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.consumo} L</span></div>
                            <input type="range" id="consumo" min="5" max="25" step="0.1" value={formData.consumo} onChange={handleChange} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">Precio Diésel (€/L)</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.precioGasoil} €</span></div>
                            <input type="range" id="precioGasoil" min="1.00" max="2.50" step="0.01" value={formData.precioGasoil} onChange={handleChange} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600" />
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col md:flex-row items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-bold text-xs bg-gray-50 px-4 py-3 rounded border border-gray-200 w-full md:w-auto justify-center h-full">
                            <input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange} className="text-red-600 rounded focus:ring-red-500" />
                            🚫 Evitar Peajes
                        </label>
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded font-bold text-sm hover:from-red-700 hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50">
                            {loading ? 'Calculando Ruta...' : '🚀 Calcular Itinerario'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}