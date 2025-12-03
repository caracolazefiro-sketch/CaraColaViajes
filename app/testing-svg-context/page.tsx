'use client';

import React, { useState } from 'react';

// SVG Icons (mismo set que app/testing-svg.tsx)
const IconSearch = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconSettings = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconTrophy = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4a2 2 0 012-2h8a2 2 0 012 2v2h3a1 1 0 110 2h-.581l1.207 9.655A2 2 0 0120.126 20H3.874a2 2 0 01-1.993-1.887L3.581 8H3a1 1 0 110-2h3V4zm3 2v3h6V6H9z" />
  </svg>
);

const IconDiamond = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconFire = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.94 5.76c-.31-.82-1.57-.82-1.88 0-1.27 3.4-2.69 6.89-2.69 10.14 0 3.76 2.91 6.81 6.5 6.81 3.59 0 6.5-3.05 6.5-6.81 0-3.25-1.42-6.74-2.69-10.14zM12 17.76c-2.24 0-4-1.66-4-3.7 0-1.76 1.24-3.9 2.15-5.85.41.84 1.13 2.2 1.85 3.67.72-1.47 1.44-2.83 1.85-3.67.91 1.95 2.15 4.09 2.15 5.85 0 2.04-1.76 3.7-4 3.7z" />
  </svg>
);

const IconPin = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
  </svg>
);

