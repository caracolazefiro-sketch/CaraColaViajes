'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TestCase {
  id: string;
  category: 'critico' | 'ux' | 'funcional' | 'diseno' | 'futuro';
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  screenshot?: string;
  status: 'pending' | 'testing' | 'fixed' | 'verified' | 'wontfix';
  priority: 1 | 2 | 3;
  assignedTo?: string;
  notes: string;
  myFindings: string;
}

const initialTests: TestCase[] = [
  // ERRORES CRÍTICOS (5)
  {
    id: 'C1',
    category: 'critico',
    title: 'Botón "Ajustar Parada" - Error ZERO_RESULTS',
    description: 'Al hacer clic en "Ajustar Parada", aparece error ZERO_RESULTS de Google API',
    expectedBehavior: 'Debería abrir modal para ajustar la parada',
    actualBehavior: 'Muestra error "ZERO_RESULTS" en lugar del modal',
    screenshot: 'image1.png',
    status: 'pending',
    priority: 1,
    notes: 'Error crítico que bloquea edición de ruta. Revisar AdjustStageModal.tsx y llamadas a Directions API',
    myFindings: ''
  },
  {
    id: 'C2',
    category: 'critico',
    title: 'No se pueden borrar waypoints/paradas',
    description: 'Imposible eliminar paradas intermedias. Ejemplo: Cantagallo (Italy) añadido por error, +2000km',
    expectedBehavior: 'Botón de eliminar funcional en cada parada',
    actualBehavior: 'No hay forma de borrar waypoints una vez añadidos',
    screenshot: 'image2.png',
    status: 'pending',
    priority: 1,
    notes: 'Bug severo. Usuarios quedan atrapados con rutas incorrectas. Revisar useTripPlaces.ts',
    myFindings: ''
  },
  {
    id: 'C3',
    category: 'critico',
    title: 'Paradas intermedias ignoradas en itinerario',
    description: 'Ejemplo: Ruta Coruña → Bejar → Sevilla. Bejar no aparece en el plan de días',
    expectedBehavior: 'Todas las paradas intermedias deben aparecer en el itinerario diario',
    actualBehavior: 'Solo muestra origen y destino final',
    screenshot: 'image3.png',
    status: 'pending',
    priority: 1,
    notes: 'Revisar actions.ts - función getDirectionsAndCost. Waypoints no se procesan correctamente',
    myFindings: ''
  },
  {
    id: 'C4',
    category: 'critico',
    title: 'No hay botón "Nuevo Viaje"',
    description: 'Para crear un nuevo viaje hay que recargar toda la página',
    expectedBehavior: 'Botón visible para resetear y crear nuevo viaje',
    actualBehavior: 'Necesario hacer F5 para empezar de nuevo',
    screenshot: 'image4.png',
    status: 'pending',
    priority: 2,
    notes: 'Añadir botón de reset en AppHeader.tsx. Debe limpiar localStorage y state',
    myFindings: ''
  },
  {
    id: 'C5',
    category: 'critico',
    title: 'Fecha de vuelta no obligatoria pero sí necesaria',
    description: 'Campo "Fecha de vuelta" no marcado como requerido pero la app falla sin él',
    expectedBehavior: 'Campo required o validación visible',
    actualBehavior: 'Parece opcional pero causa errores',
    screenshot: 'image5.png',
    status: 'pending',
    priority: 2,
    notes: 'Revisar TripForm.tsx - añadir required o hacer el campo opcional de verdad',
    myFindings: ''
  },

  // MEJORAS UX (8)
  {
    id: 'UX1',
    category: 'ux',
    title: 'Scroll horizontal en resumen de viaje',
    description: 'El resumen de días se va hacia la derecha y requiere scroll horizontal',
    expectedBehavior: 'Contenido visible completo sin scroll horizontal',
    actualBehavior: 'Necesario hacer scroll para ver información',
    screenshot: 'image6.png',
    status: 'pending',
    priority: 2,
    notes: 'Revisar CSS en ItineraryPanel.tsx. Posible overflow-x-auto innecesario',
    myFindings: ''
  },
  {
    id: 'UX2',
    category: 'ux',
    title: 'Faltan botones (-) en contador de spots',
    description: 'Solo aparece botón (+) para incrementar, pero no (-) para decrementar',
    expectedBehavior: 'Botones + y - para ajustar cantidad',
    actualBehavior: 'Solo hay +, para decrementar hay que volver a clickear el spot',
    screenshot: 'image7.png',
    status: 'pending',
    priority: 2,
    notes: 'Añadir botón (-) en DaySpotsList.tsx junto al contador',
    myFindings: ''
  },
  {
    id: 'UX3',
    category: 'ux',
    title: 'Datos extraños en el mapa',
    description: 'Aparecen marcadores o datos no relacionados con la búsqueda actual',
    expectedBehavior: 'Solo mostrar marcadores relevantes al filtro activo',
    actualBehavior: 'Marcadores fantasma de búsquedas anteriores',
    screenshot: 'image8.png',
    status: 'pending',
    priority: 2,
    notes: 'Revisar TripMap.tsx - limpiar marcadores al cambiar de búsqueda',
    myFindings: ''
  },
  {
    id: 'UX4',
    category: 'ux',
    title: 'Mapa no actualiza desvíos',
    description: 'Al añadir parada intermedia, el mapa no muestra el nuevo trazado',
    expectedBehavior: 'Mapa se actualiza automáticamente con nueva ruta',
    actualBehavior: 'Necesario recargar para ver cambios',
    screenshot: 'image9.png',
    status: 'pending',
    priority: 2,
    notes: 'Revisar useEffect en TripMap.tsx - falta trigger al cambiar waypoints',
    myFindings: ''
  },
  {
    id: 'UX5',
    category: 'ux',
    title: 'Iconos de servicios poco claros',
    description: 'No todos los iconos son intuitivos (ej: agua, lavandería)',
    expectedBehavior: 'Iconos universalmente reconocibles',
    actualBehavior: 'Algunos requieren tooltip para entender',
    screenshot: 'image10.png',
    status: 'pending',
    priority: 3,
    notes: 'Revisar svgIcons.tsx - considerar rediseño de iconos ambiguos',
    myFindings: ''
  },
  {
    id: 'UX6',
    category: 'ux',
    title: 'Colores de spots muy similares',
    description: 'Difícil distinguir entre spots guardados y spots de búsqueda',
    expectedBehavior: 'Contraste claro entre estados (guardado vs temporal)',
    actualBehavior: 'Colores muy sutiles, fácil confundir',
    screenshot: 'image11.png',
    status: 'pending',
    priority: 3,
    notes: 'Revisar TripMap.tsx - aumentar contraste en colores de marcadores',
    myFindings: ''
  },
  {
    id: 'UX7',
    category: 'ux',
    title: 'Tooltip se queda pegado',
    description: 'A veces el tooltip de información no desaparece al mover el ratón',
    expectedBehavior: 'Tooltip desaparece al salir del elemento',
    actualBehavior: 'Permanece visible bloqueando contenido',
    screenshot: 'image12.png',
    status: 'pending',
    priority: 3,
    notes: 'Revisar eventos onMouseLeave en componentes con tooltip',
    myFindings: ''
  },
  {
    id: 'UX8',
    category: 'ux',
    title: 'Botón "Añadir" poco visible',
    description: 'El botón para añadir spots personalizados pasa desapercibido',
    expectedBehavior: 'Botón destacado y fácil de encontrar',
    actualBehavior: 'Color gris, se pierde entre otros elementos',
    screenshot: 'image13.wmf',
    status: 'pending',
    priority: 3,
    notes: 'Ya arreglado en commit reciente (cambio de morado a gris). Revisar si es suficiente',
    myFindings: ''
  },

  // TESTS FUNCIONALES (6)
  {
    id: 'F1',
    category: 'funcional',
    title: 'Búsqueda de spots funciona correctamente',
    description: 'Test de búsqueda de camping/pernocta en diferentes ubicaciones',
    expectedBehavior: 'Devuelve resultados relevantes según ubicación y filtros',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    status: 'pending',
    priority: 2,
    notes: 'Validar con ubicaciones reales: Madrid, Barcelona, Sevilla',
    myFindings: ''
  },
  {
    id: 'F2',
    category: 'funcional',
    title: 'Filtros de rating y distancia',
    description: 'Comprobar que los sliders filtran correctamente',
    expectedBehavior: 'Solo muestra spots que cumplen criterios',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    status: 'pending',
    priority: 2,
    notes: 'Test exhaustivo en /test-sliders-exhaustive',
    myFindings: ''
  },
  {
    id: 'F3',
    category: 'funcional',
    title: 'Cálculo de distancias y costes',
    description: 'Validar que los km y € calculados son correctos',
    expectedBehavior: 'Cálculos precisos basados en Google Directions',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    screenshot: 'image14.png',
    status: 'pending',
    priority: 2,
    notes: 'Comparar con Google Maps manualmente',
    myFindings: ''
  },
  {
    id: 'F4',
    category: 'funcional',
    title: 'Persistencia en localStorage',
    description: 'Comprobar que el viaje se guarda al recargar',
    expectedBehavior: 'Estado completo se mantiene tras F5',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    status: 'pending',
    priority: 2,
    notes: 'Crear viaje, recargar, verificar que todo persiste',
    myFindings: ''
  },
  {
    id: 'F5',
    category: 'funcional',
    title: 'Gráfica de elevación',
    description: 'Validar que el perfil de elevación se muestra correctamente',
    expectedBehavior: 'Gráfica visible con datos de Google Elevation API',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    screenshot: 'image15.png',
    status: 'pending',
    priority: 3,
    notes: 'Verificar con ruta montañosa (ej: Picos de Europa)',
    myFindings: ''
  },
  {
    id: 'F6',
    category: 'funcional',
    title: 'Exportar a PDF/Imprimir',
    description: 'Comprobar que la función de impresión funciona',
    expectedBehavior: 'PDF limpio con toda la información',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    screenshot: 'image16.png',
    status: 'pending',
    priority: 3,
    notes: 'Revisar @media print en globals.css',
    myFindings: ''
  },

  // DISEÑO (3)
  {
    id: 'D1',
    category: 'diseno',
    title: 'Coherencia visual',
    description: 'Validar que toda la UI sigue el mismo sistema de colores',
    expectedBehavior: 'Paleta coherente (rojos para camping, azules para info, etc)',
    actualBehavior: 'Algunos elementos con colores inconsistentes',
    screenshot: 'image17.png',
    status: 'pending',
    priority: 3,
    notes: 'Revisar TailwindCSS - crear variables CSS para colores principales',
    myFindings: ''
  },
  {
    id: 'D2',
    category: 'diseno',
    title: 'Responsividad móvil',
    description: 'Comprobar que la app funciona en pantallas pequeñas',
    expectedBehavior: 'Layout adaptado, botones accesibles, sin scroll horizontal',
    actualBehavior: 'PENDIENTE DE VALIDAR',
    status: 'pending',
    priority: 2,
    notes: 'Test con DevTools en 375px (iPhone SE) y 390px (iPhone 12)',
    myFindings: ''
  },
  {
    id: 'D3',
    category: 'diseno',
    title: 'Legibilidad de textos',
    description: 'Validar contraste y tamaño de fuente',
    expectedBehavior: 'Textos legibles según WCAG AA',
    actualBehavior: 'Algunos textos grises muy claros',
    screenshot: 'image18.png',
    status: 'pending',
    priority: 3,
    notes: 'Usar herramienta de contraste, ajustar text-gray-400 → text-gray-600',
    myFindings: ''
  },

  // PROPUESTAS FUTURAS (5)
  {
    id: 'P1',
    category: 'futuro',
    title: 'Modo oscuro',
    description: 'Implementar dark mode para uso nocturno',
    expectedBehavior: 'Toggle dark/light mode que persiste',
    actualBehavior: 'NO IMPLEMENTADO',
    status: 'wontfix',
    priority: 3,
    notes: 'V2.0 - Requiere rediseño completo de paleta',
    myFindings: ''
  },
  {
    id: 'P2',
    category: 'futuro',
    title: 'Compartir viaje por URL',
    description: 'Generar link para compartir itinerario',
    expectedBehavior: 'URL única que carga el viaje completo',
    actualBehavior: 'NO IMPLEMENTADO',
    status: 'pending',
    priority: 2,
    notes: 'Requiere backend (Supabase). Ver supabase-roadmap-setup.sql',
    myFindings: ''
  },
  {
    id: 'P3',
    category: 'futuro',
    title: 'Múltiples vehículos',
    description: 'Permitir seleccionar tipo de vehículo (coche, moto, bici)',
    expectedBehavior: 'Cálculo de costes adaptado al vehículo',
    actualBehavior: 'Solo autocaravana',
    status: 'wontfix',
    priority: 3,
    notes: 'Fuera de scope. App enfocada en campers',
    myFindings: ''
  },
  {
    id: 'P4',
    category: 'futuro',
    title: 'Integración con meteorología',
    description: 'Mostrar pronóstico del tiempo en cada parada',
    expectedBehavior: 'Iconos de clima en cada día del itinerario',
    actualBehavior: 'NO IMPLEMENTADO',
    status: 'pending',
    priority: 2,
    notes: 'Open-Meteo API ya integrada. Falta UI. Ver useWeather.ts',
    myFindings: ''
  },
  {
    id: 'P5',
    category: 'futuro',
    title: 'Rutas guardadas / Favoritos',
    description: 'Permitir guardar múltiples viajes',
    expectedBehavior: 'Lista de viajes guardados, carga rápida',
    actualBehavior: 'Solo 1 viaje en localStorage',
    status: 'pending',
    priority: 2,
    notes: 'Requiere Supabase. Alternativa: localStorage con array de trips',
    myFindings: ''
  }
];

