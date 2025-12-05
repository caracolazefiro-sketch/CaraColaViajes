'use client';

import React, { useState } from 'react';
import UserArea from './UserArea';
import type { TripData } from '../hooks/useTripPersistence';

interface AppHeaderProps {
    onLoadTrip: (data: TripData, id: number) => void;
    currentTripId: number | null;
    t: (key: string) => string;
    setLang: (lang: 'es' | 'en') => void;
    language: 'es' | 'en';
}

export default function AppHeader({ 
    onLoadTrip, currentTripId, t, setLang, language 
}: AppHeaderProps) {
    const [isCapturing, setIsCapturing] = useState(false);

    const takeScreenshot = async () => {
        try {
            setIsCapturing(true);
            // Lazy load html2canvas para no afectar performance inicial
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(document.body, {
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
            });
            
            // Descargar como PNG
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `CaraCola-Screenshot-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            
            console.log('[AppHeader] ✅ Screenshot descargado exitosamente');
        } catch (error) {
            console.error('[AppHeader] ❌ Error al capturar pantalla:', error);
            alert('Error al capturar pantalla. Revisa la consola.');
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="relative mb-6 no-print w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 py-3 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 max-w-6xl mx-auto">
                
                {/* 1. LOGO Y TÍTULO (Izquierda) */}
                <div className="flex items-center gap-3">
                    <img 
                        src="/logo.jpg" 
                        alt={t('APP_TITLE')} 
                        className="h-12 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300 rounded-lg"
                    />
                    <div className="hidden md:block text-left">
                        <h1 className="text-xl font-black text-red-600 leading-none tracking-tight">{t('APP_TITLE')}</h1>
                        <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">{t('APP_SUBTITLE')}</p>
                    </div>
                </div>

                {/* 2. ZONA DERECHA: SCREENSHOT + IDIOMA + USUARIO */}
                <div className="flex items-center gap-4">
                    
                    {/* BOTÓN SCREENSHOT (Nueva) */}
                    <button
                        onClick={takeScreenshot}
                        disabled={isCapturing}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2 no-print"
                        title="Capturar pantalla (descarga PNG)"
                    >
                        📸 {isCapturing ? 'Capturando...' : 'Screenshot'}
                    </button>

                    {/* SELECTOR DE IDIOMA (Banderas) */}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                        <button 
                            onClick={() => setLang('es')}
                            className={`px-2 py-1 rounded-full text-xs transition-all ${language === 'es' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Español (Km, Litros, €)"
                        >
                            🇪🇸
                        </button>
                        <button 
                            onClick={() => setLang('en')}
                            className={`px-2 py-1 rounded-full text-xs transition-all ${language === 'en' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
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