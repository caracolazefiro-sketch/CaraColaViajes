'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconX } from '../lib/svgIcons';
import { getOrCreateClientId } from '../utils/client-id';
import { emitCenteredNotice } from '../utils/centered-notice';

interface AdjustStageModalProps {
    isOpen: boolean;
    dayIndex: number;
    currentDestination: string;
    onClose: () => void;
    onConfirm: (newDestination: string, newCoordinates: { lat: number; lng: number }) => void;
    trialMode?: boolean;
    trialMessage?: string;
    authToken?: string;
}

export default function AdjustStageModal({
    isOpen,
    dayIndex,
    currentDestination,
    onClose,
    onConfirm,
    trialMode = false,
    trialMessage = 'Modo prueba: inicia sesión para desbloquear esta función.',
    authToken,
}: AdjustStageModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (trialMode) {
            emitCenteredNotice(trialMessage);
            return;
        }
        const q = searchQuery.trim();
        if (!q) return;

        setIsResolving(true);
        (async () => {
            try {
                const clientId = getOrCreateClientId();
                const res = await fetch('/api/google/geocode-address', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
                    },
                    body: JSON.stringify({ query: q, language: 'es' }),
                });

                const json = await res.json().catch(() => null);
                const result = json?.ok ? json?.result : null;
                const loc = (result?.location ?? result?.geometry?.location) as
                    | { lat?: number; lng?: number }
                    | null
                    | undefined;

                if (!res.ok || !json?.ok || !loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
                    emitCenteredNotice('No se pudo resolver esa ubicación. Prueba con “Ciudad, País”.');
                    return;
                }

                const destinationText = String(result?.formatted_address || q).trim();
                onConfirm(destinationText, { lat: loc.lat, lng: loc.lng });
                handleClose();
            } finally {
                setIsResolving(false);
            }
        })();
    };

    const handleClose = () => {
        setSearchQuery('');
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
                            disabled={trialMode}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Escribe una ciudad/lugar y confirma (resuelve en servidor)
                        </p>
                    </div>
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
                        disabled={trialMode || !searchQuery.trim() || isResolving}
                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isResolving ? 'Buscando…' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
