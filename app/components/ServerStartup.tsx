'use client';

import React, { useState, useEffect } from 'react';

interface ServerStartupProps {
  children: React.ReactNode;
}

export default function ServerStartup({ children }: ServerStartupProps) {
  const [isServerReady, setIsServerReady] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if server is responding
    const checkServer = async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        setIsServerReady(response.ok);
        setShowButton(!response.ok);
      } catch {
        setIsServerReady(false);
        setShowButton(true);
      }
    };

    checkServer();

    // Check every 10 seconds if server comes online
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
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

  return (
    <>
      {/* Floating Server Button */}
      {showButton && typeof window !== 'undefined' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleStartServer}
            disabled={isStarting}
            title={isStarting ? 'Iniciando servidor...' : isServerReady ? 'Servidor activo' : 'Arrancar servidor'}
            className={`
              rounded-full shadow-lg transition-all duration-200 flex items-center justify-center
              hover:shadow-xl hover:scale-110 active:scale-95
              ${
                isStarting
                  ? 'bg-yellow-500 text-white w-14 h-14 cursor-wait'
                  : isServerReady
                    ? 'bg-green-500 text-white w-12 h-12 cursor-default opacity-60'
                    : 'bg-red-500 hover:bg-red-600 text-white w-14 h-14 cursor-pointer'
              }
            `}
          >
            {isStarting ? (
              <svg className="animate-spin w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isServerReady ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>

          {/* Error Toast */}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs shadow-lg">
              <p className="text-red-800 text-sm font-medium">Error</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
            </div>
          )}
        </div>
      )}

      {children}
    </>
  );
}
