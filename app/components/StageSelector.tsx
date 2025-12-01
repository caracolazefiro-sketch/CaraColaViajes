// app/components/StageSelector.tsx
'use client';

import React from 'react';
import { DailyPlan } from '../types';

interface StageSelectorProps {
    dailyItinerary: DailyPlan[] | null;
    selectedDayIndex: number | null;
    onSelectDay: (index: number | null) => void;
    // Se eliminan 't' y 'settings' para corregir el error de compilación.
}

export default function StageSelector({ dailyItinerary, selectedDayIndex, onSelectDay }: StageSelectorProps) {
    if (!dailyItinerary) return null;

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 no-print">
            <h3 className="font-bold text-gray-700 text-sm mb-3">Selecciona una Etapa:</h3>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => onSelectDay(null)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedDayIndex === null ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}
                >
                    🌎 General
                </button>
                {dailyItinerary.map((day, index) => (
                    <button 
                        key={index} 
                        onClick={() => onSelectDay(index)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedDayIndex === index ? 'bg-red-600 text-white border-red-600 shadow-md' : (day.isDriving ? 'bg-white text-gray-700 border-gray-200 hover:border-red-300' : 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300')}`}
                    >
                        <span>{day.isDriving ? '🚐' : '🏖️'}</span> 
                        <span>Día {day.day}</span>
                        {/* FECHA DISCRETA */}
                        <span className={`text-[10px] font-normal ${selectedDayIndex === index ? 'text-red-200' : 'text-gray-400'}`}>({day.date})</span>: 
                        <span className="ml-1">{day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}