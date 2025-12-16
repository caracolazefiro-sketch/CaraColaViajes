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
  const [openTripId, setOpenTripId] = useState<string | null>(null);

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
      if (r.request?.tripName && String(r.request.tripName).trim().length > 0) {
        acc[r.trip_id] = String(r.request.tripName).trim();
        return acc;
      }
      const origin = String(r.request.origin);
      const destination = String(r.request.destination);
      acc[r.trip_id] = `${origin} → ${destination}`;
    }

    return acc;
  }, {});

  const getTripName = (r: LogRow): string => {
    if (r.trip_id && tripNameById[r.trip_id]) return tripNameById[r.trip_id];
    if (r.api === 'google-directions' && r.request?.origin && r.request?.destination) {
      if (r.request?.tripName && String(r.request.tripName).trim().length > 0) {
        return String(r.request.tripName).trim();
      }
      return `${String(r.request.origin)} → ${String(r.request.destination)}`;
    }
    return r.trip_id || '-';
  };

  const normalizedFilter = filter.trim().toLowerCase();
  const logsWithTrip = logs.filter((r) => !!r.trip_id);

  const trips = (() => {
    const byTrip = logsWithTrip.reduce<Record<string, LogRow[]>>((acc, r) => {
      const id = String(r.trip_id);
      if (!acc[id]) acc[id] = [];
      acc[id].push(r);
      return acc;
    }, {});

    const tripList = Object.entries(byTrip).map(([tripId, tripLogs]) => {
      const sorted = [...tripLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const representative = sorted.find((x) => x.api === 'google-directions') || sorted[0];
      const name = getTripName(representative);
      const totals = sorted.reduce(
        (acc, r) => {
          acc.calls++;
          acc.cost += Number(r.cost || 0);
          acc.directions += r.api === 'google-directions' ? 1 : 0;
          acc.geocoding += r.api === 'google-geocoding' ? 1 : 0;
          return acc;
        },
        { calls: 0, cost: 0, directions: 0, geocoding: 0 }
      );
      return {
        tripId,
        tripName: name,
        latestAt: sorted[0]?.created_at,
        totals,
        logs: sorted,
      };
    });

    const filtered = normalizedFilter
      ? tripList.filter((t) => {
        const name = (t.tripName || '').toLowerCase();
        const id = (t.tripId || '').toLowerCase();
        return name.includes(normalizedFilter) || id.includes(normalizedFilter);
      })
      : tripList;

    return filtered.sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
  })();

  const totalsAllTrips = trips.reduce(
    (acc, t) => {
      acc.trips++;
      acc.calls += t.totals.calls;
      acc.cost += t.totals.cost;
      acc.directions += t.totals.directions;
      acc.geocoding += t.totals.geocoding;
      return acc;
    },
    { trips: 0, calls: 0, cost: 0, directions: 0, geocoding: 0 }
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <h1>📡 API Logs (Supabase)</h1>
      <p style={{ color: '#666' }}>Viajes: {totalsAllTrips.trips} | Total calls: {totalsAllTrips.calls} | Directions: {totalsAllTrips.directions} | Geocoding: {totalsAllTrips.geocoding} | Coste: €{totalsAllTrips.cost.toFixed(3)}</p>

      <div style={{ marginTop: '0.75rem' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar viaje por nombre o trip_id…"
          style={{ width: '100%', maxWidth: 520, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {trips.map((t) => {
          const isOpen = openTripId === t.tripId;
          return (
            <div
              key={t.tripId}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                background: 'white',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenTripId(isOpen ? null : t.tripId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  color: '#111827',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.tripName}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{t.tripId}</div>
                  <div style={{ fontSize: 12, color: '#111827', marginTop: 2 }}>
                    {t.latestAt ? new Date(t.latestAt).toLocaleString('es-ES') : '-'} · Calls: {t.totals.calls} · Coste: €{t.totals.cost.toFixed(3)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
                  {isOpen ? 'Ocultar' : 'Ver'}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid #eef2f7', padding: '12px' }}>
                  <div style={{ color: '#111827', marginBottom: 8 }}>
                    Directions: {t.totals.directions} · Geocoding: {t.totals.geocoding}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd', color: '#111827', fontWeight: 700 }}>Hora</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd', color: '#111827', fontWeight: 700 }}>API</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd', color: '#111827', fontWeight: 700 }}>Estado</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd', color: '#111827', fontWeight: 700 }}>Duración</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd', color: '#111827', fontWeight: 700 }}>Coste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.logs.map((r) => (
                        <tr key={r.id}>
                          <td style={{ padding: '6px', borderBottom: '1px solid #eee', color: '#111827' }}>{new Date(r.created_at).toLocaleString('es-ES')}</td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #eee', color: '#111827' }}>{r.api}</td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #eee', color: '#111827' }}>{r.status}</td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #eee', color: '#111827' }}>{r.duration_ms} ms</td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #eee', color: '#111827' }}>€{Number(r.cost || 0).toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <details style={{ marginTop: '1rem' }}>
                    <summary style={{ cursor: 'pointer' }}>Ver JSON de este viaje</summary>
                    <pre style={{ background: '#111827', color: '#e5e7eb', padding: '1rem', borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(t.logs, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