export default function TestUsabilidadCarmen() {
  const [tests, setTests] = useState<TestCase[]>(initialTests);
  const [filter, setFilter] = useState<'all' | TestCase['category']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TestCase['status']>('all');

  useEffect(() => {
    const saved = localStorage.getItem('test_usabilidad_carmen_v07');
    if (saved) {
      setTests(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('test_usabilidad_carmen_v07', JSON.stringify(tests));
  }, [tests]);

  const updateTest = (id: string, field: keyof TestCase, value: any) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const filteredTests = tests.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: tests.length,
    pending: tests.filter(t => t.status === 'pending').length,
    testing: tests.filter(t => t.status === 'testing').length,
    fixed: tests.filter(t => t.status === 'fixed').length,
    verified: tests.filter(t => t.status === 'verified').length,
    critical: tests.filter(t => t.category === 'critico' && t.status !== 'fixed' && t.status !== 'verified').length
  };

  const exportMarkdown = () => {
    let md = `# Test de Usabilidad Carmen - V0.7\n\n`;
    md += `**Fecha:** ${new Date().toLocaleDateString('es-ES')}\n`;
    md += `**Tester:** Carmen (CMSG)\n`;
    md += `**Versión:** 0.7\n\n`;
    md += `## 📊 Resumen\n\n`;
    md += `- **Total:** ${stats.total} tests\n`;
    md += `- **Pendientes:** ${stats.pending}\n`;
    md += `- **En testing:** ${stats.testing}\n`;
    md += `- **Corregidos:** ${stats.fixed}\n`;
    md += `- **Verificados:** ${stats.verified}\n`;
    md += `- **Críticos sin resolver:** ${stats.critical}\n\n`;

    ['critico', 'ux', 'funcional', 'diseno', 'futuro'].forEach(cat => {
      const catTests = tests.filter(t => t.category === cat);
      md += `## ${cat === 'critico' ? '🔴 ERRORES CRÍTICOS' : cat === 'ux' ? '🎨 MEJORAS UX' : cat === 'funcional' ? '⚙️ TESTS FUNCIONALES' : cat === 'diseno' ? '🖼️ DISEÑO' : '🚀 PROPUESTAS FUTURAS'}\n\n`;
      catTests.forEach(t => {
        md += `### ${t.id} - ${t.title}\n\n`;
        md += `**Status:** ${t.status} | **Prioridad:** ${t.priority === 1 ? '🔴 Alta' : t.priority === 2 ? '🟡 Media' : '🟢 Baja'}\n\n`;
        md += `**Descripción:** ${t.description}\n\n`;
        md += `**Esperado:** ${t.expectedBehavior}\n\n`;
        md += `**Actual:** ${t.actualBehavior}\n\n`;
        if (t.screenshot) md += `**Screenshot:** \`${t.screenshot}\`\n\n`;
        md += `**Notas:** ${t.notes}\n\n`;
        md += `---\n\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-carmen-usabilidad-v07-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const categoryLabels = {
    critico: '🔴 Críticos',
    ux: '🎨 UX',
    funcional: '⚙️ Funcional',
    diseno: '🖼️ Diseño',
    futuro: '🚀 Futuro'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">👤 Test de Usabilidad - Carmen V0.7</h1>
          <p className="text-purple-100">Primer test externo completo - 27 casos documentados con screenshots</p>
          <p className="text-purple-200 text-sm mt-2">📅 04 Diciembre 2025 | Tester: Carmen (CMSG)</p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-xs text-red-700 mb-1">⏳ Pendientes</div>
            <div className="text-3xl font-bold text-red-700">{stats.pending}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-xs text-yellow-700 mb-1">🔬 Testing</div>
            <div className="text-3xl font-bold text-yellow-700">{stats.testing}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-xs text-blue-700 mb-1">🔧 Corregidos</div>
            <div className="text-3xl font-bold text-blue-700">{stats.fixed}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-xs text-green-700 mb-1">✅ Verificados</div>
            <div className="text-3xl font-bold text-green-700">{stats.verified}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 border-2 border-orange-500">
            <div className="text-xs text-orange-700 mb-1 font-bold">🚨 CRÍTICOS</div>
            <div className="text-3xl font-bold text-orange-700">{stats.critical}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Categoría</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Todos
                </button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as TestCase['category'])}
                    className={`px-3 py-1 rounded text-sm ${filter === key ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Estado</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded text-sm ${statusFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Todos
                </button>
                {['pending', 'testing', 'fixed', 'verified'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as TestCase['status'])}
                    className={`px-3 py-1 rounded text-sm ${statusFilter === s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {s === 'pending' ? '⏳' : s === 'testing' ? '🔬' : s === 'fixed' ? '🔧' : '✅'} {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={exportMarkdown}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
            >
              📥 Exportar Markdown
            </button>
          </div>
        </div>

        {/* Test Cases */}
        <div className="space-y-4">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                test.category === 'critico' ? 'border-red-600' :
                test.category === 'ux' ? 'border-purple-500' :
                test.category === 'funcional' ? 'border-blue-500' :
                test.category === 'diseno' ? 'border-green-500' :
                'border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {test.id} - {test.title}
                  </h3>
                  <p className="text-sm text-gray-900">{test.description}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  test.priority === 1 ? 'bg-red-600 text-white' :
                  test.priority === 2 ? 'bg-yellow-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  P{test.priority}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-green-700">✅ Esperado:</label>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">{test.expectedBehavior}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-red-700">❌ Actual (reportado por Carmen):</label>
                  <p className="text-sm text-gray-900 bg-red-50 p-3 rounded border border-red-200">{test.actualBehavior}</p>
                </div>
              </div>

              {test.screenshot && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <label className="text-xs font-bold text-gray-700 block mb-2">📸 Screenshot:</label>
                  <code className="text-xs text-blue-600">{test.screenshot}</code>
                  <p className="text-xs text-gray-500 mt-1">
                    Ubicación: <code>CHEMA/TESTING/screenshots/carmen-v07/{test.screenshot}</code>
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-900 block mb-2">🔍 MIS HALLAZGOS (lo que yo encuentro al testar):</label>
                <textarea
                  value={test.myFindings || ''}
                  onChange={(e) => updateTest(test.id, 'myFindings', e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 rounded text-sm text-gray-900 bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Escribe aquí lo que observas al probar este caso... ¿Funciona? ¿Falla? ¿Comportamiento diferente al reportado por Carmen?"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 block mb-2">📝 Notas técnicas (contexto de Carmen):</label>
                <textarea
                  value={test.notes}
                  onChange={(e) => updateTest(test.id, 'notes', e.target.value)}
                  className="w-full p-2 border rounded text-sm text-gray-900 bg-gray-50"
                  rows={2}
                  readOnly
                />
              </div>

              <div className="flex gap-2">
                {(['pending', 'testing', 'fixed', 'verified', 'wontfix'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => updateTest(test.id, 'status', status)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      test.status === status
                        ? status === 'pending' ? 'bg-red-600 text-white' :
                          status === 'testing' ? 'bg-yellow-500 text-white' :
                          status === 'fixed' ? 'bg-blue-600 text-white' :
                          status === 'verified' ? 'bg-green-600 text-white' :
                          'bg-gray-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {status === 'pending' ? '⏳ Pendiente' :
                     status === 'testing' ? '🔬 Testing' :
                     status === 'fixed' ? '🔧 Corregido' :
                     status === 'verified' ? '✅ Verificado' :
                     '🚫 Wontfix'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay tests que coincidan con los filtros seleccionados
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white rounded-lg shadow p-4 mt-6 text-sm text-gray-600">
          <p className="font-bold mb-2">📋 Instrucciones de uso:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Clickea en los botones de estado para marcar progreso (Pendiente → Testing → Corregido → Verificado)</li>
            <li>Las notas técnicas se guardan automáticamente en localStorage</li>
            <li>Usa los filtros para enfocarte en categorías o estados específicos</li>
            <li>Exporta a Markdown para documentar en el repositorio</li>
            <li>Prioridad 1 (P1) = Crítico, P2 = Medio, P3 = Bajo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
