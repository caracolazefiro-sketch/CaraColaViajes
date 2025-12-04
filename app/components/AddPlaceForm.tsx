'use client';

import React, { useState } from 'react';
import { PlaceWithDistance, ServiceType } from '../types';
import { ServiceIcons } from './ServiceIcons';

// Iconos locales
const IconSearchLoc = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);

// Componente para mostrar icono + label en select
const ServiceOption = ({ type, label }: { type: ServiceType; label: string }) => {
    const Icon = ServiceIcons[type];
    return (
        <div className="flex items-center gap-2">
            {Icon && <Icon size={16} />}
            <span>{label}</span>
        </div>
    );
};

interface AddPlaceFormProps {
    initialData?: PlaceWithDistance | null; // Datos para editar
    rawCityName: string; // Para ayudar al geocoding
    onSave: (place: PlaceWithDistance) => void;
    onCancel: () => void;
}

export default function AddPlaceForm({ initialData, rawCityName, onSave, onCancel }: AddPlaceFormProps) {
    const [customName, setCustomName] = useState(initialData?.name || '');
    const [customDesc, setCustomDesc] = useState(initialData?.vicinity || '');
    const [customLink, setCustomLink] = useState(initialData?.link || '');
    const [customNote, setCustomNote] = useState(initialData?.note || '');
    const [customLat, setCustomLat] = useState(initialData?.geometry?.location ? String(initialData.geometry.location.lat) : '');
    const [customLng, setCustomLng] = useState(initialData?.geometry?.location ? String(initialData.geometry.location.lng) : '');
    const [customType, setCustomType] = useState<ServiceType>(initialData?.type || 'custom');
    const [customPublic, setCustomPublic] = useState(initialData?.isPublic || false);
    const [geocoding, setGeocoding] = useState(false);    const handleGeocodeAddress = () => {
        if (!customDesc) { alert("Escribe una dirección o nombre de lugar primero."); return; }
        if (typeof google === 'undefined') return;
        setGeocoding(true);
        const geocoder = new google.maps.Geocoder();
        const searchAddress = `${customDesc} near ${rawCityName}`;
        geocoder.geocode({ address: searchAddress }, (results, status) => {
            setGeocoding(false);
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                setCustomLat(loc.lat().toString());
                setCustomLng(loc.lng().toString());
                alert("✅ Ubicación encontrada.");
            } else { alert("❌ No pudimos localizar ese sitio."); }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let geometry = undefined;
        if (customLat && customLng) {
             geometry = { 
                location: { 
                    lat: parseFloat(customLat), 
                    lng: parseFloat(customLng) 
                } 
            };
        }
        const newPlace: PlaceWithDistance = {
            place_id: initialData?.place_id || `custom-${Date.now()}`, // Mantener place_id si existe
            ...initialData, // Preservar datos originales (rating, user_ratings_total, photoUrl, types, etc.)
            // Sobrescribir con los valores del formulario (estos tienen prioridad)
            name: customName, 
            vicinity: customDesc, 
            link: customLink,
            note: customNote || undefined,
            type: customType, 
            geometry: geometry,
            isPublic: customPublic // IMPORTANTE: va después del spread para sobrescribir
        };
        console.log('💾 Guardando lugar:', { name: newPlace.name, type: newPlace.type, isPublic: newPlace.isPublic });
        onSave(newPlace);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nombre (ej: Taller)" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" required />
                    <div className="relative">
                        <select value={customType} onChange={e => setCustomType(e.target.value as ServiceType)} className="w-full p-2 text-xs rounded border border-gray-300 bg-white outline-none appearance-none cursor-pointer">
                            <option value="custom">Otro</option>
                            <option value="camping">Pernocta</option>
                            <option value="restaurant">Restaurante</option>
                            <option value="water">Aguas</option>
                            <option value="gas">Gasolinera</option>
                            <option value="supermarket">Super</option>
                            <option value="tourism">Turismo</option>
                            <option value="search">Buscado</option>
                            <option value="found">Encontrado</option>
                        </select>
                        <div className="pointer-events-none absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-gray-600">
                            {ServiceIcons[customType] && React.createElement(ServiceIcons[customType], { size: 14 })}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input type="text" placeholder="Dirección (ej: Calle Mayor 1)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                    <button type="button" onClick={handleGeocodeAddress} disabled={geocoding} className="bg-blue-500 text-white px-3 rounded text-xs font-bold hover:bg-blue-600 flex items-center justify-center" title="Buscar coordenadas">
                        {geocoding ? '...' : <IconSearchLoc />}
                    </button>
                </div>
                <input type="text" placeholder="Link URL (Opcional)" value={customLink} onChange={e => setCustomLink(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none" />
                <textarea 
                    placeholder="Nota personal (ej: llevar flores a tía María)" 
                    value={customNote} 
                    onChange={e => setCustomNote(e.target.value)} 
                    className="w-full p-2 text-xs rounded border border-gray-300 outline-none resize-none" 
                    rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Latitud" value={customLat} onChange={e => setCustomLat(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none bg-gray-50" />
                    <input type="text" placeholder="Longitud" value={customLng} onChange={e => setCustomLng(e.target.value)} className="w-full p-2 text-xs rounded border border-gray-300 outline-none bg-gray-50" />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200">
                    <input type="checkbox" checked={customPublic} onChange={e => setCustomPublic(e.target.checked)} id="privacyCheck" />
                    <label htmlFor="privacyCheck" className="cursor-pointer select-none flex items-center gap-1">
                        <span>🌍</span> Permitir que otros vean esto al compartir
                    </label>
                </div>

                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 text-gray-700 py-1.5 rounded text-xs font-bold hover:bg-gray-400">Cancelar</button>
                    <button type="submit" className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold hover:bg-green-700">Guardar</button>
                </div>
            </div>
        </form>
    );
}