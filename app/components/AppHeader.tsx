// app/components/AppHeader.tsx
'use client';

import React from 'react';
import UserArea from './UserArea';
// --- NUEVOS ICONOS LUCIDE ---
import { FileText, Cloud, RotateCcw, Share2 } from 'lucide-react';
// ----------------------------

interface AppHeaderProps {
    onLoadTrip: (data: any, id: number) => void;
    auditMode: boolean;
    setAuditMode: (v: boolean) => void;
    hasResults: boolean; 
    currentTripId: number | null;
    isSaving: boolean;
    onSave: () => void;
    onShare: () => void;
    onReset: () => void;
}

export default function AppHeader({ 
    onLoadTrip, auditMode, setAuditMode, hasResults, currentTripId, isSaving, onSave, onShare, onReset 
}: AppHeaderProps) {
    return (
        <div className="relative mb-6 no-print w-full">
            {/* Contenedor principal: LOGO a la izquierda, CONTROLES a la derecha */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
                
                {/* 1. LOGO Y TÍTULO (Fijos a la izquierda) */}
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.jpg" 
                            alt="CaraCola Viajes" 
                            className="h-16 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                        />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-red-600 leading-tight">CaraCola Viajes</h1>
                            <p className="text-gray-400 text-xs font-medium">Tu ruta en autocaravana</p>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium md:hidden mt-1">Tu ruta en autocaravana, paso a paso.</p>
                </div>

                {/* 2. ZONA DE USUARIO Y ACCIONES (Contenedor Derecha) */}
                <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                    
                    {/* A. LOGIN / MIS VIAJES */}
                    <UserArea onLoadTrip={onLoadTrip} />
                    
                    {/* B. BOTONERA DE ACCIONES (Guardar, Compartir, Auditor) */}
                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 mt-1">
                        <button 
                            onClick={() => setAuditMode(!auditMode)} 
                            className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${auditMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} 
                            title="Modo Auditor"
                        >
                            <FileText className="h-4 w-4" /> {auditMode ? 'ON' : 'Audit'}
                        </button>

                        {hasResults && (
                            <>
                                {currentTripId && (
                                    <button onClick={onShare} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-1">
                                        <Share2 className="h-4 w-4" /> Compartir
                                    </button>
                                )}
                                
                                <button onClick={onSave} disabled={isSaving} className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1 disabled:opacity-50">
                                    <Cloud className="h-4 w-4" /> {isSaving ? '...' : 'Guardar'}
                                </button>
                                
                                <button onClick={onReset} className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 shadow-sm flex items-center gap-1" title="Borrar y Empezar de cero">
                                    <RotateCcw className="h-4 w-4" /> Borrar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}