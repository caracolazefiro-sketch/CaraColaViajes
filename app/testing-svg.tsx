'use client';

import React, { useState } from 'react';

// Iconos SVG profesionales (reemplazan emojis)

// Search icon (reemplaza 🔍)
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Settings icon (reemplaza ⚙️)
const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Trophy icon (reemplaza 🏆)
const IconTrophy = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4a2 2 0 012-2h8a2 2 0 012 2v2h3a1 1 0 110 2h-.581l1.207 9.655A2 2 0 0120.126 20H3.874a2 2 0 01-1.993-1.887L3.581 8H3a1 1 0 110-2h3V4zm3 2v3h6V6H9z" />
  </svg>
);

// Diamond icon (reemplaza 💎)
const IconDiamond = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Fire icon (reemplaza 🔥)
const IconFire = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.94 5.76c-.31-.82-1.57-.82-1.88 0-1.27 3.4-2.69 6.89-2.69 10.14 0 3.76 2.91 6.81 6.5 6.81 3.59 0 6.5-3.05 6.5-6.81 0-3.25-1.42-6.74-2.69-10.14zM12 17.76c-2.24 0-4-1.66-4-3.7 0-1.76 1.24-3.9 2.15-5.85.41.84 1.13 2.2 1.85 3.67.72-1.47 1.44-2.83 1.85-3.67.91 1.95 2.15 4.09 2.15 5.85 0 2.04-1.76 3.7-4 3.7z" />
  </svg>
);

// Pin/Location icon (reemplaza 📍)
const IconPin = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
  </svg>
);

export default function TestingSVGPage() {
  const [activeSection, setActiveSection] = useState<'search' | 'settings' | 'badges' | 'logo'>('search');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🎨 Testing v0.7 - Iconografía SVG
          </h1>
          <p className="text-lg text-gray-600">
            Aquí puedes probar el reemplazo de emojis por iconos SVG profesionales
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {[
            { id: 'search' as const, label: 'Botón Buscar (🔍)', icon: '🔎' },
            { id: 'settings' as const, label: 'Botón Ajustar (⚙️)', icon: '⚙️' },
            { id: 'badges' as const, label: 'Badges (Iconos)', icon: '🏆' },
            { id: 'logo' as const, label: 'Logo Impresión', icon: '🖨️' },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeSection === id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-lg p-8">

          {/* SEARCH ICON SECTION */}
          {activeSection === 'search' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">🔍 Botón Buscar</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-4">❌ ANTES (Emoji)</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    🔍 Buscar
                  </button>
                  <p className="text-sm text-gray-600 mt-4">Emoji 🔍 poco profesional</p>
                </div>

                {/* After */}
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-4">✅ DESPUÉS (SVG)</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <IconSearch /> Buscar
                  </button>
                  <p className="text-sm text-gray-600 mt-4">Icono SVG escalable y profesional</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700">
                  <strong>✔️ Ventaja:</strong> El icono SVG se ajusta al tamaño del botón y se ve nítido en cualquier resolución.
                </p>
              </div>
            </div>
          )}

          {/* SETTINGS ICON SECTION */}
          {activeSection === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">⚙️ Botón Ajustar Etapas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-4">❌ ANTES (Emoji)</h3>
                  <button className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded hover:bg-gray-300">
                    ⚙️
                  </button>
                  <p className="text-sm text-gray-600 mt-4">Emoji ⚙️ en botón de etapa</p>
                </div>

                {/* After */}
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-4">✅ DESPUÉS (SVG)</h3>
                  <button className="flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    <IconSettings />
                  </button>
                  <p className="text-sm text-gray-600 mt-4">Icono SVG con color controlable</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700">
                  <strong>✔️ Ventaja:</strong> El color y tamaño del icono se pueden personalizar con CSS/Tailwind.
                </p>
              </div>
            </div>
          )}

          {/* BADGES SECTION */}
          {activeSection === 'badges' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">🏆 Badges en Resultados</h2>
              
              <p className="text-gray-700 mb-6">Reemplazo de emojis por iconos SVG con colores:</p>

              <div className="space-y-6">
                {/* Trophy Badge */}
                <div className="border rounded-lg p-4 bg-amber-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Trophy / Mejor Valorado</h3>
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-full">
                      <span className="text-2xl">🏆</span>
                      <span className="text-sm font-semibold">ANTES</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-full">
                      <IconTrophy className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-semibold">DESPUÉS</span>
                    </div>
                  </div>
                </div>

                {/* Diamond Badge */}
                <div className="border rounded-lg p-4 bg-cyan-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Diamond / Premium</h3>
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-cyan-300 rounded-full">
                      <span className="text-2xl">💎</span>
                      <span className="text-sm font-semibold">ANTES</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-cyan-300 rounded-full">
                      <IconDiamond className="h-5 w-5 text-cyan-600" />
                      <span className="text-sm font-semibold">DESPUÉS</span>
                    </div>
                  </div>
                </div>

                {/* Fire Badge */}
                <div className="border rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Fire / Top Trending</h3>
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-red-300 rounded-full">
                      <span className="text-2xl">🔥</span>
                      <span className="text-sm font-semibold">ANTES</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-red-300 rounded-full">
                      <IconFire className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold">DESPUÉS</span>
                    </div>
                  </div>
                </div>

                {/* Pin Badge */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Pin / Ubicación Especial</h3>
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-green-300 rounded-full">
                      <span className="text-2xl">📍</span>
                      <span className="text-sm font-semibold">ANTES</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-green-300 rounded-full">
                      <IconPin className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold">DESPUÉS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700">
                  <strong>✔️ Ventaja:</strong> Iconos SVG coloreados se ven más profesionales y consistentes con el diseño de la marca.
                </p>
              </div>
            </div>
          )}

          {/* LOGO SECTION */}
          {activeSection === 'logo' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">🖨️ Logo en Modo Impresión</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-4">❌ ANTES</h3>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-2xl">🐌 CaraCola Viajes</p>
                    <p className="text-xs text-gray-600 mt-2">Emoji 🐌 en impresión</p>
                  </div>
                </div>

                {/* After */}
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-4">✅ DESPUÉS</h3>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <img src="/logo.jpg" alt="CaraCola Logo" className="h-8 w-8 rounded" />
                      <p className="font-semibold">CaraCola Viajes</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Logo profesional (logo.jpg)</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700">
                  <strong>✔️ Ventaja:</strong> El logo se ve profesional en impresión y PDFs. Se carga correctamente desde /public/logo.jpg.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">📝 Checklist de Testing</h3>
          <div className="space-y-2 text-sm text-gray-700 max-w-xl mx-auto">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Botón Buscar (🔍) muestra icono SVG</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Botón Ajustar (⚙️) muestra icono SVG</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Badges con colores corretos</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Logo aparece correctamente</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Iconos se ven nítidos en todos los tamaños</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
