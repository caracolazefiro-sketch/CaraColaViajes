'use client';

import React, { useState } from 'react';

interface MotorRawDataProps {
  data: any;
}

export default function MotorRawData({ data }: MotorRawDataProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!data || !data.dailyItinerary || data.dailyItinerary.length === 0) {
    return (
      <div className="motor-raw-data">
        <h3>📊 Interpretación de Datos</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Calcula una ruta para ver los datos</p>
      </div>
    );
  }

  const { dailyItinerary, distanceKm, debugLog, error } = data;

  return (
    <div className="motor-raw-data">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>📊 Interpretación de Datos</h3>
        <button
          onClick={() => setShowRaw(!showRaw)}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {showRaw ? '📋 Ver Interpretado' : '🔍 Ver Raw JSON'}
        </button>
      </div>

      {showRaw ? (
        <div className="motor-raw-data-content">
          {JSON.stringify(data, null, 2)}
        </div>
      ) : (
        <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
          {/* Resumen General */}
          <div style={{ background: '#e7f3ff', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0056b3' }}>📍 Resumen General</h4>
            <div><strong>Distancia total:</strong> {distanceKm?.toFixed(0)} km</div>
            <div><strong>Días de viaje:</strong> {dailyItinerary.length}</div>
            <div><strong>Días conduciendo:</strong> {dailyItinerary.filter((d: any) => d.isDriving).length}</div>
            <div><strong>Días parado:</strong> {dailyItinerary.filter((d: any) => !d.isDriving).length}</div>
          </div>

          {/* Debug Logs del Servidor */}
          {debugLog && debugLog.length > 0 && (
            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🔧 Debug Logs del Servidor</h4>
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#000' }}>
                {debugLog.map((log: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Error si existe */}
          {error && (
            <div style={{ background: '#f8d7da', padding: '1rem', borderRadius: '4px', color: '#721c24', marginTop: '1rem' }}>
              <strong>❌ Error:</strong> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
