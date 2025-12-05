'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
  data?: unknown;
}

export default function DebugTools() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const logsRef = useRef<LogEntry[]>([]);
  const originalConsoleRef = useRef<{
    log: any;
    error: any;
    warn: any;
    info: any;
  }>({
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  });

  useEffect(() => {
    // Interceptar console methods
    const addLog = (level: LogEntry['level'], ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg;
        return JSON.stringify(arg, null, 2);
      }).join(' ');

      const logEntry: LogEntry = {
        level,
        message,
        timestamp,
        data: args,
      };

      logsRef.current.push(logEntry);
      setLogs([...logsRef.current]);

      // También mostrar en consola original
      originalConsoleRef.current[level](...args);
    };

    console.log = (...args: any[]) => addLog('log', ...args);
    console.error = (...args: any[]) => addLog('error', ...args);
    console.warn = (...args: any[]) => addLog('warn', ...args);
    console.info = (...args: any[]) => addLog('info', ...args);

    // Cleanup
    return () => {
      console.log = originalConsoleRef.current.log;
      console.error = originalConsoleRef.current.error;
      console.warn = originalConsoleRef.current.warn;
      console.info = originalConsoleRef.current.info;
    };
  }, []);

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const takeScreenshot = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener contexto canvas');
      }

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Info del screenshot
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.fillText('Screenshot - ' + new Date().toISOString(), 20, 30);

      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      originalConsoleRef.current.error('Error capturando pantalla:', error);
      alert('Error capturando pantalla. Revisa la consola.');
    }
  };

  const downloadAllData = async () => {
    // Combinar logs + screenshot en un archivo ZIP-like (JSON)
    const debugData = {
      timestamp: new Date().toISOString(),
      logs: logs.map(log => ({
        time: log.timestamp,
        level: log.level,
        message: log.message,
      })),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logsRef.current = [];
    setLogs([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print">
      {/* Botones flotantes */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={downloadLogs}
          title="Descargar logs del F12"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg"
        >
          📋 Logs
        </button>
        <button
          onClick={takeScreenshot}
          title="Capturar pantalla"
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg"
        >
          📸 Screenshot
        </button>
        <button
          onClick={downloadAllData}
          title="Descargar todos los datos (logs + info)"
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg"
        >
          📦 Datos
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Abrir consola"
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg"
        >
          🖥️ Consola
        </button>
      </div>

      {/* Consola flotante */}
      {isOpen && (
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow-2xl border border-gray-700 w-96 max-h-96 flex flex-col">
          <div className="flex justify-between items-center bg-gray-800 p-2 border-b border-gray-700">
            <span className="text-xs font-bold">📊 Consola de Debug ({logs.length})</span>
            <div className="flex gap-1">
              <button
                onClick={clearLogs}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 text-xs font-mono space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">Sin logs...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                      ? 'text-yellow-400'
                      : log.level === 'info'
                      ? 'text-blue-400'
                      : 'text-green-400'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
