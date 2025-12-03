'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconX } from '../lib/svgIcons';

interface AdjustStageModalProps {
    isOpen: boolean;
    dayIndex: number;
    currentDestination: string;
    onClose: () => void;
    onConfirm: (newDestination: string, newCoordinates: { lat: number; lng: number }) => void;
}

export default function AdjustStageModal({
    isOpen,
    dayIndex,
    currentDestination,
    onClose,
    onConfirm
}: AdjustStageModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (isOpen && inputRef.current && typeof google !== 'undefined') {
            // Inicializar Google Places Autocomplete
            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                types: ['(cities)'],
                fields: ['name', 'geometry', 'formatted_address', 'place_id']
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place && place.geometry?.location) {
                    setSelectedPlace(place);
                    setSearchQuery(place.name || place.formatted_address || '');
                }
            });
        }

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedPlace && selectedPlace.geometry?.location) {
            const lat = selectedPlace.geometry.location.lat();
            const lng = selectedPlace.geometry.location.lng();
            const name = selectedPlace.name || selectedPlace.formatted_address || searchQuery;
            onConfirm(name, { lat, lng });
            handleClose();
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSelectedPlace(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Ajustar Parada Técnica</h3>
                        <p className="text-sm text-gray-500 mt-1">Día {dayIndex + 1}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <IconX size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Destino actual */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                            DESTINO ACTUAL
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-800 font-medium">
                                {currentDestination.replace('📍 Parada Táctica: ', '').split('|')[0]}
                            </p>
                        </div>
                    </div>

                    {/* Nuevo destino */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                            NUEVO DESTINO
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busca una ciudad o lugar..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Google te mostrará sugerencias mientras escribes
                        </p>
                    </div>

                    {/* Preview si hay lugar seleccionado */}
                    {selectedPlace && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm font-semibold text-orange-900">
                                ✓ Lugar seleccionado
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                                {selectedPlace.formatted_address || selectedPlace.name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedPlace}
                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
