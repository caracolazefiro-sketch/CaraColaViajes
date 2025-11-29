'use client';

import React from 'react';
import { DailyPlan } from '../types';

interface StageSelectorProps {
    dailyItinerary: DailyPlan[] | null;
    selectedDayIndex: number | null;
    onSelectDay: (index: number | null) => void;
}

export default function StageSelector({ dailyItinerary, selectedDayIndex, onSelectDay }: StageSelectorProps) {
    if (!dailyItinerary) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print flex items-center px-4 py-2 gap-3 overflow-hidden">
            {/* TÍTULO FIJO A LA IZQUIERDA */}
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0">
                Tu Ruta:
            </h3>

            {/* CINTA DE BOTONES DESLIZANTE */}
            <div className="flex gap-2 overflow-x-auto w-full items-center pb-1 pt-1 scrollbar-hide">
                <button 
                    onClick={() => onSelectDay(null)} 
                    className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedDayIndex === null ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300'}`}
                >
                    🌎 General
                </button>
                
                {dailyItinerary.map((day, index) => (
                    <button 
                        key={index} 
                        onClick={() => onSelectDay(index)} 
                        className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 ${selectedDayIndex === index ? 'bg-red-600 text-white border-red-600 shadow-sm' : (day.isDriving ? 'bg-white text-gray-700 border-gray-200 hover:border-red-300' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300')}`}
                    >
                        <span>{day.isDriving ? '🚐' : '🏖️'}</span> 
                        <span>Día {day.day}</span>
                        {/* FECHA (Oculta en móviles muy pequeños, visible en resto) */}
                        <span className={`hidden sm:inline font-normal ${selectedDayIndex === index ? 'text-red-200' : 'text-gray-400'}`}>
                            {day.date.slice(0, -5)} {/* Quitamos el año para ahorrar espacio */}
                        </span>
                        <span className={`ml-1 ${selectedDayIndex === index ? 'text-white' : 'text-gray-800'}`}>
                            {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}