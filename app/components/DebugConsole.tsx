'use client';

import { TripResult } from '../types';

interface DebugConsoleProps {
    isOpen: boolean;
    formData: any;
    results: TripResult;
    onClose: () => void;
}

export default function DebugConsole({ isOpen, formData, results, onClose }: DebugConsoleProps) {
    if (!isOpen) return null;

    const copyToClipboard = () => {
        const debugInfo = generateDebugReport();
        navigator.clipboard.writeText(debugInfo);
        alert('📋 Debug info copiado al portapapeles!');
    };

    const generateDebugReport = () => {
        const now = new Date();
        const buildTime = new Date().toISOString().split('T')[0];
        const report = `
═══════════════════════════════════════════════
🐛 CARACOLA DEBUG REPORT
═══════════════════════════════════════════════
⏰ Timestamp: ${now.toISOString()}
🌐 URL: ${window.location.href}
🚀 Branch: testing
📦 Build Date: ${buildTime}
🔢 Version: 0.8.1
📱 User Agent: ${navigator.userAgent}
🖥️ Platform: ${navigator.platform}
🌍 Language: ${navigator.language}
📏 Screen: ${window.screen.width}x${window.screen.height}
🪟 Viewport: ${window.innerWidth}x${window.innerHeight}

═══════════════════════════════════════════════
📋 FORM DATA
═══════════════════════════════════════════════
Nombre Viaje: ${formData.tripName || '(sin nombre)'}
Fecha Inicio: ${formData.fechaInicio}
Fecha Regreso: ${formData.fechaRegreso || '(no especificada)'}
Origen: ${formData.origen}
Destino: ${formData.destino}
Pernoctas (etapas): ${formData.etapas || '(ninguna)'}
KM Máximo/Día: ${formData.kmMaximoDia}
Consumo: ${formData.consumo} L/100km
Precio Gasoil: ${formData.precioGasoil} €/L
Evitar Peajes: ${formData.evitarPeajes ? 'SÍ' : 'NO'}
Vuelta a Casa: ${formData.vueltaACasa ? 'SÍ' : 'NO'}

═══════════════════════════════════════════════
📊 RESULTS
═══════════════════════════════════════════════
Total Days: ${results.totalDays ?? 'N/A'}
Total Distance: ${results.distanceKm ?? 'N/A'} km
Total Cost: ${results.totalCost ?? 'N/A'} €
Liters: ${results.liters ?? 'N/A'} L
Error: ${results.error || 'none'}

═══════════════════════════════════════════════
🗺️ DAILY ITINERARY (${results.dailyItinerary?.length || 0} days)
═══════════════════════════════════════════════
${results.dailyItinerary?.map((day, idx) => `
DAY ${day.day} - ${day.date} (${day.isoDate})
  Type: ${day.type}
  From: ${day.from}
  To: ${day.to}
  Distance: ${day.distance} km
  Is Driving: ${day.isDriving ? 'YES' : 'NO'}
  Coordinates: ${day.coordinates ? `${day.coordinates.lat}, ${day.coordinates.lng}` : 'N/A'}
  Start Coords: ${day.startCoordinates ? `${day.startCoordinates.lat}, ${day.startCoordinates.lng}` : 'N/A'}
  Stopovers: ${day.stopovers?.length ? day.stopovers.join(', ') : 'none'}
  Saved Places: ${day.savedPlaces?.length || 0} places
`).join('\n') || '(no itinerary)'}

═══════════════════════════════════════════════
🔧 SYSTEM INFO
═══════════════════════════════════════════════
Online: ${navigator.onLine ? 'YES' : 'NO'}
Connection: ${(navigator as any).connection?.effectiveType || 'unknown'}
Memory: ${(performance as any).memory?.usedJSHeapSize ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)} MB` : 'N/A'}
Cookies Enabled: ${navigator.cookieEnabled ? 'YES' : 'NO'}
Local Storage Available: ${typeof(Storage) !== 'undefined' ? 'YES' : 'NO'}

═══════════════════════════════════════════════
📦 CONSOLE LOGS (últimas entradas relevantes)
═══════════════════════════════════════════════
Ver consola del navegador (F12) para logs completos

═══════════════════════════════════════════════
End of Debug Report
═══════════════════════════════════════════════
        `.trim();
        return report;
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-500">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🐛</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">Debug Console</h2>
                            <p className="text-purple-200 text-xs">CaraCola Technical Report</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white hover:bg-purple-500 rounded-lg p-2 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                    <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {generateDebugReport()}
                    </pre>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-900 border-t border-slate-700 p-4 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                        💡 Copia este reporte y pégalo en el chat o issue de GitHub
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            📋 Copiar Todo
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
