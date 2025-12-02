'use client';

import { Search, Target, Crosshair, MapPin, Navigation, Compass, Eye } from 'lucide-react';

export default function SearchFoundPreview() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Iconos para Search y Found</h1>
            
            <div className="max-w-4xl mx-auto space-y-12">
                {/* SEARCH OPTIONS */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-blue-600">Para "search" (buscador)</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Search size={64} color="#3B82F6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Search</h3>
                            <p className="text-sm text-gray-600">Clásico, obvio</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Search size={32} color="white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Target size={64} color="#3B82F6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Target</h3>
                            <p className="text-sm text-gray-600">Objetivo específico</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Target size={32} color="white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Crosshair size={64} color="#3B82F6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Crosshair</h3>
                            <p className="text-sm text-gray-600">Precisión</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Crosshair size={32} color="white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOUND OPTIONS */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-teal-600">Para "found" (click en mapa)</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <MapPin size={64} color="#14B8A6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">MapPin</h3>
                            <p className="text-sm text-gray-600">Pin en mapa</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center">
                                    <MapPin size={32} color="white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Navigation size={64} color="#14B8A6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Navigation</h3>
                            <p className="text-sm text-gray-600">Exploración</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Navigation size={32} color="white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Compass size={64} color="#14B8A6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Compass</h3>
                            <p className="text-sm text-gray-600">Aventura</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Compass size={32} color="white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="flex justify-center mb-4">
                                <Eye size={64} color="#14B8A6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Eye</h3>
                            <p className="text-sm text-gray-600">Descubrimiento</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Eye size={32} color="white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RECOMENDACIONES */}
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-8 rounded-xl border-2 border-blue-200">
                    <h2 className="text-2xl font-bold mb-6 text-center">🎯 Mis Recomendaciones</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-lg text-center border-4 border-blue-500">
                            <div className="flex justify-center mb-4">
                                <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Search size={48} color="white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-2xl mb-2 text-blue-600">Search</h3>
                            <p className="text-gray-700 font-semibold">Para búsquedas</p>
                            <p className="text-sm text-gray-600 mt-2">Simple, directo, universal</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-lg text-center border-4 border-teal-500">
                            <div className="flex justify-center mb-4">
                                <div className="w-32 h-32 rounded-full bg-teal-500 flex items-center justify-center">
                                    <Compass size={48} color="white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-2xl mb-2 text-teal-600">Compass</h3>
                            <p className="text-gray-700 font-semibold">Para encontrados</p>
                            <p className="text-sm text-gray-600 mt-2">Exploración, aventura</p>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">Alternativa: MapPin también funciona muy bien (más literal)</p>
                    </div>
                </div>

                {/* COMPARACIÓN EN CONTEXTO */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center">En contexto (como se verían en el botón)</h2>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                            <Search size={20} />
                            <span>Buscados</span>
                            <span className="bg-blue-700 px-2 py-0.5 rounded-full text-xs">3</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 transition-colors">
                            <Compass size={20} />
                            <span>Encontrados</span>
                            <span className="bg-teal-700 px-2 py-0.5 rounded-full text-xs">5</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 transition-colors">
                            <MapPin size={20} />
                            <span>Encontrados</span>
                            <span className="bg-teal-700 px-2 py-0.5 rounded-full text-xs">5</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
