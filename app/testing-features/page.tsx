'use client';

import React, { useState } from 'react';

export default function TestingFeaturesPage() {
  const [expandedSection, setExpandedSection] = useState<string>('intro');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'test-1': false,
    'test-2': false,
    'test-3': false,
    'test-4': false,
    'test-5': false,
    'test-6': false,
    'test-7': false,
    'test-8': false,
  });

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const allChecked = Object.values(checklist).every((v) => v);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">🧪 Testing CaraColaViajes v0.7</h1>
        <p className="text-orange-100 text-lg">Guía de pruebas interactiva para CARMEN</p>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Intro Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('intro')}
            className="w-full p-6 bg-blue-50 hover:bg-blue-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-blue-900">📖 Introducción</h2>
            <span className="text-2xl">{expandedSection === 'intro' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'intro' && (
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-base leading-relaxed">
                Hola CARMEN 👋, este testing es para que pruebes <strong>todas las funcionalidades</strong> de CaraColaViajes y nos des tu opinión sobre la experiencia.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <p className="text-amber-900 font-semibold">✨ Objetivo:</p>
                <p className="text-amber-800">Crear 3-5 viajes diferentes, explorar todas las funciones y reportar qué te parece la interfaz, facilidad de uso y cualquier problema que encuentres.</p>
              </div>
              <p className="text-gray-600 italic">
                Tiempo estimado: 20-30 minutos. Usa la checklist abajo para guiarte.
              </p>
            </div>
          )}
        </div>

        {/* Instrucciones Rápidas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('quick')}
            className="w-full p-6 bg-green-50 hover:bg-green-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-green-900">⚡ Instrucciones Rápidas</h2>
            <span className="text-2xl">{expandedSection === 'quick' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'quick' && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">1️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-800">Ingresa tu origen y destino</p>
                    <p className="text-gray-600">Usa ciudades grandes (Madrid, Barcelona, Valencia, etc.)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">2️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-800">Ajusta los parámetros del viaje</p>
                    <p className="text-gray-600">Fecha, consumo, precio combustible, km máximos por día</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">3️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-800">Mira el itinerario generado</p>
                    <p className="text-gray-600">Verás días, distancia, costo y un mapa interactivo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">4️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-800">Agrega puntos de interés (POI)</p>
                    <p className="text-gray-600">Busca restaurantes, hoteles, museos en cada día</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">5️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-800">Guarda tu viaje</p>
                    <p className="text-gray-600">Se guardará automáticamente en tu navegador</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checklist de Pruebas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('checklist')}
            className="w-full p-6 bg-purple-50 hover:bg-purple-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-purple-900">✅ Checklist de Pruebas</h2>
            <span className="text-2xl">{expandedSection === 'checklist' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'checklist' && (
            <div className="p-6 space-y-4">
              {[
                {
                  id: 'test-1',
                  title: 'Crear primer viaje',
                  desc: 'Madrid → Barcelona (destinos grandes para evitar errores)',
                },
                {
                  id: 'test-2',
                  title: 'Ajustar parámetros',
                  desc: 'Cambia fecha, consumo, precio. ¿La app recalcula rápido?',
                },
                {
                  id: 'test-3',
                  title: 'Explorar el mapa',
                  desc: 'Haz zoom, arrastra. ¿Es intuitivo? ¿Ves los marcadores claros?',
                },
                {
                  id: 'test-4',
                  title: 'Agregar POI (restaurantes, hoteles)',
                  desc: 'En un día específico, busca "restaurante" o "hotel". Agrega algunos.',
                },
                {
                  id: 'test-5',
                  title: 'Modificar un día (Vuelta a Casa)',
                  desc: 'Haz clic en un día, usa "Vuelta a Casa" (botón rojo). ¿Funciona?',
                },
                {
                  id: 'test-6',
                  title: 'Crear segundo viaje (diferente)',
                  desc: 'Valencia → Málaga. ¿Los datos antiguos se borran? ¿Comienzas limpio?',
                },
                {
                  id: 'test-7',
                  title: 'Probar formulario completo',
                  desc: 'Todos los campos: origen, destino, fecha, consumo, precio, km máx.',
                },
                {
                  id: 'test-8',
                  title: 'Genera un tercerviaje y guárdalo',
                  desc: 'Verifica que se guarda. Recarga la página. ¿Reaparece el viaje?',
                },
              ].map((test) => (
                <div key={test.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={checklist[test.id] || false}
                    onChange={() => toggleChecklist(test.id)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{test.title}</p>
                    <p className="text-gray-600 text-sm">{test.desc}</p>
                  </div>
                </div>
              ))}
              {allChecked && (
                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                  <p className="text-green-900 font-bold">🎉 ¡Todas las pruebas completadas!</p>
                  <p className="text-green-800">Ahora ve a la sección "Reporte de Feedback" para enviar tus comentarios.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Aspectos clave a evaluar */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('aspects')}
            className="w-full p-6 bg-cyan-50 hover:bg-cyan-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-cyan-900">🔍 Qué Evaluar (UX/Feedback)</h2>
            <span className="text-2xl">{expandedSection === 'aspects' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'aspects' && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-cyan-500 bg-cyan-50 rounded">
                  <p className="font-semibold text-cyan-900">💡 Intuición</p>
                  <p className="text-cyan-800 text-sm">¿Es fácil entender qué hacer? ¿Los botones son claros? ¿Necesitarías ayuda?</p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                  <p className="font-semibold text-blue-900">⚡ Velocidad</p>
                  <p className="text-blue-800 text-sm">¿La app responde rápido? ¿Hay delays al escribir o cambiar valores?</p>
                </div>
                <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded">
                  <p className="font-semibold text-indigo-900">🎨 Diseño</p>
                  <p className="text-indigo-800 text-sm">¿Colores, iconos y layout son agradables? ¿Se entienden bien?</p>
                </div>
                <div className="p-4 border-l-4 border-pink-500 bg-pink-50 rounded">
                  <p className="font-semibold text-pink-900">❌ Errores</p>
                  <p className="text-pink-800 text-sm">¿Algo no funcionó? ¿Mensajes de error claros o confusos?</p>
                </div>
                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                  <p className="font-semibold text-yellow-900">💭 Ideas</p>
                  <p className="text-yellow-800 text-sm">¿Algo que cambiarías o mejorarías? ¿Funciones que faltan?</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reporte de Feedback */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('feedback')}
            className="w-full p-6 bg-red-50 hover:bg-red-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-red-900">📋 Reporte de Feedback</h2>
            <span className="text-2xl">{expandedSection === 'feedback' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'feedback' && (
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Cuando termines todas las pruebas, <strong>copia este template</strong> y envíalo por correo:
              </p>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto space-y-2">
                <p className="text-gray-800">
                  <strong>📧 SUBJECT: Testing CaraColaViajes - Feedback CARMEN</strong>
                </p>
                <div className="border-t-2 border-gray-300 pt-4 space-y-3 text-gray-700">
                  <p>Hola,</p>
                  <p>Completé el testing. Aquí está mi feedback:</p>
                  <p>
                    <strong>✅ Lo que me gustó:</strong>
                    <br />
                    [Describe qué te pareció bien, intuitivo, agradable]
                  </p>
                  <p>
                    <strong>⚠️ Lo que confunde o molesta:</strong>
                    <br />
                    [Describe cualquier aspecto confuso, lento o frustante]
                  </p>
                  <p>
                    <strong>❌ Errores encontrados:</strong>
                    <br />
                    [Describe si algo no funcionó, con detalles: "Cuando hice X, pasó Y"]
                  </p>
                  <p>
                    <strong>💡 Ideas de mejora:</strong>
                    <br />
                    [Sugerencias, funciones que falten, cambios de diseño]
                  </p>
                  <p>
                    <strong>🔄 Pruebas completadas:</strong>
                    <br />
                    [Marca aquí: "8/8 ✅" o "5/8 ⚠️ (explica por qué)"]
                  </p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                ℹ️ Envía esto a: <strong className="text-gray-800">tu-email-aqui@domain.com</strong>
              </p>
            </div>
          )}
        </div>

        {/* Browser & Technical Notes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('technical')}
            className="w-full p-6 bg-slate-50 hover:bg-slate-100 flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-slate-900">⚙️ Notas Técnicas</h2>
            <span className="text-2xl">{expandedSection === 'technical' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'technical' && (
            <div className="p-6 space-y-4 text-gray-700">
              <div className="p-4 bg-slate-50 rounded">
                <p className="font-semibold text-slate-900">🌐 Navegadores soportados:</p>
                <p className="text-sm text-slate-800">Chrome, Edge, Firefox, Safari. Mejor con la versión más reciente.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <p className="font-semibold text-slate-900">📱 Responsive:</p>
                <p className="text-sm text-slate-800">La app funciona en desktop y tablet. Mobile limitado (mapa pequeño).</p>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <p className="font-semibold text-slate-900">💾 Guardado automático:</p>
                <p className="text-sm text-slate-800">Tu viaje se guarda en el navegador. No pierdas datos si borras cookies.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <p className="font-semibold text-slate-900">🐛 Si encuentras un bug:</p>
                <p className="text-sm text-slate-800">
                  Anota: qué hiciste, qué viste, en qué navegador. Abre DevTools (F12) y copia errores de la consola.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold mb-2">¡Gracias por tu feedback CARMEN! 🙏</p>
          <p className="text-orange-100">Tu opinión nos ayuda a mejorar CaraColaViajes</p>
        </div>
      </div>
    </div>
  );
}
