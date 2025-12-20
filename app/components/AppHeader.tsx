'use client';

import React from 'react';
import Image from 'next/image';
import UserArea from './UserArea';
import type { TripData } from '../hooks/useTripPersistence';

interface AppHeaderProps {
    onLoadTrip: (data: TripData, id: number) => void;
    currentTripId: number | null;
    t: (key: string) => string;
    setLang: (lang: 'es' | 'en') => void;
    language: 'es' | 'en';
    centerContent?: React.ReactNode;
}

export default function AppHeader({ 
    onLoadTrip, currentTripId, t, setLang, language, centerContent
}: AppHeaderProps) {
    return (
        <div className="relative no-print w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 py-2 shadow-sm">
            <div className="flex flex-col md:grid md:grid-cols-[auto_minmax(0,7fr)_minmax(0,2fr)] md:items-center gap-2 md:gap-3 px-4 max-w-6xl mx-auto">
                
                {/* 1. LOGO (Izquierda) */}
                <div className="flex items-center shrink-0 md:col-start-1">
                    <Image
                        src="/logo.jpg"
                        alt={t('APP_TITLE')}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover drop-shadow-sm hover:scale-105 transition-transform duration-300 rounded-lg"
                        priority
                    />
                </div>

                {/* 2. DATOS DEL VIAJE + ACCIONES (Centro) */}
                {centerContent ? (
                    <div className="w-full md:col-start-2 md:px-4 min-w-0 overflow-hidden">{centerContent}</div>
                ) : (
                    <div className="hidden md:block md:col-start-2" />
                )}

                {/* 3. ZONA DERECHA: IDIOMA + USUARIO */}
                <div className="flex items-center justify-end gap-3 shrink-0 md:col-start-3 min-w-0">
                    
                    {/* SELECTOR DE IDIOMA (Banderas) */}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                        <button 
                            onClick={() => setLang('es')}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] transition-all ${language === 'es' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Español (Km, Litros, €)"
                        >
                            🇪🇸
                        </button>
                        <button 
                            onClick={() => setLang('en')}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] transition-all ${language === 'en' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            title="English (Miles, Gallons, $)"
                        >
                            🇬🇧
                        </button>
                    </div>

                    {/* SEPARADOR VERTICAL */}
                    <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

                    {/* ÁREA DE USUARIO (Le pasamos 't' para que traduzca el login) */}
                    <UserArea onLoadTrip={onLoadTrip} currentTripId={currentTripId} t={t} /> 
                </div>
            </div>
        </div>
    );
}