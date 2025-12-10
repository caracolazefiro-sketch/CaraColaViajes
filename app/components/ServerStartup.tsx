'use client';

import React, { useState, useEffect } from 'react';

interface ServerStartupProps {
  children: React.ReactNode;
}

export default function ServerStartup({ children }: ServerStartupProps) {
  const [isServerReady, setIsServerReady] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if server is responding
    const checkServer = async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        setIsServerReady(response.ok);
      } catch {
        setIsServerReady(false);
      }
    };

    checkServer();
  }, []);

  const handleStartServer = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch('/api/dev/server', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.running || data.status === 'starting') {
        // Wait a bit for server to fully start, then reload
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError('Failed to start server');
        setIsStarting(false);
      }
    } catch (err) {
      setError('Error starting server: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsStarting(false);
    }
  };

  if (!isServerReady && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CaraColaViajes</h1>
            <p className="text-gray-500 mt-2">Planificador de Viajes</p>
          </div>

          {/* Status Message */}
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm font-medium">
                El servidor no está en ejecución
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Haz clic en el botón de abajo para iniciarlo
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartServer}
            disabled={isStarting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isStarting
                ? 'bg-yellow-500 text-white cursor-wait opacity-75'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            {isStarting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando servidor...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Arrancar Servidor</span>
              </>
            )}
          </button>

          {/* Info Text */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Si ya está ejecutándose, haz clic en el botón para refrescar la página
          </p>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              <span className="font-semibold">Tip:</span> Ejecuta <code className="bg-gray-100 px-2 py-1 rounded text-xs">npm run dev</code> en la terminal para iniciar manualmente
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
