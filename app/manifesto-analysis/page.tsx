'use client';

export default function ManifestoAnalysisPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 space-y-8">
                
                {/* HEADER */}
                <div className="text-center border-b pb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        🐌 Alineación con el MANIFESTO
                    </h1>
                    <p className="text-gray-600">
                        Análisis: Sistema de Pernoctas y Escalas (V0.8)
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Actualizado: 4 Diciembre 2025
                    </p>
                </div>

                {/* CONTEXTO */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                        📋 Contexto del Cambio
                    </h2>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-gray-800 leading-relaxed">
                            <strong>Problema detectado:</strong> Carmen quería hacer Salamanca → Mérida (278km) 
                            pero pasando por <strong>Barco de Ávila</strong> sin dormir ahí. 
                        </p>
                        <p className="text-gray-800 leading-relaxed mt-2">
                            El sistema anterior solo permitía añadir "escalas" (pernoctas), lo que forzaba 
                            a crear días innecesarios para lugares de visita breve.
                        </p>
                    </div>
                </section>

                {/* SOLUCIÓN */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                        ✅ Solución Implementada
                    </h2>
                    <div className="space-y-3">
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h3 className="font-bold text-green-900 mb-2">🛏️ PERNOCTAS</h3>
                            <p className="text-sm text-gray-700">
                                Destinos donde <strong>duermes</strong>. Añaden días al viaje.
                                <br />
                                <span className="text-xs text-gray-500">
                                    Ej: Madrid → <strong>Mont Saint-Michel (pernocta)</strong> → París
                                </span>
                            </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <h3 className="font-bold text-blue-900 mb-2">🚩 ESCALAS</h3>
                            <p className="text-sm text-gray-700">
                                Lugares que <strong>visitas en ruta</strong> sin pernoctar. NO añaden días.
                                <br />
                                <span className="text-xs text-gray-500">
                                    Ej: Salamanca → <strong>Barco de Ávila (escala)</strong> → Mérida (mismo día)
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ALINEACIÓN CON MANIFESTO */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                        🎯 Alineación con el MANIFESTO
                    </h2>
                    
                    <div className="space-y-4">
                        {/* PRINCIPIO 1 */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="font-bold text-purple-900 mb-2">
                                1️⃣ ¿Ayuda a la LOGÍSTICA del viaje?
                            </h3>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅ SÍ:</span>
                                    <span>
                                        Permite planificar visitas culturales/turísticas SIN romper la lógica de etapas.
                                        El conductor sabe exactamente qué paradas tiene ese día y cuántos km totales.
                                    </span>
                                </p>
                                <p className="text-xs text-gray-600 italic pl-6">
                                    <strong>Ejemplo real:</strong> "Quiero ir a Mérida pero pasar por Barco de Ávila 
                                    a ver el castillo, sin que me obligue a dormir ahí."
                                </p>
                            </div>
                        </div>

                        {/* PRINCIPIO 2 */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="font-bold text-purple-900 mb-2">
                                2️⃣ ¿LIMPIA el ruido o añade basura?
                            </h3>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅ SÍ:</span>
                                    <span>
                                        Diferencia claramente dos conceptos que antes estaban mezclados:
                                        <ul className="list-disc pl-6 mt-1">
                                            <li><strong>Pernoctas:</strong> Impactan en la estructura del viaje (días)</li>
                                            <li><strong>Escalas:</strong> Detalles dentro de un día existente</li>
                                        </ul>
                                    </span>
                                </p>
                                <p className="text-xs text-gray-600 italic pl-6">
                                    <strong>Anti-pattern evitado:</strong> Antes, para visitar Barco de Ávila tendrías que 
                                    crear un día de pernocta artificial, rompiendo el ritmo de 300-400km/día.
                                </p>
                            </div>
                        </div>

                        {/* PRINCIPIO 3 */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="font-bold text-purple-900 mb-2">
                                3️⃣ ¿EMPODERA al usuario?
                            </h3>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✅ SÍ:</span>
                                    <span>
                                        El usuario tiene control total:
                                        <ul className="list-disc pl-6 mt-1">
                                            <li>Puede añadir/eliminar escalas POR DÍA (botón 🚩 morado)</li>
                                            <li>Las escalas se recalculan automáticamente en la ruta</li>
                                            <li>Visualización clara: escalas aparecen como sub-items del día</li>
                                            <li>No destruye el itinerario principal (pernoctas)</li>
                                        </ul>
                                    </span>
                                </p>
                                <p className="text-xs text-gray-600 italic pl-6">
                                    <strong>Decisión final humana:</strong> El sistema sugiere la ruta óptima pero 
                                    el usuario decide qué visitar y en qué orden.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* VENTAJA COMPETITIVA */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
                        🥊 Ventaja Competitiva
                    </h2>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="space-y-3 text-sm text-gray-700">
                            <p>
                                <strong className="text-orange-900">Google Maps:</strong> Te dice la ruta, 
                                pero no diferencia entre "parar a ver algo" y "dormir aquí". 
                                <span className="text-green-700 font-semibold"> → CaraCola SÍ lo hace.</span>
                            </p>
                            <p>
                                <strong className="text-orange-900">Park4Night:</strong> Lista lugares para pernoctar, 
                                pero no te ayuda a integrarlos en un itinerario con visitas turísticas.
                                <span className="text-green-700 font-semibold"> → CaraCola SÍ lo hace.</span>
                            </p>
                            <p>
                                <strong className="text-orange-900">Roadtrippers:</strong> Permite waypoints, pero 
                                todos tienen el mismo peso (no distingue pernoctas de escalas rápidas).
                                <span className="text-green-700 font-semibold"> → CaraCola SÍ lo hace.</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* IMPACTO UX */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                        🎨 Impacto en UX
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <h3 className="font-bold text-red-900 mb-2">❌ ANTES (V0.7)</h3>
                            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
                                <li>Solo "escalas" (confuso, ¿dormimos o no?)</li>
                                <li>Añadir visita = Añadir día (incorrecto)</li>
                                <li>Nomenclatura ambigua</li>
                                <li>Cálculo de km inexacto</li>
                            </ul>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h3 className="font-bold text-green-900 mb-2">✅ AHORA (V0.8)</h3>
                            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
                                <li>🛏️ Pernoctas vs 🚩 Escalas (claro)</li>
                                <li>Botón dedicado por día para escalas</li>
                                <li>Modal específico para gestión</li>
                                <li>Recálculo automático preciso</li>
                                <li>Visualización jerárquica (día → escalas → POIs)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* CASOS DE USO */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-teal-900 flex items-center gap-2">
                        💼 Casos de Uso Reales
                    </h2>
                    <div className="space-y-3">
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                            <h3 className="font-bold text-teal-900 mb-2">Caso 1: Ruta Cultural</h3>
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Viaje:</strong> Madrid → Barcelona (600km)
                            </p>
                            <p className="text-xs text-gray-600">
                                <strong>Pernocta:</strong> Zaragoza (300km)<br />
                                <strong>Escalas Día 1:</strong> Guadalajara (ver Palacio Infantado), Sigüenza (Catedral)<br />
                                <strong>Escalas Día 2:</strong> Lleida (Seu Vella), Montserrat
                            </p>
                        </div>
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                            <h3 className="font-bold text-teal-900 mb-2">Caso 2: Ruta Gastronómica</h3>
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Viaje:</strong> Bilbao → San Sebastián (100km)
                            </p>
                            <p className="text-xs text-gray-600">
                                <strong>Pernocta:</strong> San Sebastián<br />
                                <strong>Escalas:</strong> Getaria (Elkano Restaurante), Zarautz (playa), Orio (churros)
                            </p>
                        </div>
                    </div>
                </section>

                {/* CONCLUSIÓN */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        🏁 Conclusión
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-purple-300">
                        <p className="text-lg font-semibold text-gray-900 mb-3">
                            ✅ El sistema Pernoctas + Escalas está TOTALMENTE ALINEADO con el MANIFESTO
                        </p>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <strong>1. Asistente Logístico:</strong> Organiza visitas sin romper la lógica de etapas
                            </p>
                            <p>
                                <strong>2. Limpia Ruido:</strong> Separa conceptos que estaban mezclados
                            </p>
                            <p>
                                <strong>3. Empodera:</strong> Usuario controla qué visitar y cuándo
                            </p>
                            <p>
                                <strong>4. Ventaja Competitiva:</strong> Ningún competidor hace esta diferenciación clara
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-purple-200">
                            <p className="text-xs text-gray-600 italic">
                                <strong>Siguiente paso:</strong> Testear con usuarios reales (Carmen) y recoger feedback 
                                sobre la claridad de los términos "Pernocta" vs "Escala".
                            </p>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <div className="text-center text-xs text-gray-500 pt-6 border-t">
                    <p>Documento generado por AI Assistant</p>
                    <p>Commits relevantes: b550bb2, 982ef68, 17f22ce</p>
                    <p>Branch: testing | Status: ✅ Deployed to Vercel</p>
                </div>

            </div>
        </div>
    );
}
