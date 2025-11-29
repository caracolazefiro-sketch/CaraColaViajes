'use client';

import React from 'react';

// Iconos
const IconClock = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconTank = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconInfo = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

interface TripFormProps {
    formData: any;
    setFormData: (data: any) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    showWaypoints: boolean;
    setShowWaypoints: (show: boolean) => void;
}

export default function TripForm({ formData, setFormData, loading, onSubmit, showWaypoints, setShowWaypoints }: TripFormProps) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        // Manejamos checkbox para vueltaACasa y evitarPeajes
        let finalValue: string | number | boolean = type === 'checkbox' ? checked : (['precioGasoil', 'consumo', 'kmMaximoDia'].includes(id) ? parseFloat(value) : value);
        setFormData({ ...formData, [id]: finalValue });
    };

    const handleToggleWaypoints = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setShowWaypoints(isChecked);
        if (!isChecked) setFormData({ ...formData, etapas: '' });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100 no-print">
            <div className="bg-red-600 px-4 py-3">
                <h2 className="text-white font-bold text-base flex items-center gap-2">⚙️ Configura tu Ruta</h2>
            </div>

            <form onSubmit={onSubmit} className="p-5 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* FILA 1: FECHAS */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Inicio</label>
                        <input type="date" id="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Regreso (Opcional)</label>
                        <input type="date" id="fechaRegreso" value={formData.fechaRegreso} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>
                    
                    {/* FILA 2: ORIGEN DESTINO */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Origen</label>
                        <input type="text" id="origen" value={formData.origen} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-300" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Destino Principal</label>
                        <input type="text" id="destino" value={formData.destino} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-300" required />
                    </div>

                    {/* FILA 3: OPCIONES DE RUTA (Checkbox Vuelta a Casa) */}
                    <div className="md:col-span-2 lg:col-span-4 bg-red-50 p-3 rounded border border-red-100 flex flex-col md:flex-row gap-6 items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-red-800 font-bold text-xs select-none">
                            <input type="checkbox" className="text-red-600 rounded focus:ring-red-500" checked={showWaypoints} onChange={handleToggleWaypoints} />
                            ➕ Añadir Paradas Intermedias
                        </label>

                        {/* NUEVO CHECKBOX VUELTA A CASA */}
                        <label className="flex items-center gap-2 cursor-pointer text-blue-800 font-bold text-xs select-none">
                            <input 
                                type="checkbox" 
                                id="vueltaACasa" 
                                checked={formData.vueltaACasa || false} 
                                onChange={handleChange} 
                                className="text-blue-600 rounded focus:ring-blue-500" 
                            />
                            🔄 Vuelta a Casa (Circular)
                        </label>
                    </div>

                    {showWaypoints && (
                        <div className="md:col-span-2 lg:col-span-4 -mt-2">
                            <input type="text" id="etapas" value={formData.etapas} onChange={handleChange} placeholder="Ej: Valencia, Madrid" className="w-full px-3 py-2 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-red-500 outline-none" />
                        </div>
                    )}

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