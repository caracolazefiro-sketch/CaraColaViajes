'use client';

import { useEffect, useState } from 'react';

type LogRow = {
  id: string;
  created_at: string;
  env: string;
  trip_id?: string;
  api: string;
  method?: string;
  url?: string;
  status?: string;
  duration_ms?: number;
  cost?: number;
  cached?: boolean;
  request?: any;
  response?: any;
};

export default function LogsViewerSupabase() {
  const isProdHost = typeof window !== 'undefined' && window.location.hostname === (process.env.NEXT_PUBLIC_PROD_HOST || 'cara-cola-viajes.vercel.app');
  if (isProdHost) {
    return <div style={{ padding: '2rem' }}>❌ Página no disponible en producción.</div>;
  }
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/logs-supabase?limit=200')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error); else setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>⏳ Cargando logs de Supabase…</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>❌ {error}</div>;

  const tripNameById = logs.reduce<Record<string, string>>((acc, r) => {
    if (!r.trip_id) return acc;
    if (acc[r.trip_id]) return acc;

    if (r.api === 'google-directions' && r.request?.origin && r.request?.destination) {
      const origin = String(r.request.origin);
      const destination = String(r.request.destination);
      acc[r.trip_id] = `${origin} → ${destination}`;
    }

    return acc;
  }, {});

  const getTripName = (r: LogRow): string => {
    if (r.trip_id && tripNameById[r.trip_id]) return tripNameById[r.trip_id];
    if (r.api === 'google-directions' && r.request?.origin && r.request?.destination) {
      return `${String(r.request.origin)} → ${String(r.request.destination)}`;
    }
    return r.trip_id || '-';
  };

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredLogs = normalizedFilter
    ? logs.filter(r => {
      const tripName = getTripName(r).toLowerCase();
      const tripId = (r.trip_id || '').toLowerCase();
      const api = (r.api || '').toLowerCase();
      return tripName.includes(normalizedFilter) || tripId.includes(normalizedFilter) || api.includes(normalizedFilter);
    })
    : logs;

  const totals = filteredLogs.reduce((acc, r) => {
    acc.calls++;
    acc.cost += Number(r.cost || 0);
    acc.directions += r.api === 'google-directions' ? 1 : 0;
    acc.geocoding += r.api === 'google-geocoding' ? 1 : 0;
    return acc;
  }, { calls: 0, cost: 0, directions: 0, geocoding: 0 });

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>📡 API Logs (Supabase)</h1>
      <p style={{ color: '#666' }}>Total: {totals.calls} | Directions: {totals.directions} | Geocoding: {totals.geocoding} | Coste: €{totals.cost.toFixed(3)}</p>

      <div style={{ marginTop: '0.75rem' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por viaje (nombre o trip_id) o API…"
          style={{ width: '100%', maxWidth: 520, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Hora</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>API</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Estado</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Coste</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Trip</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>{new Date(r.created_at).toLocaleString('es-ES')}</td>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>{r.api}</td>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>{r.status}</td>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>{r.duration_ms} ms</td>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>€{Number(r.cost || 0).toFixed(3)}</td>
              <td style={{ padding: '6px', borderBottom: '1px solid #eee' }}>
                <div>{getTripName(r)}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.trip_id || '-'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer' }}>Ver JSON completo</summary>
        <pre style={{ background: '#111827', color: '#e5e7eb', padding: '1rem', borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(filteredLogs, null, 2)}</pre>
      </details>
    </div>
  );
}
