// --------------------------------------------------------------------------
// AppHeader.tsx - VERSIÓN LOGIN/LOGOUT (Solo Logo y Acceso)
// --------------------------------------------------------------------------
'use client'; 
import React, { useState } from 'react';
import Image from 'next/image'; 

// MenuIcon (Se mantiene el placeholder SVG por si lo necesitas en móvil, aunque lo ocultaremos)
const MenuIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// NOTA: ASUMO QUE UserArea maneja el estado de la sesión, pero lo simplificaremos.
// En este caso, crearemos un componente de navegación simple.

const LogoComponent = () => (
    <div className="flex items-center">
      <Image 
        src="/logo.jpg" 
        alt="CaraCola Viajes Logo" 
        width={40} 
        height={40} 
        priority
      />
      {/* Opcional: Añadir el nombre de la app para claridad */}
      <span className="ml-2 text-xl font-bold text-red-600">CaraCola</span>
    </div>
);

// --- Nuevo Componente para Enlaces de Login/Logout ---
const AuthLinks = ({ isAuthenticated }) => {
    if (isAuthenticated) {
        // Opción Logueado (Ver en la imagen que me enviaste antes: Mis Viajes, Salir)
        return (
            <div className="flex items-center space-x-4">
                <button className="text-sm font-medium text-gray-700 hover:text-red-600">
                    Mis Viajes
                </button>
                <button className="text-sm font-medium text-red-600 hover:text-red-800">
                    Salir
                </button>
            </div>
        );
    }
    
    // Opción No Logueado (Ver en la imagen que me enviaste antes: Magic Link, Contraseña, Registrarse)
    return (
        <div className="flex items-center space-x-4">
            <a href="/magic-link" className="text-sm font-medium text-red-600 hover:underline">Magic Link</a>
            <a href="/login" className="text-sm font-medium text-gray-700 hover:underline">Contraseña</a>
            <a href="/register" className="text-sm font-medium text-gray-700 hover:underline">Registrarse</a>
        </div>
    );
};
// -----------------------------------------------------

const AppHeader = ({ isAuthenticated = false }) => {
  // El menú móvil/Drawer se puede eliminar si esta cabecera es solo para Login/Registro
  // Pero lo mantendremos simple para esta versión:
  
  return (
    // Se mantiene la estructura fixed w-full z-10 bg-white shadow-md p-4 flex items-center justify-between
    <header className="fixed w-full z-10 bg-white shadow-md p-4 flex items-center justify-between">
      
      {/* 1. Bloque Izquierdo: Logo */}
      <LogoComponent />

      {/* 2. Bloque Derecho: Controles de Autenticación */}
      {/* Eliminamos los controles responsivos de menú hamburguesa */}
      <div className="flex items-center">
        {/* Aquí pasamos el estado de autenticación (debería venir de un Contexto global) */}
        <AuthLinks isAuthenticated={isAuthenticated} />
      </div>

    </header>
  );
};

export default AppHeader;
// --------------------------------------------------------------------------