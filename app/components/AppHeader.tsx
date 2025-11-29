'use client';

import React from 'react';
import UserArea from './UserArea';

// --- VERIFICACIÓN FASE 34: LAYOUT FLUIDO ---
// Iconos locales para la cabecera
const IconAudit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const IconCloud = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const IconReset = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const IconShare = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>);

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
                            <IconAudit /> {auditMode ? 'ON' : 'Audit'}
                        </button>

                        {hasResults && (
                            <>
                                {currentTripId && (
                                    <button onClick={onShare} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-1">
                                        <IconShare /> Compartir
                                    </button>
                                )}
                                
                                <button onClick={onSave} disabled={isSaving} className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1 disabled:opacity-50">
                                    <IconCloud /> {isSaving ? '...' : 'Guardar'}
                                </button>
                                
                                <button onClick={onReset} className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 shadow-sm flex items-center gap-1" title="Borrar y Empezar de cero">
                                    <IconReset /> Borrar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}