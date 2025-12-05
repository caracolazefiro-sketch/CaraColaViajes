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
            console.log('[AppHeader] 📸 Iniciando captura con html2canvas...');
            
            // Importar html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            // Encontrar elemento a capturar
            const element = document.querySelector('main') || document.getElementById('__next') || document.documentElement;
            
            if (!element) {
                throw new Error('No se encontró elemento principal para capturar');
            }
            
            console.log('[AppHeader] 📸 Elemento encontrado:', element.tagName);
            
            // Capturar con configuración más permisiva
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                scale: window.devicePixelRatio || 1,
                windowHeight: element.scrollHeight,
                windowWidth: element.scrollWidth,
                // Ignorar errores de parsing CSS
                imageTimeout: 15000,
                ignoreElements: (element) => {
                    // Ignorar elementos problemáticos
                    return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
                }
            });
            
            if (!canvas) {
                throw new Error('No se pudo generar el canvas');
            }
            
            console.log('[AppHeader] ✅ Canvas generado:', canvas.width, 'x', canvas.height);
            
            // Convertir a blob y descargar
            canvas.toBlob((blob) => {
                if (!blob) {
                    throw new Error('No se pudo generar el blob');
                }
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const fileName = `CaraCola-Screenshot-${new Date().toISOString().split('T')[0]}-${Date.now()}.png`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('[AppHeader] ✅ Screenshot descargado:', fileName);
                alert('✅ Screenshot descargado correctamente');
            }, 'image/png', 0.95);
            
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[AppHeader] ❌ Error al capturar pantalla:', errMsg);
            console.error('[AppHeader] Stack:', error);
            alert(`❌ Error: ${errMsg}\n\nIntenta descargar el screenshot manualmente con Ctrl+Impr`);
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