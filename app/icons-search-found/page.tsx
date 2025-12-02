'use client';

import { Search, Target, Crosshair, MapPin, Navigation, Compass, Eye } from 'lucide-react';

export default function IconsSearchFoundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Iconos: Search vs Found</h1>
                <p className="text-gray-600 text-center mb-12">Opciones para diferenciar búsquedas intencionadas de descubrimientos</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SEARCH OPTIONS */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-6 pb-2 border-b-2 border-blue-500">
                            SEARCH (Buscador)
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Search className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Search</h3>
                                        <p className="text-sm text-gray-500">#3B82F6 (Azul)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Clásico, universal. "Lo busqué específicamente"</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Target className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Target</h3>
                                        <p className="text-sm text-gray-500">#3B82F6 (Azul)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Objetivo claro, precisión</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Crosshair className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Crosshair</h3>
                                        <p className="text-sm text-gray-500">#3B82F6 (Azul)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Puntería, acción dirigida</p>
                            </div>
                        </div>
                    </div>

                    {/* FOUND OPTIONS */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-6 pb-2 border-b-2 border-teal-500">
                            FOUND (Click en mapa)
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                                        <MapPin className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">MapPin</h3>
                                        <p className="text-sm text-gray-500">#14B8A6 (Turquesa)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Literal, directo. "Lo encontré en el mapa"</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Navigation className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Navigation</h3>
                                        <p className="text-sm text-gray-500">#10B981 (Verde)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Orientación, exploración activa</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                                        <Compass className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Compass</h3>
                                        <p className="text-sm text-gray-500">#14B8A6 (Turquesa)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Aventura, descubrimiento espontáneo</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Eye className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Eye</h3>
                                        <p className="text-sm text-gray-500">#10B981 (Verde)</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Vista, observación. "Lo vi navegando"</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">✅ Recomendación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-500">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Search className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-blue-900">Search → SEARCH</p>
                                <p className="text-sm text-blue-700">Universal, claro, tecnológico</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg border-2 border-teal-500">
                            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Compass className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-teal-900">Found → COMPASS</p>
                                <p className="text-sm text-teal-700">Aventura, exploración personal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
