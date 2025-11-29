// --------------------------------------------------------------------------
// AppHeader.tsx - FINAL (Logo Izq, Acciones y Login Der)
// --------------------------------------------------------------------------
'use client'; 
import React, { useState } from 'react';
import Image from 'next/image'; 
import UserArea from './UserArea'; 

// Iconos (se mantienen los SVG placeholders)
const IconMenu = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const IconSave = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const IconAudit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0h6m-6 0h-6m6 0v-9.5M15 19v-9.5m0 9.5h-6M18 13.5v-3.5a2 2 0 00-2-2h-3M9 13.5v-3.5a2 2 0 00-2-2H5m0 0a2 2 0 00-2-2h14a2 2 0 002 2v10a2 2 0 002 2H5a2 2 0 00-2-2v-3.5" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconShare = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.882 13.14 9 12.87 9 12.6v-2.268a2 2 0 00-2-2H5m14 4h-2a2 2 0 00-2 2v2.268a2 2 0 002 2h2M9 12a2 2 0 002 2h2a2 2 0 002-2V10a2 2 0 00-2-2H9a2 2 0 00-2 2v2z" /></svg>);


interface AppHeaderProps {
    onLoadTrip: (tripData: any, tripId: number) => void;
    auditMode: boolean;
    setAuditMode: (mode: boolean) => void;
    hasResults: boolean;
    currentTripId: number | null;
    isSaving: boolean;
    onSave: () => Promise<void>;
    onShare: () => Promise<void>;
    onReset: () => void;
}

const LogoComponent = () => (
    <div className="flex items-center flex-shrink-0">
      <Image 
        src="/logo.jpg" 
        alt="CaraCola Viajes Logo" 
        width={50} 
        height={50} 
        priority
      />
      <div className="ml-3 hidden sm:block"> {/* Ocultar en móvil si es necesario */}
        <h1 className="text-xl font-extrabold text-red-600">PRUEBAS</h1>
        <p className="text-xs text-gray-500 leading-none">Tu ruta en autocaravana</p>
      </div>
    </div>
);

export default function AppHeader(props: AppHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  return (
    // CLASES DE ESTRUCTURA: fixed, w-full, flex, items-center, justify-between
    <header className="fixed w-full z-20 bg-white shadow-md p-4 flex items-center justify-between top-0 left-0">
      
      {/* 1. Bloque Izquierdo: Logo y Título */}
      <LogoComponent />

      {/* 2. Bloque Derecho: Acciones de Viaje y Login/Logout */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* --- Botones de Acción (ESCRITORIO: visible en sm:flex, oculto por defecto) --- */}
        <div className="hidden sm:flex items-center gap-2">
            
            {/* AUDIT */}
            <button 
                onClick={() => props.setAuditMode(!props.auditMode)} 
                className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition ${props.auditMode ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Activar/Desactivar Modo Auditoría (Tags, coordenadas, etc.)"
            >
                <IconAudit /> Audit
            </button>

            {/* GUARDAR */}
            <button 
                onClick={props.onSave} 
                disabled={!props.hasResults || props.isSaving}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
                <IconSave /> {props.isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            
            {/* BORRAR */}
            <button 
                onClick={props.onReset}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
                <IconTrash /> Borrar
            </button>

            {/* COMPARTIR (Opcional, si has implementado la lógica) */}
             <button 
                onClick={props.onShare} 
                disabled={!props.currentTripId}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
            >
                <IconShare /> Compartir
            </button>

        </div>
        
        {/* 3. Área de Usuario (Login/Logout/Mis Viajes) */}
        <div className="flex items-center">
            <UserArea onLoadTrip={props.onLoadTrip} />
        </div>

        {/* 4. Icono de Menú Hamburguesa (MÓVIL: solo visible en sm:hidden) */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="sm:hidden p-2 text-gray-700 hover:text-red-600"
          aria-label="Menú principal"
        >
          <IconMenu className="h-6 w-6" />
        </button>

      </div>

      {/* 5. Drawer para Menú Móvil (Contiene las acciones ocultas) */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden" 
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="p-4 flex flex-col space-y-3">
                <p className="text-xl font-semibold mb-2 border-b pb-2 text-red-600">Acciones del Viaje</p>
                
                <button 
                    onClick={() => { props.setAuditMode(!props.auditMode); setIsDrawerOpen(false); }} 
                    className="flex items-center gap-3 text-sm font-bold p-2 rounded-lg bg-gray-100 text-gray-700"
                >
                    <IconAudit className="h-4 w-4" /> Modo Audit: {props.auditMode ? 'ON' : 'OFF'}
                </button>
                
                {/* Repetir aquí los botones de acción del viaje (Guardar, Compartir, Borrar) */}
                 <button 
                    onClick={() => { props.onSave(); setIsDrawerOpen(false); }} 
                    disabled={!props.hasResults || props.isSaving}
                    className="flex items-center gap-3 text-sm font-bold p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                    <IconSave className="h-4 w-4" /> Guardar
                </button>
                 <button 
                    onClick={() => { props.onShare(); setIsDrawerOpen(false); }} 
                    disabled={!props.currentTripId}
                    className="flex items-center gap-3 text-sm font-bold p-2 rounded-lg bg-green-500 text-white disabled:opacity-50"
                >
                    <IconShare className="h-4 w-4" /> Compartir
                </button>
                <button 
                    onClick={() => { props.onReset(); setIsDrawerOpen(false); }}
                    className="flex items-center gap-3 text-sm font-bold p-2 rounded-lg bg-red-500 text-white"
                >
                    <IconTrash className="h-4 w-4" /> Borrar Viaje
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}