'use client';

import React, { useMemo, useState } from 'react';

interface TestItem {
    id: string;
    title: string;
    steps: string[];
    verification: string;
    status: 'pending' | 'pass' | 'fail';
    notes: string;
}

type TestState = {
    status: 'pending' | 'pass' | 'fail';
    notes: string;
};

export default function TestManualChecklist() {
    const todayEs = new Date().toLocaleDateString('es-ES');
    const [stressNarrow, setStressNarrow] = useState(false);
    const [stressLongText, setStressLongText] = useState(false);
    const [stressManyTests, setStressManyTests] = useState(false);
    const [stressCompact, setStressCompact] = useState(false);

    const [testStateById, setTestStateById] = useState<Record<string, TestState>>({});

    const baseTests = useMemo<TestItem[]>(() => [
        {
            id: 'test-1',
            title: 'Prueba 1: Datos reales en DaySpotsList',
            steps: [
                'Crear un viaje con al menos 2 etapas',
                'Buscar lugares (camping, gas, restaurant)',
                'Guardar 2-3 lugares',
                'Ajustar slider de rating a 4.0'
            ],
            verification: '✅ VERIFICAR: Los lugares guardados siguen visibles aunque tengan rating <4.0',
            status: 'pending',
            notes: ''
        },
        {
            id: 'test-2',
            title: 'Prueba 2: Saved places NO se filtran',
            steps: [
                'Guardar un lugar con rating 2.5',
                'Subir slider de rating a 4.5'
            ],
            verification: '✅ VERIFICAR: El lugar guardado (rating 2.5) sigue en la lista',
            status: 'pending',
            notes: ''
        },
        {
            id: 'test-3',
            title: 'Prueba 3: UI responsive en móvil',
            steps: [
                'Abrir DevTools → Toggle device toolbar',
                'Probar en iPhone SE (375px)',
                'Probar en iPad (768px)',
                'Probar en desktop (1920px)'
            ],
            verification: '✅ VERIFICAR: Los sliders no causan scroll horizontal + Tooltip es legible',
            status: 'pending',
            notes: ''
        },
        {
            id: 'test-4',
            title: 'Prueba 4: Toggle de servicios',
            steps: [
                'Activar toggle de "Camping"',
                'Guardar 1 camping',
                'Desactivar toggle de "Camping"'
            ],
            verification: '✅ VERIFICAR: El camping guardado sigue visible',
            status: 'pending',
            notes: ''
        },
        {
            id: 'test-5',
            title: 'Prueba 5: Google Places rating real',
            steps: [
                'Buscar "restaurante" en Madrid',
                'Verificar que los ratings mostrados coinciden con Google Maps',
                'Subir rating mínimo a 4.0'
            ],
            verification: '✅ VERIFICAR: Solo se muestran lugares con rating ≥4.0',
            status: 'pending',
            notes: ''
        },

        // --- ÁREASAC (P1) ---
        {
            id: 'areasac-1',
            title: 'ÁreasAC 1: Aparece y va primero (por distancia)',
            steps: [
                'Crear un viaje con etapa cerca de una zona con ÁreasAC (ej: Albacete/Lezuza)',
                'Activar categoría "Camping" (supercat=1) en esa etapa',
                'Observar el orden de la lista de Spots'
            ],
            verification: '✅ VERIFICAR: Los primeros resultados son ÁreasAC (place_id empieza por areasac:) y están ordenados por cercanía (aprox).',
            status: 'pending',
            notes: ''
        },
        {
            id: 'areasac-2',
            title: 'ÁreasAC 2: No desaparece con rating mínimo',
            steps: [
                'En la misma etapa, subir el slider de rating mínimo (p.ej. 4.0)',
                'Revisar que ÁreasAC sigue visible',
                'Comparar con resultados Google que sí se filtran por rating'
            ],
            verification: '✅ VERIFICAR: ÁreasAC sigue apareciendo aunque no tenga rating; Google sí se filtra.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'areasac-3',
            title: 'ÁreasAC 3: Tooltip/InfoWindow compacto + logo',
            steps: [
                'Abrir el mapa y hacer click en un marcador de ÁreasAC',
                'Observar el tooltip/InfoWindow',
                'Confirmar que no hay scrollbar y que los botones caben'
            ],
            verification: '✅ VERIFICAR: Si no hay foto, aparece el logo; el tooltip es compacto, sin scroll, y los botones se ven.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'areasac-4',
            title: 'ÁreasAC 4: Leyenda de códigos (chips con hover)',
            steps: [
                'En lista o tooltip, localizar los chips de códigos (PN, AL, AG, etc.)',
                'Pasar el ratón por encima de varios chips',
                'Repetir en móvil (sin hover: al menos se ve el código)'
            ],
            verification: '✅ VERIFICAR: En desktop, el hover muestra significado (title) tipo “PN — Pernocta posible”.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'areasac-5',
            title: 'ÁreasAC 5: Mapa centra y respeta ventana mínima (~30km)',
            steps: [
                'Con una etapa seleccionada, activar/desactivar la categoría "Camping"',
                'Observar cómo el mapa recentra y ajusta zoom',
                'Repetir en otra etapa'
            ],
            verification: '✅ VERIFICAR: Al activar la categoría, el mapa centra en el punto de búsqueda y mantiene una ventana mínima (no zoom excesivo).',
            status: 'pending',
            notes: ''
        },
        {
            id: 'areasac-6',
            title: 'ÁreasAC 6: Caché (sin llamadas sorpresa)',
            steps: [
                'Con el mismo centro/radio, activar Camping, esperar resultados y desactivar/activar otra vez',
                'Abrir /logs-viewer-supabase y filtrar por el viaje actual',
                'Comparar primer request (MISS) vs segundo (HIT)'
            ],
            verification: '✅ VERIFICAR: En el segundo request hay cache hit (o fallback) y coste $0 para Places.',
            status: 'pending',
            notes: ''
        },

        // --- AJUSTE DE ETAPAS (MANDATORY) + PREFIJO INMUTABLE ---
        {
            id: 'stage-1',
            title: 'Ajuste 1: Inserta parada mandatory y se ve en etapas',
            steps: [
                'Crear un viaje largo (>= 8 días) con kmMaximoDia bajo (ej: 250)',
                'Ir al día 2 y usar “Ajustar parada/etapa” para fijar una parada técnica (ej: Dax)',
                'Comprobar que el input “etapas” se actualiza y contiene esa parada (mandatory visible)',
                'Refrescar la página (F5)'
            ],
            verification: '✅ VERIFICAR: La parada añadida sigue en “etapas” tras F5 y el itinerario sigue pasando por ella.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'stage-2',
            title: 'Ajuste 2: Ajuste posterior NO borra el anterior (no se olvida Dax)',
            steps: [
                'Con el viaje anterior (con Dax ya insertado), ajustar otro día posterior (ej: día 6/7) a otra ciudad',
                'Volver a revisar el día 2 y el input “etapas”',
                'Abrir el mapa y comprobar que la ruta pasa por la parada del ajuste anterior'
            ],
            verification: '✅ VERIFICAR: El ajuste anterior sigue activo (itinerario y etapas), y no reaparece la parada al final ni desaparece.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'stage-3',
            title: 'Ajuste 3: Prefijo inmutable + savedPlaces preservados',
            steps: [
                'Guardar 3-5 lugares en un día ANTERIOR al ajuste (día 1 o 2)',
                'Hacer un ajuste en un día posterior (ej: día 6/7)',
                'Volver a los días anteriores y comprobar la lista de guardados',
                'Cambiar filtros/rating y toggles de categorías'
            ],
            verification: '✅ VERIFICAR: Los savedPlaces del prefijo siguen intactos y visibles; no se pierden tras ajustes posteriores.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'stage-4',
            title: 'Ajuste 4: Nunca aparece lat,lng como “from” en el día siguiente',
            steps: [
                'Hacer un ajuste de parada técnica que fuerce el “pin/merge” del día (puede superar kmMaximoDia)',
                'Mirar el día siguiente: el “from” debe ser el nombre de la ciudad ajustada',
                'Repetir 2 veces con ajustes distintos'
            ],
            verification: '✅ VERIFICAR: El día siguiente empieza por nombre (ej: “Dax”), no por “43.708608,-1.051945”.',
            status: 'pending',
            notes: ''
        },

        // --- PLACES CACHE (CUANTIZADO) ---
        {
            id: 'places-q-1',
            title: 'Places 1: Caché cuantizado (camping ~2km)',
            steps: [
                'En una etapa, activar Camping y esperar resultados',
                'Mover ligeramente el centro (cambiar de día y volver, o re-seleccionar la etapa) para provocar pequeñas variaciones de center',
                'Repetir el toggle Camping 2-3 veces',
                'Abrir /logs-viewer-supabase y comparar keys: deberían estabilizarse (menos MISS)'
            ],
            verification: '✅ VERIFICAR: La segunda vez hay HIT/FALLBACK con coste $0 y la key no cambia por micro-variaciones.',
            status: 'pending',
            notes: ''
        },
        {
            id: 'places-q-2',
            title: 'Places 2: Rest/Súper/Gas/Turismo ~1km (calidad razonable)',
            steps: [
                'Activar Restaurant/Supermarket/Gas/Tourism en una etapa urbana',
                'Repetir activación/desactivación y comparar resultados (no deben ser “de otra ciudad”)',
                'Validar en /logs-viewer-supabase que hay HIT/FALLBACK frecuente'
            ],
            verification: '✅ VERIFICAR: Más hit-rate sin degradación obvia de relevancia (siguen siendo del área).',
            status: 'pending',
            notes: ''
        }
    ], []);

    const longTextSeed =
        ' SUPER-LARGO_SIN_ESPACIOS_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_SUPER-LARGO_SIN_ESPACIOS_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const tests = useMemo<TestItem[]>(() => {
        const withStressText = stressLongText
            ? baseTests.map((t) => ({
                  ...t,
                  title: `${t.title}${longTextSeed}`,
                  steps: t.steps.map((s) => `${s} — ${longTextSeed}`),
                  verification: `${t.verification} ${longTextSeed}`,
              }))
            : baseTests;

        const withExtra = (() => {
            if (!stressManyTests) return withStressText;

            const extra = Array.from({ length: 40 }).map((_, i) => ({
                id: `stress-${i + 1}`,
                title: `Stress ${i + 1}: Scroll/overflow/perf`,
                steps: [
                    'Alternar categorías rápidamente (camping/gas/restaurant/tourism) 10 veces',
                    'Cambiar de día 1→fin→1 rápidamente',
                    'Guardar 15+ lugares en un día y comprobar que UI no se rompe',
                ],
                verification: '✅ VERIFICAR: No hay scroll horizontal inesperado, ni UI congelada, ni pérdidas de estado.',
                status: 'pending' as const,
                notes: '',
            }));

            return [...withStressText, ...extra];
        })();

        // Apply per-test state (status/notes) on top of the test definitions
        return withExtra.map((t) => {
            const st = testStateById[t.id];
            return {
                ...t,
                status: st?.status ?? t.status,
                notes: st?.notes ?? t.notes,
            };
        });
    }, [baseTests, stressLongText, stressManyTests, testStateById]);

    const updateTestStatus = (id: string, status: 'pending' | 'pass' | 'fail') => {
        setTestStateById((prev) => ({
            ...prev,
            [id]: { status, notes: prev[id]?.notes ?? '' },
        }));
    };

    const updateTestNotes = (id: string, notes: string) => {
        setTestStateById((prev) => ({
            ...prev,
            [id]: { status: prev[id]?.status ?? 'pending', notes },
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass': return 'bg-green-500';
            case 'fail': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pass': return '✅ PASS';
            case 'fail': return '❌ FAIL';
            default: return '⏳ PENDIENTE';
        }
    };

    const totalTests = tests.length;
    const passedTests = tests.filter(t => t.status === 'pass').length;
    const failedTests = tests.filter(t => t.status === 'fail').length;
    const pendingTests = tests.filter(t => t.status === 'pending').length;

    const pagePadding = stressCompact ? 'px-3 py-4' : 'px-8 py-6';
    const wrapWidth = stressNarrow ? 'max-w-sm' : 'max-w-7xl';
    const cardSpacing = stressCompact ? 'space-y-3' : 'space-y-6';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 shadow-xl">
                <h1 className="text-4xl font-bold mb-3">🧪 CHECKLIST DE TESTING MANUAL</h1>
                <p className="text-red-100 text-lg">Validación exhaustiva de sliders, filtros y saved places</p>
                <div className="mt-4 flex gap-4 text-sm">
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Fecha:</span> {todayEs}
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Rama:</span> testing
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="font-bold">Commit:</span> ver git log
                    </div>
                </div>
            </div>

            {/* Progress Dashboard */}
            <div className={`${wrapWidth} mx-auto ${pagePadding}`}>
                {/* Stress Controls */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-red-500">
                    <h3 className="font-bold text-gray-800 mb-3">⚠️ Stress de UX/UI (modo tortura)</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Activa estos modos para forzar condiciones duras: ancho tipo móvil, texto extremo y lista enorme.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={stressNarrow} onChange={(e) => setStressNarrow(e.target.checked)} />
                            Contenedor estrecho (≈ móvil)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={stressCompact} onChange={(e) => setStressCompact(e.target.checked)} />
                            Compacto (menos padding)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={stressLongText} onChange={(e) => setStressLongText(e.target.checked)} />
                            Texto ultra largo (overflow)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={stressManyTests} onChange={(e) => setStressManyTests(e.target.checked)} />
                            40 tests extra (scroll/perf)
                        </label>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <a className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-center" href="/" target="_blank" rel="noreferrer">
                            Abrir app principal
                        </a>
                        <a className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-center" href="/logs-viewer-supabase" target="_blank" rel="noreferrer">
                            Abrir logs Supabase
                        </a>
                        <a className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-center" href="/test-spots-search" target="_blank" rel="noreferrer">
                            Abrir test spots
                        </a>
                    </div>
                </div>

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

                {/* Progress Bar */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">Progreso General</h3>
                        <span className="text-sm font-medium text-gray-600">
                            {Math.round((passedTests / totalTests) * 100)}% Completado
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-4 transition-all duration-500 rounded-full"
                            style={{ width: `${(passedTests / totalTests) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Test Cases */}
                <div className={cardSpacing}>
                    {tests.map((test, index) => (
                        <div key={test.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                            {/* Test Header */}
                            <div className={`${getStatusColor(test.status)} p-4 flex justify-between items-center`}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-white font-bold text-lg">{test.title}</h3>
                                </div>
                                <div className="text-white font-bold text-sm">
                                    {getStatusText(test.status)}
                                </div>
                            </div>

                            {/* Test Content */}
                            <div className="p-6">
                                {/* Steps */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="text-blue-600">📋</span> Pasos a seguir:
                                    </h4>
                                    <ol className="space-y-2 ml-6">
                                        {test.steps.map((step, i) => (
                                            <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                                                <span className="font-bold text-blue-500 flex-shrink-0">{i + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Verification */}
                                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                    <p className="text-sm font-bold text-yellow-800">{test.verification}</p>
                                </div>

                                {/* Notes */}
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        📝 Notas / Observaciones:
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Escribe aquí cualquier observación, bug encontrado o detalle importante..."
                                        value={test.notes}
                                        onChange={(e) => updateTestNotes(test.id, e.target.value)}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => updateTestStatus(test.id, 'pass')}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                                            test.status === 'pass'
                                                ? 'bg-green-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        ✅ PASS
                                    </button>
                                    <button
                                        onClick={() => updateTestStatus(test.id, 'fail')}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                                            test.status === 'fail'
                                                ? 'bg-red-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                    >
                                        ❌ FAIL
                                    </button>
                                    <button
                                        onClick={() => updateTestStatus(test.id, 'pending')}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                                            test.status === 'pending'
                                                ? 'bg-gray-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        ⏳ RESET
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                    <h3 className="font-bold text-xl text-gray-800 mb-4">📊 Resumen de Testing</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-gray-700">Tests completados:</span>
                            <span className="font-bold text-blue-600">{passedTests + failedTests} / {totalTests}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="text-gray-700">Tasa de éxito:</span>
                            <span className="font-bold text-green-600">
                                {passedTests + failedTests > 0 
                                    ? Math.round((passedTests / (passedTests + failedTests)) * 100) 
                                    : 0}%
                            </span>
                        </div>
                        {failedTests > 0 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 font-bold mb-2">⚠️ Tests fallidos detectados</p>
                                <p className="text-red-600 text-xs">
                                    Revisa las notas de los tests marcados como FAIL y corrige los problemas antes de hacer merge a main.
                                </p>
                            </div>
                        )}
                        {passedTests === totalTests && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 font-bold mb-2">🎉 ¡Todos los tests pasados!</p>
                                <p className="text-green-600 text-xs">
                                    El sistema está listo para merge a main y deployment a producción.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Architecture Info */}
                <div className="mt-8 bg-gray-800 text-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                        🏗️ Arquitectura Validada
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-bold text-red-400 mb-2">Archivos Clave:</h4>
                            <ul className="space-y-1 text-gray-300">
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">TripMap.tsx</code> (línea 272)</li>
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">DaySpotsList.tsx</code> (línea 127-144)</li>
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">useSearchFilters.ts</code></li>
                                <li>• <code className="bg-gray-700 px-2 py-1 rounded text-xs">ServiceIcons.tsx</code></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-red-400 mb-2">Lógica Implementada:</h4>
                            <ul className="space-y-1 text-gray-300">
                                <li>• Filtros aplican SOLO a búsquedas</li>
                                <li>• Saved places siempre visibles</li>
                                <li>• Sliders rojos con degradado (#DC2626)</li>
                                <li>• 0 imports de lucide-react</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
