'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

export default function DebugTools() {
  const [enabled, setEnabled] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const logsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    // Oculto por defecto en builds de producción/staging.
    // Para habilitar puntualmente sin tocar código:
    // localStorage.setItem('caracola_debug_tools', '1'); location.reload();
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      setEnabled(true);
      return;
    }
    try {
      const flag = window.localStorage.getItem('caracola_debug_tools');
      setEnabled(flag === '1');
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Guardar referencias originales
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    type ConsoleMethod = (...args: unknown[]) => void;
    const consoleMethods = console as unknown as Record<'log' | 'error' | 'warn' | 'info', ConsoleMethod>;

    const isGoogleUtcOffsetDeprecation = (args: unknown[]) => {
      return args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('utc_offset is deprecated') || arg.includes('goo.gle/js-open-now'))
      );
    };

    const addLog = (level: LogEntry['level'], ...args: unknown[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args
        .map((arg) => {
          if (typeof arg === 'string') return arg;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(' ');

      const logEntry: LogEntry = { level, message, timestamp };
      logsRef.current.push(logEntry);
      setLogs([...logsRef.current]);

      // Siempre mostrar en consola original
      switch (level) {
        case 'log':
          originalLog(...args);
          break;
        case 'error':
          originalError(...args);
          break;
        case 'warn':
          originalWarn(...args);
          break;
        case 'info':
          originalInfo(...args);
          break;
      }
    };

    // Reemplazar console methods
    consoleMethods.log = (...args: unknown[]) => addLog('log', ...args);
    consoleMethods.error = (...args: unknown[]) => {
      // Google Places emits this as console.error; it's a deprecation warning, not an app error.
      if (isGoogleUtcOffsetDeprecation(args)) {
        addLog('warn', ...args);
        return;
      }
      addLog('error', ...args);
    };
    consoleMethods.warn = (...args: unknown[]) => addLog('warn', ...args);
    consoleMethods.info = (...args: unknown[]) => addLog('info', ...args);

    return () => {
      consoleMethods.log = originalLog;
      consoleMethods.error = originalError;
      consoleMethods.warn = originalWarn;
      consoleMethods.info = originalInfo;
    };
  }, [enabled]);

  const downloadLogs = () => {
    if (logs.length === 0) {
      alert('No hay logs para descargar');
      return;
    }
    
    const logsText = logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');

    const blob = new Blob([logsText], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const takeScreenshot = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText('Screenshot - ' + new Date().toISOString(), 20, 30);

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          alert('Error: no se pudo crear blob');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      alert('Error capturando pantalla: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const downloadAllData = () => {
    // Snapshot CSS variables from :root
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const cssVars: Record<string, string> = {};
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      if (prop.startsWith('--')) {
        cssVars[prop] = styles.getPropertyValue(prop).trim();
      }
    }

    const debugData = {
      timestamp: new Date().toISOString(),
      logs: logs.map(log => ({
        time: log.timestamp,
        level: log.level,
        message: log.message,
      })),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      cssVariables: cssVars,
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logsRef.current = [];
    setLogs([]);
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print">
      {/* Botones flotantes */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => {
            console.log('Descargando logs...');
            downloadLogs();
          }}
          title="Descargar logs del F12"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          📋 Logs
        </button>
        <button
          onClick={() => {
            console.log('Capturando pantalla...');
            takeScreenshot();
          }}
          title="Capturar pantalla"
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          📸 Screenshot
        </button>
        <button
          onClick={() => {
            console.log('Descargando datos...');
            downloadAllData();
          }}
          title="Descargar todos los datos (logs + info)"
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          📦 Datos
        </button>
        <button
          onClick={() => {
            const root = document.documentElement;
            const styles = getComputedStyle(root);
            const cssVars: Record<string, string> = {};
            for (let i = 0; i < styles.length; i++) {
              const prop = styles[i];
              if (prop.startsWith('--')) {
                cssVars[prop] = styles.getPropertyValue(prop).trim();
              }
            }
            console.info('CSS Vars Snapshot:', cssVars);
            alert(`CSS vars capturados: ${Object.keys(cssVars).length}`);
          }}
          title="Inspeccionar variables CSS activas"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          🎨 CSS Vars
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Abrir consola"
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          🖥️ Consola
        </button>
        {!(process.env.NEXT_PUBLIC_DEPLOY_ENV === 'production' || process.env.NODE_ENV === 'production') && (
          <a
            href="/logs-viewer-supabase"
            title="Ver logs de API (Supabase)"
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-xs font-bold transition-all shadow-lg cursor-pointer text-center"
          >
            📡 API Logs
          </a>
        )}
      </div>

      {/* Consola flotante */}
      {isOpen && (
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow-2xl border border-gray-700 w-96 max-h-96 flex flex-col">
          <div className="flex justify-between items-center bg-gray-800 p-2 border-b border-gray-700">
            <span className="text-xs font-bold">📊 Consola ({logs.length})</span>
            <div className="flex gap-1">
              <button
                onClick={clearLogs}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer"
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
