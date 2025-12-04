'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  id: string;
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'pending' | 'n/a';
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes: string;
  screenshot?: string;
}

export default function TestCarmenFeedback() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Cargar resultados del localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('test_carmen_feedback_v07');
    if (saved) {
      setResults(JSON.parse(saved));
    } else {
      // Inicializar con los tests de Carmen
      setResults(initialTests);
    }
  }, []);

  // Guardar en localStorage cada vez que cambian los resultados
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem('test_carmen_feedback_v07', JSON.stringify(results));
    }
  }, [results]);

  const updateTest = (id: string, field: keyof TestResult, value: any) => {
    setResults(prev => prev.map(test => 
      test.id === id ? { ...test, [field]: value } : test
    ));
  };

  const exportResults = () => {
    const markdown = generateMarkdown(results);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carmen-feedback-v07-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const categories = Array.from(new Set(results.map(t => t.category)));
  
  const getStats = () => {
    const total = results.length;
    const pass = results.filter(t => t.status === 'pass').length;
    const fail = results.filter(t => t.status === 'fail').length;
    const pending = results.filter(t => t.status === 'pending').length;
    const critical = results.filter(t => t.priority === 'critical' && t.status === 'fail').length;
    return { total, pass, fail, pending, critical };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📋 Test Carmen - Feedback V0.7
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Primer test externo realizado por Carmen (CMSG) - 04.12.2025
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-100 rounded p-3">
              <div className="text-xs text-gray-600">Total Tests</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-green-100 rounded p-3">
              <div className="text-xs text-green-700">✅ Pass</div>
              <div className="text-2xl font-bold text-green-700">{stats.pass}</div>
            </div>
            <div className="bg-red-100 rounded p-3">
              <div className="text-xs text-red-700">❌ Fail</div>
              <div className="text-2xl font-bold text-red-700">{stats.fail}</div>
            </div>
            <div className="bg-yellow-100 rounded p-3">
              <div className="text-xs text-yellow-700">⏳ Pending</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            </div>
            <div className="bg-orange-100 rounded p-3">
              <div className="text-xs text-orange-700">🔴 Critical</div>
              <div className="text-2xl font-bold text-orange-700">{stats.critical}</div>
            </div>
          </div>

          <button
            onClick={exportResults}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📥 Exportar Markdown
          </button>
        </div>

        {/* Tests por categoría */}
        {categories.map(category => {
          const categoryTests = results.filter(t => t.category === category);
          const isExpanded = expandedCategory === category;
          
          return (
            <div key={category} className="bg-white rounded-lg shadow-md mb-4">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{category}</h2>
                  <p className="text-sm text-gray-600">
                    {categoryTests.filter(t => t.status === 'pass').length} pass / {categoryTests.filter(t => t.status === 'fail').length} fail
                  </p>
                </div>
                <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="p-4 border-t space-y-4">
                  {categoryTests.map(test => (
                    <div key={test.id} className="border rounded p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900">{test.test}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          test.priority === 'critical' ? 'bg-red-600 text-white' :
                          test.priority === 'high' ? 'bg-orange-500 text-white' :
                          test.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {test.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {(['pass', 'fail', 'pending', 'n/a'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => updateTest(test.id, 'status', status)}
                            className={`px-3 py-1 rounded text-xs font-bold ${
                              test.status === status
                                ? status === 'pass' ? 'bg-green-600 text-white' :
                                  status === 'fail' ? 'bg-red-600 text-white' :
                                  status === 'pending' ? 'bg-yellow-600 text-white' :
                                  'bg-gray-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {status === 'pass' ? '✅ PASS' :
                             status === 'fail' ? '❌ FAIL' :
                             status === 'pending' ? '⏳ PENDING' :
                             'N/A'}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={test.notes}
                        onChange={(e) => updateTest(test.id, 'notes', e.target.value)}
                        placeholder="Notas, observaciones, contexto..."
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tests iniciales basados en el feedback de Carmen
const initialTests: TestResult[] = [
  // ERRORES CRÍTICOS
  {
    id: 'crit-1',
    category: '🔴 ERRORES CRÍTICOS',
    test: 'Botón "Ajustar Parada" - Error ZERO_RESULTS',
    status: 'fail',
    priority: 'critical',
    notes: 'Carmen reporta: Una vez calculado el itinerario, si se presiona el botón de ajustar parada, deja incluir una parada pero no la actualiza y sale error "Error: Google API Error: ZERO_RESULTS"'
  },
  {
    id: 'crit-2',
    category: '🔴 ERRORES CRÍTICOS',
    test: 'No se puede eliminar etapa/parada',
    status: 'fail',
    priority: 'critical',
    notes: 'Carmen reporta: Se añadió Cantagallo (pueblo España) pero confirmó propuesta de Italia con mismo nombre. Añadió 2000km y no hay opción para eliminar error.'
  },
  {
    id: 'crit-3',
    category: '🔴 ERRORES CRÍTICOS',
    test: 'Paradas intermedias ignoradas en itinerario',
    status: 'fail',
    priority: 'critical',
    notes: 'Carmen reporta: Se incluyó Bejar como parada intermedia en pantalla principal y no se tiene en cuenta en el itinerario. Diferencia entre PARADA INTERMEDIA y DESTINO INTERMEDIO no está clara.'
  },
  {
    id: 'crit-4',
    category: '🔴 ERRORES CRÍTICOS',
    test: 'No hay botón "Nuevo Viaje" / "Reiniciar"',
    status: 'fail',
    priority: 'high',
    notes: 'Carmen reporta: No hay manera de crear nuevo viaje sin recargar página. Si vuelves con link, mantiene viaje anterior. Hay que salir de usuario.'
  },
  {
    id: 'crit-5',
    category: '🔴 ERRORES CRÍTICOS',
    test: 'Fecha regreso no indica obligatoriedad',
    status: 'fail',
    priority: 'medium',
    notes: 'Carmen reporta: Dice "REGRESO (OPCIONAL)" pero si no indicas fecha no calcula itinerario. Propuesta: poner fecha por defecto o pop-up de error.'
  },

  // MEJORAS UX
  {
    id: 'ux-1',
    category: '🟡 MEJORAS UX',
    test: 'KM/día sin recuadro delimitador',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen reporta: Se resalta en rojo al posicionarse pero falta recuadro naranja como en "Añadir paradas" y "Vuelta a casa".'
  },
  {
    id: 'ux-2',
    category: '🟡 MEJORAS UX',
    test: 'Vista general no cabe - scroll horizontal',
    status: 'fail',
    priority: 'medium',
    notes: 'Carmen reporta: Para ver los días que dura hay que usar cursor de ancho. Reducir letra o ampliar frame. También diferenciar data general del viaje vs etapas.'
  },
  {
    id: 'ux-3',
    category: '🟡 MEJORAS UX',
    test: 'Viaje circular - falta flecha ida/vuelta en resumen',
    status: 'fail',
    priority: 'low',
    notes: 'Carmen reporta: En vista general cuando viaje es circular, poner flecha ida y vuelta (solo aparece ida). También es confuso poner Código Postal del destino.'
  },
  {
    id: 'ux-4',
    category: '🟡 MEJORAS UX',
    test: 'No hay botón (-) para restar días',
    status: 'fail',
    priority: 'medium',
    notes: 'Carmen reporta: Se pueden añadir días con (+) pero no reducir con (-). Al equivocarse tuvo que empezar de nuevo.'
  },
  {
    id: 'ux-5',
    category: '🟡 MEJORAS UX',
    test: 'Mapa no actualiza desvíos/KM al añadir gasolinera/restaurante',
    status: 'fail',
    priority: 'medium',
    notes: 'Carmen reporta: Al añadir restaurante o gasolinera, el mapa no actualiza salida de autovía más cercana ni KM reales del desvío. Muestra centro de localidad.'
  },
  {
    id: 'ux-6',
    category: '🟡 MEJORAS UX',
    test: 'Fecha de inicio en pasado sin validación',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen propone: Añadir pop-up si usuario pone fecha de inicio anterior a hoy. Útil para probar viajes pasados pero debe avisar.'
  },
  {
    id: 'ux-7',
    category: '🟡 MEJORAS UX',
    test: 'Cambio de días no actualiza frame superior (REGRESO)',
    status: 'fail',
    priority: 'medium',
    notes: 'Carmen reporta: Si se añaden días de estancia con (+) no se actualiza la vista inicial "REGRESO (OPCIONAL)" en frame superior.'
  },
  {
    id: 'ux-8',
    category: '🟡 MEJORAS UX',
    test: 'Botón "Vuelta a Casa" no encontrado',
    status: 'fail',
    priority: 'high',
    notes: 'Carmen reporta: En la vista general se menciona botón "Vuelta a casa" (rojo) pero no se encontró. Hay botón borrar para días añadidos con (+) pero no para vuelta a casa.'
  },

  // TESTS FUNCIONALES PASADOS
  {
    id: 'func-1',
    category: '✅ TESTS FUNCIONALES',
    test: 'Crear primer viaje (Salamanca → Mérida)',
    status: 'pass',
    priority: 'high',
    notes: 'Carmen: Intuición ✓, Velocidad ✓. Chrome e iPhone OK. Diseño: datos extraños en mapa tras calcular.'
  },
  {
    id: 'func-2',
    category: '✅ TESTS FUNCIONALES',
    test: 'Ajustar parámetros (fecha, consumo, precio)',
    status: 'fail',
    priority: 'high',
    notes: 'Carmen: Intuición ✓, Velocidad ✓. ERROR: Botón "ajustar parada" no intuitivo y produce error ZERO_RESULTS.'
  },
  {
    id: 'func-3',
    category: '✅ TESTS FUNCIONALES',
    test: 'Explorar mapa (zoom, arrastra)',
    status: 'pass',
    priority: 'medium',
    notes: 'Carmen: Intuición ✓, Velocidad ✓, Diseño ✓. Marcadores claros.'
  },
  {
    id: 'func-4',
    category: '✅ TESTS FUNCIONALES',
    test: 'Añadir parada intermedia',
    status: 'fail',
    priority: 'critical',
    notes: 'Carmen: ERROR - Bejar como parada intermedia no se tiene en cuenta en itinerario. Con botón EDITAR post-cálculo funciona pero la deja como DIA1 completo.'
  },
  {
    id: 'func-5',
    category: '✅ TESTS FUNCIONALES',
    test: 'Buscar restaurante/hotel en día específico',
    status: 'pass',
    priority: 'high',
    notes: 'Carmen: Intuición ✓, Velocidad ✓, Diseño ✓. Funciona correctamente.'
  },
  {
    id: 'func-6',
    category: '✅ TESTS FUNCIONALES',
    test: 'Crear segundo viaje (Valencia → Málaga)',
    status: 'fail',
    priority: 'high',
    notes: 'Carmen: ERROR - No hay botón "Nuevo viaje". Hay que salir de usuario y recargar página.'
  },

  // DISEÑO
  {
    id: 'design-1',
    category: '🎨 DISEÑO',
    test: 'Logo y nombre profesional',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen opina: Logo y nombre "poco profesional". Propuesta para versión futura.'
  },
  {
    id: 'design-2',
    category: '🎨 DISEÑO',
    test: 'Datos extraños en mapa tras calcular',
    status: 'pending',
    priority: 'medium',
    notes: 'Carmen reporta: Se ven datos en el mapa que no se entienden/no tienen que estar. Ver captura (pendiente).'
  },
  {
    id: 'design-3',
    category: '🎨 DISEÑO',
    test: 'Código Postal innecesario',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen reporta: Confuso poner código postal del destino (ej: 06800 Mérida). No aporta.'
  },

  // PROPUESTAS FUTURAS
  {
    id: 'future-1',
    category: '💡 PROPUESTAS FUTURAS',
    test: 'Hora de anochecer + llegada 1h antes',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen propone: Informar hora de anochecer y permitir calcular llegada a pernocta 1h antes, 30min antes, o justo al anochecer.'
  },
  {
    id: 'future-2',
    category: '💡 PROPUESTAS FUTURAS',
    test: 'Hora de inicio para estimar paradas comida/cena',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen propone: Incluir hora de inicio del viaje para que app estime paradas para comer/cenar.'
  },
  {
    id: 'future-3',
    category: '💡 PROPUESTAS FUTURAS',
    test: 'Control/gestión de gastos',
    status: 'pending',
    priority: 'medium',
    notes: 'Carmen propone: Incorporar control de gastos de Combustible, campings, etc. Gastos fijos como garaje y mantenimiento.'
  },
  {
    id: 'future-4',
    category: '💡 PROPUESTAS FUTURAS',
    test: 'Ciudad origen por defecto del usuario',
    status: 'pending',
    priority: 'low',
    notes: 'Carmen propone: Permitir establecer ciudad de origen predeterminada al registrarse.'
  },
  {
    id: 'future-5',
    category: '💡 PROPUESTAS FUTURAS',
    test: 'Confirmar contraseña al registrarse',
    status: 'pending',
    priority: 'medium',
    notes: 'Carmen propone: Pedir introducir contraseña dos veces al registrarse. Dar opción de cambiar contraseña.'
  },
];

function generateMarkdown(results: TestResult[]): string {
  const stats = {
    total: results.length,
    pass: results.filter(t => t.status === 'pass').length,
    fail: results.filter(t => t.status === 'fail').length,
    pending: results.filter(t => t.status === 'pending').length,
    critical: results.filter(t => t.priority === 'critical' && t.status === 'fail').length,
  };

  let md = `# 📋 Test Carmen - Feedback V0.7\n\n`;
  md += `**Fecha:** ${new Date().toLocaleDateString('es-ES')}\n`;
  md += `**Tester:** Carmen (CMSG)\n`;
  md += `**Versión testeada:** V0.7\n\n`;
  
  md += `## 📊 Estadísticas\n\n`;
  md += `- **Total Tests:** ${stats.total}\n`;
  md += `- ✅ **Pass:** ${stats.pass}\n`;
  md += `- ❌ **Fail:** ${stats.fail}\n`;
  md += `- ⏳ **Pending:** ${stats.pending}\n`;
  md += `- 🔴 **Critical Failures:** ${stats.critical}\n\n`;

  const categories = Array.from(new Set(results.map(t => t.category)));
  
  categories.forEach(category => {
    md += `## ${category}\n\n`;
    const categoryTests = results.filter(t => t.category === category);
    
    categoryTests.forEach(test => {
      const statusIcon = test.status === 'pass' ? '✅' :
                        test.status === 'fail' ? '❌' :
                        test.status === 'pending' ? '⏳' : 'N/A';
      
      md += `### ${statusIcon} ${test.test}\n\n`;
      md += `**Prioridad:** ${test.priority.toUpperCase()}\n`;
      md += `**Status:** ${test.status.toUpperCase()}\n\n`;
      md += `**Notas:**\n${test.notes}\n\n`;
      md += `---\n\n`;
    });
  });

  return md;
}
