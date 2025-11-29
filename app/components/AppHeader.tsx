// --------------------------------------------------------------------------
// AppHeader.tsx - FINAL (Tailwind CSS, Logo Corregido, SVG Placeholder)
// --------------------------------------------------------------------------
'use client'; 
import React, { useState } from 'react';
import Image from 'next/image'; 

// Componente SVG Placeholder para el Menú
// Lo usamos porque no hay librería de iconos instalada.
const MenuIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// IMPORTACIONES LOCALES
import UserArea from './UserArea'; // Tu componente existente

const AppHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Componente para el Logo (Apuntando a logo.jpg en /public)
  const LogoComponent = () => (
    <div className="flex items-center">
      <Image 
        src="/logo.jpg" // RUTA CORREGIDA
        alt="CaraCola Viajes Logo" 
        width={40} 
        height={40} 
        priority
      />
    </div>
  );

  // --- Botones de Acción (Reemplazan los componentes Button de MUI) ---
  const ActionButtons = () => (
    <div className="flex space-x-4"> 
      <button className="text-gray-700 hover:text-blue-600 font-medium transition duration-150 ease-in-out">
        Buscar Viajes
      </button>
      <button className="text-gray-700 hover:text-yellow-600 font-medium transition duration-150 ease-in-out">
        # 🐌 MANIFIESTO
      </button>
    </div>
  );
  // --------------------------------------------------------------------------

  return (
    // Estilos de cabecera: Fijo, ancho completo, centrado de items y separación de bloques
    <header className="fixed w-full z-10 bg-white shadow-md p-4 flex items-center justify-between">
      
      {/* 1. Bloque Izquierdo: Logo */}
      <LogoComponent />

      {/* 2. Bloque Derecho: Controles y Área de Usuario */}
      <div className="flex items-center space-x-4">
        
        {/* A. Botones de Acción (ESCRITORIO: visible en sm:flex, oculto por defecto) */}
        <div className="hidden sm:flex"> 
          <ActionButtons />
        </div>

        {/* B. Icono de Menú Hamburguesa (MÓVIL: block por defecto, oculto en sm:hidden) */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="sm:hidden p-2 text-gray-700 hover:text-blue-600"
          aria-label="Menú principal"
        >
          <MenuIcon className="h-6 w-6" /> 
        </button>
        
        {/* C. Área de Usuario (SIEMPRE VISIBLE) */}
        <UserArea />
      </div>

      {/* 3. Drawer para Menú Móvil */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden" 
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out transform translate-x-0"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="p-4">
                <p className="text-xl font-semibold mb-4 border-b pb-2">Menú CaraCola</p>
                <div className="flex flex-col space-y-2">
                    <button 
                        onClick={() => { /* Manejar clic del botón */ setIsDrawerOpen(false); }}
                        className="w-full text-left p-2 text-gray-700 hover:bg-gray-100 font-medium"
                    >
                        Buscar Viajes
                    </button>
                    <button 
                        onClick={() => { /* Manejar clic del botón */ setIsDrawerOpen(false); }}
                        className="w-full text-left p-2 text-gray-700 hover:bg-gray-100 font-medium"
                    >
                        # 🐌 MANIFIESTO
                    </button>
                    {/* Añadir más enlaces de navegación aquí */}
                </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
// --------------------------------------------------------------------------