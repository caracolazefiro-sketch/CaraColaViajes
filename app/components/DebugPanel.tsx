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
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsoleLog = useRef<typeof console.log>();

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

  return (
    <div>
      {/* Botón flotante para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg font-bold text-white transition-all ${
          isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title="Toggle Debug Panel (F12 alternativa)"
      >
        🐛 Debug {logs.length}
      </button>

      {/* Panel de Debug */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-96 bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl flex flex-col text-white text-xs overflow-hidden">
          {/* Header */}
          <div className="bg-blue-700 px-3 py-2 flex justify-between items-center border-b border-blue-500">
            <span className="font-bold">🐛 Debug Console ({logs.length})</span>
            <button
              onClick={() => setLogs([])}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              Clear
            </button>
          </div>

          {/* Filter */}
          <div className="px-3 py-2 border-b border-gray-700 bg-gray-800">
            <input
              type="text"
              placeholder="Filtrar por categoría o texto..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Category tabs / Stats */}
          {categories.length > 0 && (
            <div className="px-3 py-1 border-b border-gray-700 bg-gray-800 flex gap-1 flex-wrap text-xs">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 bg-gray-700 text-blue-300 rounded text-xs"
                >
                  [{cat}]: {logsByCategory[cat].length}
                </span>
              ))}
            </div>
          )}

          {/* Logs */}
          <div className="flex-1 overflow-y-auto font-mono space-y-2 p-2">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-400 italic">No logs encontrados</div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-2 text-gray-300">
                  <div className="text-blue-400 font-bold text-xs">
                    [{log.category}] {log.timestamp}
                  </div>
                  
                  {/* Mensaje raw */}
                  <div className="text-gray-200 text-xs break-words">{log.raw}</div>
                  
                  {/* Datos formateados si existen */}
                  {log.data && (
                    <details className="text-gray-400 text-xs mt-1 cursor-pointer">
                      <summary className="hover:text-gray-300">📊 Ver datos</summary>
                      <pre className="bg-gray-800 p-1 rounded mt-1 text-xs max-h-32 overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Footer - Auto-scroll toggle */}
          <div className="px-3 py-2 border-t border-gray-700 bg-gray-800 flex gap-2 justify-between items-center">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs">Auto-scroll</span>
            </label>
            <span className="text-gray-400 text-xs">
              {filteredLogs.length} / {logs.length} logs
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
