'use client';

import React from 'react';
import UserArea from './UserArea';

// Iconos locales para la cabecera
const IconAudit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);

interface AppHeaderProps {
    onLoadTrip: (data: any, id: number) => void;
    t: (key: string) => string;
    setLang: (lang: 'es' | 'en') => void;
    language: 'es' | 'en';
}

export default function AppHeader({ 
    onLoadTrip, t, setLang, language 
}: AppHeaderProps) {
    return (
        <div className="relative mb-6 no-print w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 max-w-6xl mx-auto">
                
                {/* 1. LOGO */}
                <div className="flex items-center gap-3">
                    <img 
                        src="/logo.jpg" 
                        alt={t('APP_TITLE')} 
                        className="h-16 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                    />
                    <div className="hidden md:block">
                        <h1 className="text-xl font-bold text-red-600 leading-tight">{t('APP_TITLE')}</h1>
                        <p className="text-gray-400 text-xs font-medium">{t('APP_SUBTITLE')}</p>
                    </div>
                </div>

                {/* 2. ZONA DE USUARIO Y ACCIONES */}
                <div className="flex items-center gap-4">
                    <UserArea onLoadTrip={onLoadTrip} t={t} /> 
                    
                    {/* SELECTOR DE IDIOMA */}
                    <button 
                        onClick={() => setLang(language === 'es' ? 'en' : 'es')}
                        title={language === 'es' ? 'Change to English (Imperial)' : 'Cambiar a Español (Métrico)'}
                        className="p-1.5 rounded-full bg-white shadow-md hover:bg-gray-100 transition"
                    >
                        <span className="text-xl">{language === 'es' ? '🇪🇸' : '🇬🇧'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}