export default function SVGTestingContextPage() {
  const [checklist, setChecklist] = useState({
    search: false,
    settings: false,
    badges: false,
    responsive: false,
    print: false,
    colors: false,
  });

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎨 SVG Icons Testing v0.7</h1>
          <p className="text-lg text-gray-600">Pruebas de iconos SVG en contexto real de la aplicación</p>
          <div className="mt-4 flex gap-4">
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
              Checklist: {completedCount}/6
            </div>
          </div>
        </div>

        {/* Real Context Testing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Search Icon Testing */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <h2 className="text-xl font-bold">🔍 Botón Buscar</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">Dónde aparece: Campo de búsqueda de lugares</p>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">❌ ANTES (Emoji):</div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                  🔍 Buscar lugar
                </button>

                <div className="text-sm text-gray-600 mt-4">✅ DESPUÉS (SVG):</div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  <IconSearch className="h-5 w-5" /> Buscar lugar
                </button>
              </div>

              <div className="bg-green-50 p-3 rounded text-sm text-green-900">
                <strong>✔️ Prueba:</strong> ¿El icono SVG se ve nítido? ¿Alineado correctamente?
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input 
                  type="checkbox" 
                  checked={checklist.search}
                  onChange={() => toggleCheck('search')}
                  className="w-4 h-4"
                />
                <span className="text-sm">SVG se ve bien</span>
              </label>
            </div>
          </div>

          {/* Settings Icon Testing */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
              <h2 className="text-xl font-bold">⚙️ Botón Ajustar Etapas</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">Dónde aparece: Fila de cada día en itinerario</p>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">❌ ANTES (Emoji):</div>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                  ⚙️
                </button>

                <div className="text-sm text-gray-600 mt-4">✅ DESPUÉS (SVG):</div>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition">
                  <IconSettings className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-green-50 p-3 rounded text-sm text-green-900">
                <strong>✔️ Prueba:</strong> ¿El color es correcto? ¿Se ve bien en botón pequeño?
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input 
                  type="checkbox" 
                  checked={checklist.settings}
                  onChange={() => toggleCheck('settings')}
                  className="w-4 h-4"
                />
                <span className="text-sm">SVG se ve bien</span>
              </label>
            </div>
          </div>

        </div>

        {/* Badges Testing */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-4">
            <h2 className="text-xl font-bold">🏆 Badges en Resultados</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 text-sm mb-6">Dónde aparece: Badges en cards de destinos/recomendaciones</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trophy */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Trophy - Mejor Valorado</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-sm">
                    <span>🏆</span> ANTES
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-sm">
                    <IconTrophy className="h-4 w-4 text-amber-700" /> DESPUÉS
                  </div>
                </div>
              </div>

              {/* Diamond */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Diamond - Premium</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-100 rounded-full text-sm">
                    <span>💎</span> ANTES
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-100 rounded-full text-sm">
                    <IconDiamond className="h-4 w-4 text-cyan-700" /> DESPUÉS
                  </div>
                </div>
              </div>

              {/* Fire */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Fire - Top Trending</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-sm">
                    <span>🔥</span> ANTES
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-sm">
                    <IconFire className="h-4 w-4 text-red-700" /> DESPUÉS
                  </div>
                </div>
              </div>

              {/* Pin */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Pin - Ubicación Especial</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-sm">
                    <span>📍</span> ANTES
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-sm">
                    <IconPin className="h-4 w-4 text-green-700" /> DESPUÉS
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded text-sm text-green-900 mt-6">
              <strong>✔️ Prueba:</strong> ¿Los colores son consistentes? ¿Se ven bien juntos a emojis?
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input 
                type="checkbox" 
                checked={checklist.badges}
                onChange={() => toggleCheck('badges')}
                className="w-4 h-4"
              />
              <span className="text-sm">Badges se ven bien</span>
            </label>
          </div>
        </div>

        {/* Responsive Testing */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
            <h2 className="text-xl font-bold">📱 Testing Responsivo</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 text-sm mb-6">Cómo se ven los iconos en diferentes tamaños:</p>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Tamaño pequeño (h-4):</p>
                <div className="flex gap-4 items-center">
                  <IconSearch className="h-4 w-4" />
                  <IconSettings className="h-4 w-4" />
                  <IconTrophy className="h-4 w-4" />
                  <IconDiamond className="h-4 w-4" />
                  <IconFire className="h-4 w-4" />
                  <IconPin className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Tamaño medio (h-6):</p>
                <div className="flex gap-4 items-center">
                  <IconSearch className="h-6 w-6" />
                  <IconSettings className="h-6 w-6" />
                  <IconTrophy className="h-6 w-6" />
                  <IconDiamond className="h-6 w-6" />
                  <IconFire className="h-6 w-6" />
                  <IconPin className="h-6 w-6" />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Tamaño grande (h-10):</p>
                <div className="flex gap-4 items-center">
                  <IconSearch className="h-10 w-10" />
                  <IconSettings className="h-10 w-10" />
                  <IconTrophy className="h-10 w-10" />
                  <IconDiamond className="h-10 w-10" />
                  <IconFire className="h-10 w-10" />
                  <IconPin className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded text-sm text-green-900 mt-6">
              <strong>✔️ Prueba:</strong> ¿Los iconos se escalan bien? ¿Se ven nítidos en todos los tamaños?
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input 
                type="checkbox" 
                checked={checklist.responsive}
                onChange={() => toggleCheck('responsive')}
                className="w-4 h-4"
              />
              <span className="text-sm">Escalado responsivo funciona</span>
            </label>
          </div>
        </div>

        {/* Color Testing */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
            <h2 className="text-xl font-bold">🎨 Testing de Colores</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 text-sm mb-6">Cómo se ven con diferentes colores:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['text-gray-400', 'text-blue-600', 'text-orange-600', 'text-red-600', 'text-green-600', 'text-amber-600', 'text-purple-600', 'text-gray-900'].map((colorClass, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className={`${colorClass}`}>
                    <IconSearch className="h-8 w-8" />
                  </div>
                  <p className="text-xs text-gray-600 text-center">{colorClass.replace('text-', '')}</p>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded text-sm text-green-900 mt-6">
              <strong>✔️ Prueba:</strong> ¿El color se aplica correctamente a los iconos? ¿Se ven bien en todos los colores?
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input 
                type="checkbox" 
                checked={checklist.colors}
                onChange={() => toggleCheck('colors')}
                className="w-4 h-4"
              />
              <span className="text-sm">Colores funcionan correctamente</span>
            </label>
          </div>
        </div>

        {/* Print Test */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4">
            <h2 className="text-xl font-bold">🖨️ Testing de Impresión</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 text-sm mb-6">Cómo se ven al imprimir (Ctrl+P):</p>
            
            <div className="border-2 border-gray-200 p-6 bg-white rounded" style={{pageBreakAfter: 'always'}}>
              <div className="flex items-center gap-3 mb-4">
                <IconSearch className="h-6 w-6 text-gray-800" />
                <h3 className="text-xl font-bold">Itinerario de Viaje</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconSettings className="h-5 w-5" /> Configuración personalizada
                </div>
                <div className="flex items-center gap-2">
                  <IconTrophy className="h-5 w-5" /> Destino recomendado
                </div>
                <div className="flex items-center gap-2">
                  <IconPin className="h-5 w-5" /> Ubicación guardada
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded text-sm text-blue-900 mt-6">
              <p><strong>💡 Instrucción:</strong> Abre DevTools (F12), ve a Print Preview, y verifica que los iconos SVG se ven bien en la versión impresa.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input 
                type="checkbox" 
                checked={checklist.print}
                onChange={() => toggleCheck('print')}
                className="w-4 h-4"
              />
              <span className="text-sm">Impresión se ve correcta</span>
            </label>
          </div>
        </div>

        {/* Final Checklist & Verdict */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">✅ RESUMEN DE TESTING</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-4xl font-bold">{completedCount}/6</div>
              <p className="text-sm opacity-90">Tests completados</p>
            </div>
            <div className={`rounded-lg p-4 ${completedCount >= 5 ? 'bg-green-500 bg-opacity-30' : 'bg-yellow-500 bg-opacity-30'}`}>
              <p className="font-semibold text-lg">
                {completedCount >= 5 ? '✅ Listo para producción' : '⏳ En progreso'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="font-semibold text-lg">{completedCount === 6 ? '🎉 PERFECTO' : Math.round((completedCount/6)*100) + '%'}</p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-30">
            <p className="text-sm mb-4">
              {completedCount === 6 
                ? "🎉 ¡Todos los tests pasaron! Los SVG icons están listos para implementación en producción."
                : completedCount >= 4
                ? "✅ Casi listo. Completa los tests pendientes."
                : "🔄 En progreso. Continúa con los tests."}
            </p>
            <p className="text-xs opacity-80">
              Cuando termines todos, reporta resultados: GitHub PR o email con checklist completado.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
