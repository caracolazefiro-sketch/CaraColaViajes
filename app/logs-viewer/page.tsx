'use client';

import { useEffect, useState } from 'react';

interface TripLog {
  tripId: string;
  startTime: string;
  endTime?: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  kmMaximo: number;
  totalDistance?: number;
  daysCount?: number;
  summary?: {
    directionsAPICalls: number;
    geocodingAPICalls: number;
    geocodingCached: number;
    totalDuration: number;
  };
  apiCalls: unknown[];
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.message);
        } else {
          setLogs(data.trips);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>⏳ Cargando logs...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>❌ Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p style={{ marginTop: '1rem', color: '#666' }}>
          Los logs solo están disponibles en desarrollo local. En producción de Vercel,
          el filesystem es read-only.
        </p>
      </div>
    );
  }

  const totalDirections = logs.reduce((sum, log) => sum + (log.summary?.directionsAPICalls || 0), 0);
  const totalGeocoding = logs.reduce((sum, log) => sum + (log.summary?.geocodingAPICalls || 0), 0);
  const totalCached = logs.reduce((sum, log) => sum + (log.summary?.geocodingCached || 0), 0);
  const totalGeocodingAll = totalGeocoding + totalCached;
  const cacheRate = totalGeocodingAll > 0 ? ((totalCached / totalGeocodingAll) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>📊 API Logs - Motor Bueno</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Total viajes registrados: {logs.length}
      </p>

      {/* Resumen general */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #0ea5e9'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#0369a1' }}>Directions API</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0c4a6e' }}>{totalDirections}</div>
          <div style={{ fontSize: '0.8rem', color: '#075985' }}>llamadas</div>
        </div>

        <div style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#d97706' }}>Geocoding API</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>{totalGeocoding}</div>
          <div style={{ fontSize: '0.8rem', color: '#b45309' }}>llamadas reales</div>
        </div>

        <div style={{
          background: '#dcfce7',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #22c55e'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#16a34a' }}>Geocoding Cached</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#14532d' }}>{totalCached}</div>
          <div style={{ fontSize: '0.8rem', color: '#15803d' }}>hits de caché</div>
        </div>

        <div style={{
          background: '#fae8ff',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #c026d3'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#a21caf' }}>Cache Hit Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#701a75' }}>{cacheRate}%</div>
          <div style={{ fontSize: '0.8rem', color: '#86198f' }}>eficiencia</div>
        </div>
      </div>

      {/* Lista de viajes */}
      <h2 style={{ marginBottom: '1rem' }}>Viajes Registrados</h2>
      {logs.map((log, idx) => (
        <details key={log.tripId} style={{
          marginBottom: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          background: 'white'
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {idx + 1}. {log.origin} → {log.destination}
            {log.waypoints && log.waypoints.length > 0 && (
              <span style={{ color: '#6366f1', marginLeft: '0.5rem' }}>
                (vía {log.waypoints.join(', ')})
              </span>
            )}
            <span style={{ color: '#999', marginLeft: '1rem', fontSize: '0.9rem' }}>
              {new Date(log.startTime).toLocaleString('es-ES')}
            </span>
          </summary>

          <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #e5e7eb', marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <strong>Trip ID:</strong>
              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.tripId}</span>

              <strong>Distancia:</strong>
              <span>{log.totalDistance?.toFixed(1)} km</span>

              <strong>Días:</strong>
              <span>{log.daysCount}</span>

              <strong>Km/día max:</strong>
              <span>{log.kmMaximo} km</span>

              <strong>Duración:</strong>
              <span>{log.summary?.totalDuration ? `${(log.summary.totalDuration / 1000).toFixed(1)}s` : 'N/A'}</span>
            </div>

            {log.summary && (
              <div style={{
                background: '#f9fafb',
                padding: '0.75rem',
                borderRadius: '6px',
                marginTop: '1rem'
              }}>
                <strong>API Calls:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Directions: {log.summary.directionsAPICalls}</li>
                  <li>Geocoding (real): {log.summary.geocodingAPICalls}</li>
                  <li>Geocoding (cached): {log.summary.geocodingCached}</li>
                </ul>
              </div>
            )}

            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#6366f1' }}>
                Ver todas las llamadas API ({log.apiCalls.length})
              </summary>
              <pre style={{
                background: '#1e293b',
                color: '#e2e8f0',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                overflow: 'auto',
                marginTop: '0.5rem'
              }}>
                {JSON.stringify(log.apiCalls, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}
