'use client';

import React from 'react';
import { DailyPlan } from '../types';
import { LanguageSettings } from '../hooks/useLanguage';

interface StageSelectorProps {
    dailyItinerary: DailyPlan[] | null;
    selectedDayIndex: number | null;
    onSelectDay: (index: number | null) => void;
    t: (key: string) => string;
    settings: LanguageSettings;
}

export default function StageSelector({ dailyItinerary, selectedDayIndex, onSelectDay, t, settings }: StageSelectorProps) {
    if (!dailyItinerary) return null;
    
    // Formato de fecha local
    const dateFormatOptions: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: '2-digit',
        // Omitimos el año para ahorrar espacio
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print flex items-center px-3 py-1 gap-3 overflow-hidden">
            {/* TÍTULO FIJO A LA IZQUIERDA */}
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0">
                {t('ITINERARY_DAYS_TITLE')}
            </h3>

            {/* CINTA DE BOTONES DESLIZANTE */}
            <div className="flex gap-2 overflow-x-auto w-full items-center pb-1 pt-1 scrollbar-hide">
                <button 
                    onClick={() => onSelectDay(null)} 
                    className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedDayIndex === null ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300'}`}
                >
                    {t('ITINERARY_GENERAL')}
                </button>
                
                {dailyItinerary.map((day, index) => {
                    // Formato de fecha dependiente del idioma
                    const localDate = new Date(day.isoDate).toLocaleDateString(settings.lang, dateFormatOptions);
                    
                    return (
                        <button 
                            key={index} 
                            onClick={() => onSelectDay(index)} 
                            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 ${selectedDayIndex === index ? 'bg-red-600 text-white border-red-600 shadow-sm' : (day.isDriving ? 'bg-white text-gray-700 border-gray-200 hover:border-red-300' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300')}`}
                        >
                            <span>{day.isDriving ? '🚐' : '🏖️'}</span> 
                            <span>{t('STATS_DAY')} {day.day}</span>
                            {/* FECHA DISCRETA */}
                            <span className={`hidden sm:inline font-normal ${selectedDayIndex === index ? 'text-red-200' : 'text-gray-400'}`}>
                                ({localDate})
                            </span>
                            <span className={`ml-1 ${selectedDayIndex === index ? 'text-white' : 'text-gray-800'}`}>
                                {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}