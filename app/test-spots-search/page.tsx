'use client';

import React, { useState } from 'react';

interface TestResult {
    testId: string;
    status: 'pending' | 'pass' | 'fail';
    notes: string;
    timestamp?: string;
}

export default function TestSpotsSearch() {
    const [results, setResults] = useState<TestResult[]>([
        {
            testId: 'test-1',
            status: 'pending',
            notes: '',
        },
        {
            testId: 'test-2',
            status: 'pending',
            notes: '',
        },
        {
            testId: 'test-3',
            status: 'pending',
            notes: '',
        },
        {
            testId: 'test-4',
            status: 'pending',
            notes: '',
        },
        {
            testId: 'test-5',
            status: 'pending',
            notes: '',
        },
    ]);

    const [submitted, setSubmitted] = useState(false);

    const updateResult = (testId: string, status: 'pending' | 'pass' | 'fail', notes: string) => {
        setResults(prev => prev.map(r => 
            r.testId === testId ? { ...r, status, notes, timestamp: new Date().toISOString() } : r
        ));
    };

    const handleSubmit = () => {
        const report = {
            date: new Date().toISOString(),
            commit: 'd3f5ede',
            tests: results,
            summary: {
                total: results.length,
                passed: results.filter(r => r.status === 'pass').length,
                failed: results.filter(r => r.status === 'fail').length,
                pending: results.filter(r => r.status === 'pending').length,
            }
        };

        // Guardar en localStorage para que el agente pueda leerlo
        localStorage.setItem('test_spots_search_results', JSON.stringify(report));
        
        console.log('📊 RESULTADOS DEL TEST:', report);
        setSubmitted(true);

        // Auto-limpiar después de 3 segundos
        setTimeout(() => setSubmitted(false), 3000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass': return 'bg-green-500';
            case 'fail': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'pass').length;
    const failedTests = results.filter(r => r.status === 'fail').length;
    const pendingTests = results.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 shadow-xl">
                <h1 className="text-4xl font-bold mb-3">🔍 TEST EXHAUSTIVO - Búsqueda de Spots Mejorada</h1>
                <p className="text-blue-100 text-lg">Validación de cambios: Camping → Spots + RV Parks + Tooltips</p>
                <div className="mt-4 flex gap-4 text-sm">
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Fecha:</span> 04/12/2025
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Rama:</span> testing
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Commit:</span> d3f5ede
                    </div>
                </div>
            </div>

            {/* Progress Dashboard */}
            <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="text-3xl font-bold text-blue-600">{totalTests}</div>
                        <div className="text-sm text-gray-600 font-medium">Tests Totales</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="text-3xl font-bold text-green-600">{passedTests}</div>
                        <div className="text-sm text-gray-600 font-medium">✅ Pasados</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="text-3xl font-bold text-red-600">{failedTests}</div>
                        <div className="text-sm text-gray-600 font-medium">❌ Fallidos</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
                        <div className="text-3xl font-bold text-gray-600">{pendingTests}</div>
                        <div className="text-sm text-gray-600 font-medium">⏳ Pendientes</div>
                    </div>
                </div>

                {/* Test Cases */}
                <div className="space-y-6">
                    {/* TEST 1: Nomenclatura */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className={`${getStatusColor(results[0].status)} p-4 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">1</div>
                                <h3 className="text-white font-bold text-lg">Test 1: Nomenclatura "Spots de Pernocta"</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-gray-700 mb-3">📋 Objetivo:</h4>
                            <p className="text-sm text-gray-700 mb-4">Verificar que "Camping" ha sido reemplazado por "Spots de Pernocta" en español y "Overnight Spots" en inglés.</p>
                            
                            <h4 className="font-bold text-gray-700 mb-3">🔍 Pasos:</h4>
                            <ol className="space-y-2 ml-6 mb-4 text-sm text-gray-700">
                                <li>1. Crear un viaje (Madrid → Barcelona)</li>
                                <li>2. Seleccionar Etapa 1</li>
                                <li>3. Verificar botón de toggle: debe decir "Spots" (no "Camping")</li>
                                <li>4. Activar toggle y verificar lista: debe decir "🏕️ Spots de Pernocta"</li>
                                <li>5. Cambiar idioma a inglés (si disponible) y verificar: "Overnight Spots"</li>
                            </ol>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                                <p className="text-sm font-bold text-yellow-800">✅ CRITERIO DE ÉXITO:</p>
                                <p className="text-sm text-yellow-700">No debe aparecer la palabra "Camping" en ninguna parte de la UI de servicios.</p>
                            </div>

                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                                rows={3}
                                placeholder="Notas / Observaciones..."
                                value={results[0].notes}
                                onChange={(e) => updateResult('test-1', results[0].status, e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button onClick={() => updateResult('test-1', 'pass', results[0].notes)} className={`flex-1 py-2 rounded font-bold ${results[0].status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>✅ PASS</button>
                                <button onClick={() => updateResult('test-1', 'fail', results[0].notes)} className={`flex-1 py-2 rounded font-bold ${results[0].status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>❌ FAIL</button>
                                <button onClick={() => updateResult('test-1', 'pending', results[0].notes)} className={`flex-1 py-2 rounded font-bold ${results[0].status === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>⏳ RESET</button>
                            </div>
                        </div>
                    </div>

                    {/* TEST 2: Búsqueda ampliada */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className={`${getStatusColor(results[1].status)} p-4 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">2</div>
                                <h3 className="text-white font-bold text-lg">Test 2: Búsqueda de Áreas de Autocaravanas (RV Parks)</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-gray-700 mb-3">📋 Objetivo:</h4>
                            <p className="text-sm text-gray-700 mb-4">Verificar que la búsqueda ahora incluye áreas de autocaravanas, RV parks y zonas de pernocta (no solo campings tradicionales).</p>
                            
                            <h4 className="font-bold text-gray-700 mb-3">🔍 Pasos:</h4>
                            <ol className="space-y-2 ml-6 mb-4 text-sm text-gray-700">
                                <li>1. Crear viaje en zona con áreas de autocaravanas (ej: Francia, Alemania, Norte de España)</li>
                                <li>2. Activar toggle "Spots"</li>
                                <li>3. Revisar resultados en la lista</li>
                                <li>4. Verificar consola del navegador (F12) → buscar log: "🔍 [camping] Búsqueda iniciada"</li>
                                <li>5. Confirmar que aparece: keyword: "camping OR área de autocaravanas OR RV park..."</li>
                                <li>6. Verificar que en los resultados aparecen áreas de autocaravanas (no solo campings)</li>
                            </ol>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                                <p className="text-sm font-bold text-yellow-800">✅ CRITERIO DE ÉXITO:</p>
                                <p className="text-sm text-yellow-700">En consola debe aparecer keyword con múltiples términos. Los resultados deben incluir áreas de autocaravanas/RV parks.</p>
                            </div>

                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                                rows={3}
                                placeholder="Notas / Observaciones (pega screenshot de consola o nombres de áreas encontradas)..."
                                value={results[1].notes}
                                onChange={(e) => updateResult('test-2', results[1].status, e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button onClick={() => updateResult('test-2', 'pass', results[1].notes)} className={`flex-1 py-2 rounded font-bold ${results[1].status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>✅ PASS</button>
                                <button onClick={() => updateResult('test-2', 'fail', results[1].notes)} className={`flex-1 py-2 rounded font-bold ${results[1].status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>❌ FAIL</button>
                                <button onClick={() => updateResult('test-2', 'pending', results[1].notes)} className={`flex-1 py-2 rounded font-bold ${results[1].status === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>⏳ RESET</button>
                            </div>
                        </div>
                    </div>

                    {/* TEST 3: Contador botón (brutos) */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className={`${getStatusColor(results[2].status)} p-4 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">3</div>
                                <h3 className="text-white font-bold text-lg">Test 3: Contador del Botón (Resultados Brutos)</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-gray-700 mb-3">📋 Objetivo:</h4>
                            <p className="text-sm text-gray-700 mb-4">Verificar que el botón "Spots" muestra el número TOTAL de resultados encontrados (antes de filtrar).</p>
                            
                            <h4 className="font-bold text-gray-700 mb-3">🔍 Pasos:</h4>
                            <ol className="space-y-2 ml-6 mb-4 text-sm text-gray-700">
                                <li>1. Crear viaje y activar toggle "Spots"</li>
                                <li>2. Observar el número en el badge del botón (ej: [Spots: 9])</li>
                                <li>3. Ajustar slider de rating a 4.0 o superior</li>
                                <li>4. Verificar que el número del BOTÓN NO cambia (sigue mostrando 9)</li>
                                <li>5. Verificar consola: buscar log "📊 [camping] Respuesta de Google" → resultadosBrutos</li>
                            </ol>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                                <p className="text-sm font-bold text-yellow-800">✅ CRITERIO DE ÉXITO:</p>
                                <p className="text-sm text-yellow-700">El contador del botón debe mostrar el total encontrado por Google, sin aplicar filtros.</p>
                            </div>

                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                                rows={3}
                                placeholder="Notas (ej: Botón mostraba 9, consola confirmaba 9 resultados brutos)..."
                                value={results[2].notes}
                                onChange={(e) => updateResult('test-3', results[2].status, e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button onClick={() => updateResult('test-3', 'pass', results[2].notes)} className={`flex-1 py-2 rounded font-bold ${results[2].status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>✅ PASS</button>
                                <button onClick={() => updateResult('test-3', 'fail', results[2].notes)} className={`flex-1 py-2 rounded font-bold ${results[2].status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>❌ FAIL</button>
                                <button onClick={() => updateResult('test-3', 'pending', results[2].notes)} className={`flex-1 py-2 rounded font-bold ${results[2].status === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>⏳ RESET</button>
                            </div>
                        </div>
                    </div>

                    {/* TEST 4: Contador lista (filtrados) */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className={`${getStatusColor(results[3].status)} p-4 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">4</div>
                                <h3 className="text-white font-bold text-lg">Test 4: Contador de Lista (Resultados Filtrados)</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-gray-700 mb-3">📋 Objetivo:</h4>
                            <p className="text-sm text-gray-700 mb-4">Verificar que el contador en la lista "🏕️ Spots de Pernocta (X)" muestra SOLO los resultados que pasan el filtro.</p>
                            
                            <h4 className="font-bold text-gray-700 mb-3">🔍 Pasos:</h4>
                            <ol className="space-y-2 ml-6 mb-4 text-sm text-gray-700">
                                <li>1. Activar toggle "Spots" → ver botón [Spots: 9]</li>
                                <li>2. Ver lista → contador debería mostrar (9) también</li>
                                <li>3. Ajustar slider de rating a 4.0</li>
                                <li>4. Ver lista → contador debe CAMBIAR a (2) por ejemplo</li>
                                <li>5. Verificar que la lista solo muestra 2 spots (los que tienen rating ≥4.0)</li>
                            </ol>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                                <p className="text-sm font-bold text-yellow-800">✅ CRITERIO DE ÉXITO:</p>
                                <p className="text-sm text-yellow-700">El contador de la lista debe actualizar dinámicamente según los filtros activos.</p>
                            </div>

                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                                rows={3}
                                placeholder="Notas (ej: Sin filtros: 9, Con rating 4.0: 2)..."
                                value={results[3].notes}
                                onChange={(e) => updateResult('test-4', results[3].status, e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button onClick={() => updateResult('test-4', 'pass', results[3].notes)} className={`flex-1 py-2 rounded font-bold ${results[3].status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>✅ PASS</button>
                                <button onClick={() => updateResult('test-4', 'fail', results[3].notes)} className={`flex-1 py-2 rounded font-bold ${results[3].status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>❌ FAIL</button>
                                <button onClick={() => updateResult('test-4', 'pending', results[3].notes)} className={`flex-1 py-2 rounded font-bold ${results[3].status === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>⏳ RESET</button>
                            </div>
                        </div>
                    </div>

                    {/* TEST 5: Tooltip explicativo */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className={`${getStatusColor(results[4].status)} p-4 flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">5</div>
                                <h3 className="text-white font-bold text-lg">Test 5: Tooltip Explicativo</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-gray-700 mb-3">📋 Objetivo:</h4>
                            <p className="text-sm text-gray-700 mb-4">Verificar que al pasar el cursor sobre el contador de la lista aparece un tooltip que explica la diferencia entre encontrados y mostrados.</p>
                            
                            <h4 className="font-bold text-gray-700 mb-3">🔍 Pasos:</h4>
                            <ol className="space-y-2 ml-6 mb-4 text-sm text-gray-700">
                                <li>1. Activar "Spots" con filtros aplicados (ej: rating 4.0)</li>
                                <li>2. Situación: Botón muestra 9, Lista muestra (2)</li>
                                <li>3. Pasar el cursor sobre el número (2) en la lista</li>
                                <li>4. Debe aparecer tooltip con formato: "🔍 Encontrados: 9 | 📊 Mostrados: 2 | ⚙️ Filtros: ⭐4.0 📍25km"</li>
                                <li>5. Verificar que el tooltip es legible y no se corta</li>
                            </ol>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                                <p className="text-sm font-bold text-yellow-800">✅ CRITERIO DE ÉXITO:</p>
                                <p className="text-sm text-yellow-700">Tooltip aparece al hover, muestra totales correctos y valores de filtros activos.</p>
                            </div>

                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                                rows={3}
                                placeholder="Notas (ej: Tooltip aparece correctamente con formato: Encontrados 9 | Mostrados 2 | Filtros...)..."
                                value={results[4].notes}
                                onChange={(e) => updateResult('test-5', results[4].status, e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button onClick={() => updateResult('test-5', 'pass', results[4].notes)} className={`flex-1 py-2 rounded font-bold ${results[4].status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>✅ PASS</button>
                                <button onClick={() => updateResult('test-5', 'fail', results[4].notes)} className={`flex-1 py-2 rounded font-bold ${results[4].status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>❌ FAIL</button>
                                <button onClick={() => updateResult('test-5', 'pending', results[4].notes)} className={`flex-1 py-2 rounded font-bold ${results[4].status === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>⏳ RESET</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-xl text-gray-800 mb-4">📤 Enviar Resultados</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Al hacer click en "Enviar a TESTING", los resultados se guardarán en localStorage y el agente podrá leerlos directamente.
                    </p>
                    <button
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                            submitted 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={submitted}
                    >
                        {submitted ? '✅ Resultados Enviados a TESTING' : '📤 Enviar Resultados a TESTING'}
                    </button>
                    {submitted && (
                        <p className="text-green-600 text-sm mt-2 text-center">
                            ✅ Los resultados han sido guardados. El agente puede leerlos ahora.
                        </p>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-8 bg-gray-800 text-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-xl mb-4">📊 Resumen de Testing</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-bold text-blue-400 mb-2">Cambios Implementados:</h4>
                            <ul className="space-y-1 text-gray-300">
                                <li>• Nomenclatura: "Camping" → "Spots de Pernocta"</li>
                                <li>• Búsqueda ampliada: + Áreas de Autocaravanas</li>
                                <li>• Contador botón: Resultados brutos (Google)</li>
                                <li>• Contador lista: Resultados filtrados</li>
                                <li>• Tooltip: Explicación transparente</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-400 mb-2">Archivos Modificados:</h4>
                            <ul className="space-y-1 text-gray-300">
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">useLanguage.ts</code> (textos UI)</li>
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">useTripPlaces.ts</code> (búsqueda API)</li>
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">DaySpotsList.tsx</code> (tooltips)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
