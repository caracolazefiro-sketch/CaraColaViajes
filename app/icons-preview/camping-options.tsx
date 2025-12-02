'use client';

// 5 OPCIONES DE ICONOS LUCIDE PARA "CAMPING/PERNOCTA"

export const CampingOptions = {
    bed: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4v16"/>
            <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
            <path d="M2 17h20"/>
            <path d="M6 8v9"/>
        </svg>
    ),
    moon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
    ),
    tent: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 21 14 3l10.5 18H3.5Z"/>
            <path d="M14 3v18"/>
        </svg>
    ),
    home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    ),
    bedDouble: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
            <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
            <path d="M12 4v6"/>
            <path d="M2 18h20"/>
        </svg>
    ),
};

export default function CampingOptionsPage() {
    const options = [
        { key: 'bed', name: 'BED (Cama)', desc: 'Directo y universal. Cualquier lugar para dormir.' },
        { key: 'moon', name: 'MOON (Luna)', desc: 'Pernocta nocturna. Poético y claro.' },
        { key: 'tent', name: 'TENT (Tienda)', desc: 'Camping tradicional. Más outdoor.' },
        { key: 'home', name: 'HOME (Casa)', desc: 'Lugar de descanso. General pero amigable.' },
        { key: 'bedDouble', name: 'BED DOUBLE (Cama doble)', desc: 'Más específico. Pernocta en pareja/familia.' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🚐 ¿Qué icono para CAMPING/PERNOCTA?</h1>
                    <p className="text-sm text-gray-600 mb-4">Lucide tiene estas opciones. ¿Cuál expresa mejor "lugares para dormir"?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {options.map(option => {
                        const Icon = CampingOptions[option.key as keyof typeof CampingOptions];
                        return (
                            <div key={option.key} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-red-400">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                        <Icon />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">{option.name}</h3>
                                        <p className="text-sm text-gray-600 mb-3">{option.desc}</p>
                                        
                                        {/* Preview en botón */}
                                        <div className="flex gap-3 items-center">
                                            <button className="px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-300 flex items-center gap-1.5 shadow-sm">
                                                <span className="text-red-600"><Icon /></span>
                                                Camping
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">12</span>
                                            </button>
                                            
                                            {/* Preview en marcador */}
                                            <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-red-600">
                                                <Icon />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-2">💡 Recomendación del agente:</h4>
                    <p className="text-sm text-blue-800"><strong>BED (Cama)</strong> es la más directa y universal. Funciona para campings, áreas de autocaravanas, parkings pernocta, etc.</p>
                    <p className="text-sm text-blue-800 mt-1"><strong>MOON (Luna)</strong> es más poética y evoca la noche, ideal si quieres diferenciarte.</p>
                    <p className="text-sm text-blue-800 mt-1"><strong>TENT (Tienda)</strong> puede confundirse con camping tradicional (sin autocaravana).</p>
                </div>
            </div>
        </div>
    );
}
