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
    const hasCenter = Boolean(centerContent);

    return (
        <div className="relative no-print w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 py-2 shadow-sm">
            <div
                className={
                    hasCenter
                        ? 'flex flex-col md:grid md:grid-cols-[auto_minmax(0,1fr)_minmax(340px,420px)] md:items-center gap-2 md:gap-3 px-4 max-w-6xl mx-auto'
                        : 'flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 px-4 max-w-6xl mx-auto'
                }
            >
                
                {/* 1. LOGO (Izquierda) */}
                <div className={hasCenter ? 'flex items-center shrink-0 md:col-start-1' : 'flex items-center gap-3 shrink-0'}>
                    <Image
                        src="/logo.jpg"
                        alt={t('APP_TITLE')}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover drop-shadow-sm hover:scale-105 transition-transform duration-300 rounded-lg"
                        priority
                    />

                    {!hasCenter && (
                        <div className="leading-tight">
                            <div className="text-base font-extrabold text-gray-900">{t('APP_TITLE')}</div>
                            <div className="text-xs text-gray-500 font-medium">{t('APP_SUBTITLE')}</div>
                        </div>
                    )}
                </div>

                {/* 2. DATOS DEL VIAJE + ACCIONES (Centro) */}
                {centerContent ? (
                    <div className="w-full md:col-start-2 md:px-4 min-w-0 overflow-hidden">{centerContent}</div>
                ) : (
                    <div className="hidden md:block md:flex-1" />
                )}

                {/* 3. ZONA DERECHA: IDIOMA + USUARIO */}
                <div className={hasCenter ? 'flex items-center justify-end gap-3 shrink-0 md:col-start-3 min-w-0' : 'flex items-center justify-end gap-3 shrink-0'}>
                    
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
                    <UserArea onLoadTrip={onLoadTrip} currentTripId={currentTripId} t={t} variant={hasCenter ? 'header' : 'landing'} /> 
                </div>
            </div>
        </div>
    );
}