'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  category: string;
  message: string;
  data?: any;
  raw: string;
}

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsoleLog = useRef<typeof console.log>(console.log);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Override console.log para capturar todos los logs
    originalConsoleLog.current = console.log;
    
    console.log = (...args: any[]) => {
      // Log original en la consola
      originalConsoleLog.current?.(...args);
      
      // Capturar el log
      const message = args.map((arg) => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Extraer categoría del mensaje (ej: "[TripMap]", "[actions.ts]")
      const categoryMatch = message.match(/^\[([^\]]+)\]/);
      const category = categoryMatch ? categoryMatch[1] : 'general';
      
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        category,
        message,
        data: args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined,
        raw: message
      };
      
      setLogs((prev) => [...prev, newLog]);
    };

    return () => {
      // Restaurar console.log original
      if (originalConsoleLog.current) {
        console.log = originalConsoleLog.current;
      }
    };
  }, []);

  // Auto-scroll cuando hay nuevos logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filtrar logs
  const filteredLogs = logs.filter((log) => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      log.category.toLowerCase().includes(searchLower) ||
      log.message.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar logs por categoría
  const logsByCategory = filteredLogs.reduce((acc, log) => {
    if (!acc[log.category]) acc[log.category] = [];
    acc[log.category].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  const categories = Object.keys(logsByCategory).sort();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copiado al portapapeles');
  };

  const copyAllLogs = () => {
    const allLogsText = filteredLogs
      .map((log, idx) => `[${log.category}] ${log.timestamp}\n${log.raw}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}\n`)
      .join('\n---\n\n');
    
    copyToClipboard(allLogsText);
  };

  // 📥 Función para descargar logs como archivo
  const downloadLogs = () => {
    const allLogsText = `
=== DEBUG LOGS - ${new Date().toLocaleString()} ===
=== Total logs: ${filteredLogs.length} ===

${filteredLogs
  .map((log, idx) => {
    return `[${log.timestamp}] [${log.category}]
${log.raw}
${log.data ? JSON.stringify(log.data, null, 2) : ''}
${'='.repeat(80)}`;
  })
  .join('\n\n')}
    `.trim();

    const blob = new Blob([allLogsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Logs descargados');
  };

  return (
    <div>
      {/* Botón flotante para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg font-bold text-white transition-all ${
          isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title="Toggle Debug Panel"
      >
        🐛 {logs.length}
      </button>

      {/* Panel de Debug - Fullscreen cuando está abierto */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col" ref={panelRef}>
          {/* Header */}
          <div className="bg-blue-700 px-4 py-3 flex justify-between items-center border-b-2 border-blue-500">
            <span className="font-bold text-white text-lg">🐛 Debug Console ({logs.length} logs)</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copyAllLogs}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-bold transition-colors"
                title="Copiar todos los logs al portapapeles"
              >
                📋 Copiar TODO
              </button>
              <button
                onClick={downloadLogs}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-bold transition-colors"
                title="Descargar logs como archivo .txt"
              >
                📥 Descargar Logs
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-bold transition-colors"
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm font-bold transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex gap-4 p-4">
            {/* Panel izquierdo: Lista de logs compacta */}
            <div className="w-1/3 flex flex-col border border-gray-700 rounded-lg bg-gray-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-700 bg-gray-700">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Category stats */}
              {categories.length > 0 && (
                <div className="px-2 py-2 border-b border-gray-700 bg-gray-750 flex gap-1 flex-wrap text-xs">
                  {categories.map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-gray-700 text-blue-300 rounded text-xs">
                      [{cat}] {logsByCategory[cat].length}
                    </span>
                  ))}
                </div>
              )}

              {/* Lista compacta de logs */}
              <div className="flex-1 overflow-y-auto text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="p-2 text-gray-400 italic">No logs</div>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedLog(idx)}
                      className={`px-2 py-1 cursor-pointer border-l-2 ${
                        selectedLog === idx
                          ? 'bg-blue-700 border-blue-400 text-white'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-bold text-blue-400">[{log.category}]</div>
                      <div className="text-gray-200 truncate">{log.raw.substring(0, 50)}...</div>
                      <div className="text-gray-500 text-xs">{log.timestamp}</div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Panel derecho: Detalle del log seleccionado */}
            <div className="flex-1 flex flex-col border border-gray-700 rounded-lg bg-gray-800 overflow-hidden">
              {selectedLog !== null && filteredLogs[selectedLog] ? (
                <>
                  <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-start">
                    <div>
                      <div className="text-blue-400 font-bold text-sm">[{filteredLogs[selectedLog].category}]</div>
                      <div className="text-gray-300 text-xs">{filteredLogs[selectedLog].timestamp}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(filteredLogs[selectedLog].raw)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-bold"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                    {/* Mensaje raw */}
                    <div className="text-gray-200 break-words mb-4 whitespace-pre-wrap">
                      {filteredLogs[selectedLog].raw}
                    </div>

                    {/* Datos JSON si existen */}
                    {filteredLogs[selectedLog].data && (
                      <div>
                        <div className="text-blue-400 font-bold mb-2">📊 JSON Data:</div>
                        <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-gray-200 overflow-auto max-h-96 text-xs">
                          {JSON.stringify(filteredLogs[selectedLog].data, null, 2)}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(filteredLogs[selectedLog].data, null, 2))}
                          className="mt-2 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-bold"
                        >
                          📋 Copy JSON
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Selecciona un log para ver los detalles
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-700 bg-gray-800 flex gap-2 justify-between items-center text-xs text-gray-400">
            <label className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              Auto-scroll
            </label>
            <span>{filteredLogs.length} / {logs.length} logs</span>
          </div>
        </div>
      )}
    </div>
  );
}
