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
  request?: unknown;
  response?: unknown;
};

const PLACES_NEARBY_PRO_USD_PER_REQUEST = 0.032;

const formatUsd = (value: unknown) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '$0.000';
  return `$${n.toFixed(3)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
};

export default function LogsViewerSupabase() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [openTripId, setOpenTripId] = useState<string | null>(null);
  const [compareTripA, setCompareTripA] = useState<string>('');
  const [compareTripB, setCompareTripB] = useState<string>('');

  const isProdHost =
    typeof window !== 'undefined' &&
    window.location.hostname ===
      (process.env.NEXT_PUBLIC_PROD_HOST || 'cara-cola-viajes.vercel.app');

  useEffect(() => {
    if (isProdHost) return;
    fetch('/api/logs-supabase?limit=200')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error); else setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [isProdHost]);

  if (isProdHost) {
    return <div style={{ padding: '2rem' }}>❌ Página no disponible en producción.</div>;
  }

  if (loading) return <div style={{ padding: '2rem' }}>⏳ Cargando logs de Supabase…</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>❌ {error}</div>;

  const tripNameById = logs.reduce<Record<string, string>>((acc, r) => {
    if (!r.trip_id) return acc;
    if (acc[r.trip_id]) return acc;

    const request = isRecord(r.request) ? r.request : {};

    if (r.api === 'google-directions' && request.origin && request.destination) {
      if (request.tripName && String(request.tripName).trim().length > 0) {
        acc[r.trip_id] = String(request.tripName).trim();
        return acc;
      }
      const origin = String(request.origin);
      const destination = String(request.destination);
      acc[r.trip_id] = `${origin} → ${destination}`;
    }

    return acc;
  }, {});

  const getTripName = (r: LogRow): string => {
    if (r.trip_id && tripNameById[r.trip_id]) return tripNameById[r.trip_id];
    const request = isRecord(r.request) ? r.request : {};
    if (r.api === 'google-directions' && request.origin && request.destination) {
      if (request.tripName && String(request.tripName).trim().length > 0) {
        return String(request.tripName).trim();
      }
      return `${String(request.origin)} → ${String(request.destination)}`;
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
          const cost = Number(r.cost || 0);
          acc.cost += cost;
          if (r.api === 'google-directions') {
            acc.directions += 1;
            acc.costDirections += cost;
          }
          if (r.api === 'google-geocoding') {
            acc.geocoding += 1;
            acc.costGeocoding += cost;
          }
          if (r.api === 'google-places') {
            acc.places += 1;
            acc.costPlaces += cost;
          }
          return acc;
        },
        { calls: 0, cost: 0, directions: 0, geocoding: 0, places: 0, costDirections: 0, costGeocoding: 0, costPlaces: 0 }
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
      acc.places += t.totals.places;
      return acc;
    },
    { trips: 0, calls: 0, cost: 0, directions: 0, geocoding: 0, places: 0 }
  );

  const tripA = compareTripA ? trips.find((t) => t.tripId === compareTripA) : undefined;
  const tripB = compareTripB ? trips.find((t) => t.tripId === compareTripB) : undefined;

  const compareDelta = (() => {
    if (!tripA || !tripB) return null;
    return {
      calls: tripB.totals.calls - tripA.totals.calls,
      cost: tripB.totals.cost - tripA.totals.cost,
      directions: tripB.totals.directions - tripA.totals.directions,
      geocoding: tripB.totals.geocoding - tripA.totals.geocoding,
      places: tripB.totals.places - tripA.totals.places,
      costDirections: tripB.totals.costDirections - tripA.totals.costDirections,
      costGeocoding: tripB.totals.costGeocoding - tripA.totals.costGeocoding,
      costPlaces: tripB.totals.costPlaces - tripA.totals.costPlaces,
    };
  })();

  const formatDeltaInt = (n: number) => `${n >= 0 ? '+' : ''}${String(n)}`;
  const formatDeltaUsd = (n: number) => `${n >= 0 ? '+' : ''}${formatUsd(n)}`;

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <h1>📡 API Logs (Supabase)</h1>
      <p style={{ color: '#666' }}>
        Viajes: {totalsAllTrips.trips} | Total calls: {totalsAllTrips.calls} | Directions: {totalsAllTrips.directions} | Geocoding: {totalsAllTrips.geocoding} | Places: {totalsAllTrips.places} | Coste (USD): {formatUsd(totalsAllTrips.cost)}
      </p>
      <p style={{ color: '#666', marginTop: 6 }}>
        Pricing usado: Google Places Nearby Search (Pro) ≈ {formatUsd(PLACES_NEARBY_PRO_USD_PER_REQUEST)} / request.
      </p>

      <div style={{ marginTop: '0.75rem' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar viaje por nombre o trip_id…"
          style={{ width: '100%', maxWidth: 520, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginTop: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 10, background: 'white', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontWeight: 700, color: '#111827' }}>Comparar 2 viajes</div>
          <button
            onClick={() => {
              setCompareTripA('');
              setCompareTripB('');
            }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}
          >
            Limpiar
          </button>
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 900 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Viaje A</div>
            <select
              value={compareTripA}
              onChange={(e) => setCompareTripA(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, background: 'white' }}
            >
              <option value="">— Selecciona —</option>
              {trips.map((t) => (
                <option key={`a-${t.tripId}`} value={t.tripId}>
                  {t.tripName} ({t.tripId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Viaje B</div>
            <select
              value={compareTripB}
              onChange={(e) => setCompareTripB(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, background: 'white' }}
            >
              <option value="">— Selecciona —</option>
              {trips.map((t) => (
                <option key={`b-${t.tripId}`} value={t.tripId}>
                  {t.tripName} ({t.tripId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {tripA && tripB && compareDelta && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Delta: B − A (positivo = B cuesta / llama más)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setOpenTripId(tripA.tripId)}
                  style={{ border: '1px solid #e5e7eb', background: '#ffffff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#111827' }}
                >
                  Abrir A
                </button>
                <button
                  onClick={() => setOpenTripId(tripB.tripId)}
                  style={{ border: '1px solid #e5e7eb', background: '#ffffff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#111827' }}
                >
                  Abrir B
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10, border: '1px solid #eef2f7', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.9fr', gap: 0, background: '#f9fafb', color: '#111827', fontSize: 12, fontWeight: 700 }}>
                <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7' }}>Métrica</div>
                <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7' }}>Viaje A</div>
                <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7' }}>Viaje B</div>
                <div style={{ padding: '10px 10px' }}>Δ (B−A)</div>
              </div>

              {([
                {
                  label: 'Calls',
                  a: String(tripA.totals.calls),
                  b: String(tripB.totals.calls),
                  d: formatDeltaInt(compareDelta.calls),
                },
                {
                  label: 'Coste total (USD)',
                  a: formatUsd(tripA.totals.cost),
                  b: formatUsd(tripB.totals.cost),
                  d: formatDeltaUsd(compareDelta.cost),
                },
                {
                  label: 'Directions (calls / coste)',
                  a: `${tripA.totals.directions} / ${formatUsd(tripA.totals.costDirections)}`,
                  b: `${tripB.totals.directions} / ${formatUsd(tripB.totals.costDirections)}`,
                  d: `${formatDeltaInt(compareDelta.directions)} / ${formatDeltaUsd(compareDelta.costDirections)}`,
                },
                {
                  label: 'Geocoding (calls / coste)',
                  a: `${tripA.totals.geocoding} / ${formatUsd(tripA.totals.costGeocoding)}`,
                  b: `${tripB.totals.geocoding} / ${formatUsd(tripB.totals.costGeocoding)}`,
                  d: `${formatDeltaInt(compareDelta.geocoding)} / ${formatDeltaUsd(compareDelta.costGeocoding)}`,
                },
                {
                  label: 'Places (calls / coste)',
                  a: `${tripA.totals.places} / ${formatUsd(tripA.totals.costPlaces)}`,
                  b: `${tripB.totals.places} / ${formatUsd(tripB.totals.costPlaces)}`,
                  d: `${formatDeltaInt(compareDelta.places)} / ${formatDeltaUsd(compareDelta.costPlaces)}`,
                },
              ] as const).map((row) => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.9fr', gap: 0, borderTop: '1px solid #eef2f7', fontSize: 13, color: '#111827' }}>
                  <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7' }}>{row.a}</div>
                  <div style={{ padding: '10px 10px', borderRight: '1px solid #eef2f7' }}>{row.b}</div>
                  <div style={{ padding: '10px 10px', fontFamily: 'monospace' }}>{row.d}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111827' }}>A</div>
                <div style={{ fontFamily: 'monospace' }}>{tripA.tripId}</div>
                <div style={{ color: '#111827' }}>{tripA.tripName}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#111827' }}>B</div>
                <div style={{ fontFamily: 'monospace' }}>{tripB.tripId}</div>
                <div style={{ color: '#111827' }}>{tripB.tripName}</div>
              </div>
            </div>
          </div>
        )}
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
                    {t.latestAt ? new Date(t.latestAt).toLocaleString('es-ES') : '-'} · Calls: {t.totals.calls} · Coste (USD): {formatUsd(t.totals.cost)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
                  {isOpen ? 'Ocultar' : 'Ver'}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid #eef2f7', padding: '12px' }}>
                  <div style={{ marginTop: 14, fontWeight: 700, color: '#111827' }}>Detalles por llamada</div>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {t.logs.map((r) => {
                      const createdAt = new Date(r.created_at);
                      const title = `${createdAt.toLocaleString('es-ES')} · ${r.api} · ${formatUsd(r.cost)}`;

                      const response = isRecord(r.response) ? r.response : {};
                      const request = isRecord(r.request) ? r.request : {};

                      const isDirections = r.api === 'google-directions';
                      const isGeocoding = r.api === 'google-geocoding';
                      const isPlaces = r.api === 'google-places';

                      const cacheInfo = (() => {
                        const status = String(r.status || response.status || '').toUpperCase();
                        const reqCache = isRecord(request.cache) ? request.cache : {};
                        const resCache = isRecord(response.cache) ? response.cache : {};
                        const cacheProvider = String(resCache.provider ?? reqCache.provider ?? '').toLowerCase();
                        const cacheKey = String(resCache.key ?? reqCache.key ?? '');

                        if (status === 'CACHE_HIT_SUPABASE') {
                          return {
                            label: 'HIT',
                            detail: `supabase${cacheKey ? ` (${cacheKey})` : ''}`,
                            cost: '$0.000',
                          };
                        }
                        if (status === 'CACHE_HIT') {
                          return { label: 'HIT', detail: 'cache local (no Supabase aún)', cost: '$0.000' };
                        }
                        if (r.cached === true) {
                          if (cacheProvider === 'supabase') {
                            return {
                              label: 'HIT',
                              detail: `supabase${cacheKey ? ` (${cacheKey})` : ''}`,
                              cost: '$0.000',
                            };
                          }
                          return { label: 'HIT', detail: 'cache (flag cached=true)', cost: '$0.000' };
                        }

                        // If request indicates a cache attempt but miss / unavailable
                        if (cacheProvider === 'supabase') {
                          const cacheOk = reqCache.ok;
                          const reasonRaw = reqCache.reason != null ? String(reqCache.reason) : '';
                          const reason = reasonRaw.length > 90 ? `${reasonRaw.slice(0, 90)}…` : reasonRaw;
                          if (cacheOk === false) {
                            return {
                              label: 'MISS',
                              detail: `supabase unavailable${reason ? ` (${reason})` : ''}${cacheKey ? ` (${cacheKey})` : ''}`,
                              cost: formatUsd(r.cost),
                            };
                          }
                          return {
                            label: 'MISS',
                            detail: `supabase miss${cacheKey ? ` (${cacheKey})` : ''}`,
                            cost: formatUsd(r.cost),
                          };
                        }
                        return { label: 'MISS', detail: 'llamada real a API', cost: formatUsd(r.cost) };
                      })();

                      const apiResponseSummary = (() => {
                        if (isGeocoding) {
                          const cityName = response.cityName ? String(response.cityName) : null;
                          const resolvedFrom = response.resolvedFrom ? String(response.resolvedFrom) : null;
                          const resultsCount = response.resultsCount != null ? String(response.resultsCount) : null;
                          const parts: string[] = [];
                          if (cityName) parts.push(`Lugar=${cityName}`);
                          if (resolvedFrom) parts.push(`Fuente=${resolvedFrom}`);
                          if (resultsCount != null) parts.push(`Resultados=${resultsCount}`);
                          return parts.length ? parts.join(' · ') : `Status=${String(r.status || response.status || '-')}`;
                        }
                        if (isDirections) {
                          const parts: string[] = [];
                          if (response.distanceKm != null) parts.push(`Distancia=${response.distanceKm} km`);
                          if (response.durationMin != null) parts.push(`Duración=${response.durationMin} min`);
                          if (response.legsCount != null) parts.push(`Tramos=${response.legsCount}`);
                          if (response.waypointsCount != null) parts.push(`Waypoints=${response.waypointsCount}`);
                          if (response.error_message) parts.push(`Error=${String(response.error_message)}`);
                          return parts.length ? parts.join(' · ') : `Status=${String(r.status || response.status || '-')}`;
                        }
                        if (isPlaces) {
                          const supercat = response?.supercat ?? request?.supercat;
                          const resultsCount = response?.resultsCount;
                          const parts: string[] = [];
                          if (supercat != null) {
                            const label = String(supercat) === '1'
                              ? '1(Spots)'
                              : String(supercat) === '2'
                                ? '2(Comer+Super)'
                                : String(supercat) === '3'
                                  ? '3(Gas+Lavar)'
                                  : String(supercat) === '4'
                                    ? '4(Turismo)'
                                    : String(supercat);
                            parts.push(`Supercat=${label}`);
                          }
                          if (resultsCount != null) parts.push(`Resultados=${String(resultsCount)}`);
                          return parts.length ? parts.join(' · ') : `Status=${String(r.status || response.status || '-')}`;
                        }
                        return `Status=${String(r.status || response.status || '-')}`;
                      })();

                      const supabaseWriteSummary = (() => {
                        const reqCache = isRecord(request.cache) ? request.cache : {};
                        const resWrite = isRecord(response.cacheWrite) ? response.cacheWrite : {};

                        if (r.status === 'CACHE_HIT_SUPABASE') {
                          const expiresAt = isRecord(response.cache) && response.cache.expiresAt != null ? String(response.cache.expiresAt) : '';
                          const keyFromReq = String(reqCache.key ?? '');

                          if (isGeocoding) {
                            const lat = request.lat != null ? String(request.lat) : '';
                            const lng = request.lng != null ? String(request.lng) : '';
                            const cityName = response.cityName ? String(response.cityName) : '';
                            const resolvedFrom = response.resolvedFrom ? String(response.resolvedFrom) : '';
                            return `Supabase cache: HIT api_cache_geocoding${keyFromReq ? ` (${keyFromReq})` : ''}${lat && lng ? ` lat=${lat} lng=${lng}` : ''}${cityName ? ` city=${cityName}` : ''}${resolvedFrom ? ` from=${resolvedFrom}` : ''}${expiresAt ? ` expiresAt=${expiresAt}` : ''}`;
                          }

                          if (isPlaces) {
                            const supercat = response?.supercat ?? request?.supercat;
                            const center = request.center && isRecord(request.center) ? request.center : null;
                            const radius = request.radius != null ? String(request.radius) : '';
                            const lat = center && center.lat != null ? String(center.lat) : '';
                            const lng = center && center.lng != null ? String(center.lng) : '';
                            return `Supabase cache: HIT api_cache_places_supercat${keyFromReq ? ` (${keyFromReq})` : ''}${supercat != null ? ` supercat=${String(supercat)}` : ''}${lat && lng ? ` center=${lat},${lng}` : ''}${radius ? ` radius=${radius}` : ''}${expiresAt ? ` expiresAt=${expiresAt}` : ''}`;
                          }

                          if (isDirections) {
                            const origin = request.origin != null ? String(request.origin) : '';
                            const destination = request.destination != null ? String(request.destination) : '';
                            const waypoints = Array.isArray(request.waypoints) ? request.waypoints.length : null;
                            const distanceKm = response.distanceKm != null ? String(response.distanceKm) : '';
                            const durationMin = response.durationMin != null ? String(response.durationMin) : '';
                            return `Supabase cache: HIT api_cache_directions${keyFromReq ? ` (${keyFromReq})` : ''}${origin && destination ? ` ${origin}→${destination}` : ''}${waypoints != null ? ` wp=${String(waypoints)}` : ''}${distanceKm ? ` km=${distanceKm}` : ''}${durationMin ? ` min=${durationMin}` : ''}${expiresAt ? ` expiresAt=${expiresAt}` : ''}`;
                          }
                        }

                        const table = String(resWrite.table ?? reqCache.table ?? '');
                        const key = String(resWrite.key ?? reqCache.key ?? '');
                        const action = String(resWrite.action ?? (r.status === 'SUPABASE_CACHE_UPSERT' ? 'upsert' : ''));

                        if (action === 'upsert' && table) {
                          const ok = resWrite.ok;
                          const ttlDays = resWrite.ttlDays != null ? String(resWrite.ttlDays) : (isRecord(response) && response.ttlDays != null ? String(response.ttlDays) : '');
                          const reasonRaw = resWrite.reason != null ? String(resWrite.reason) : '';
                          const reason = reasonRaw.length > 90 ? `${reasonRaw.slice(0, 90)}…` : reasonRaw;
                          if (ok === false) {
                            return `Supabase cache: upsert FAILED ${table}${key ? ` (${key})` : ''}${reason ? ` · ${reason}` : ''}`;
                          }
                          if (ok === true) {
                            if (isGeocoding) {
                              const lat = request.lat != null ? String(request.lat) : '';
                              const lng = request.lng != null ? String(request.lng) : '';
                              const cityName = response.cityName ? String(response.cityName) : '';
                              const resolvedFrom = response.resolvedFrom ? String(response.resolvedFrom) : '';
                              return `Supabase cache: upsert ${table}${key ? ` (${key})` : ''}${ttlDays ? ` ttlDays=${ttlDays}` : ''}${lat && lng ? ` lat=${lat} lng=${lng}` : ''}${cityName ? ` city=${cityName}` : ''}${resolvedFrom ? ` from=${resolvedFrom}` : ''}`;
                            }
                            if (isPlaces) {
                              const supercat = response?.supercat ?? request?.supercat;
                              const resultsCount = response?.resultsCount;
                              return `Supabase cache: upsert ${table}${key ? ` (${key})` : ''}${ttlDays ? ` ttlDays=${ttlDays}` : ''}${supercat != null ? ` supercat=${String(supercat)}` : ''}${resultsCount != null ? ` results=${String(resultsCount)}` : ''}`;
                            }
                            if (isDirections) {
                              const distanceKm = response.distanceKm != null ? String(response.distanceKm) : '';
                              const durationMin = response.durationMin != null ? String(response.durationMin) : '';
                              const legsCount = response.legsCount != null ? String(response.legsCount) : '';
                              const waypointsCount = response.waypointsCount != null ? String(response.waypointsCount) : '';
                              return `Supabase cache: upsert ${table}${key ? ` (${key})` : ''}${ttlDays ? ` ttlDays=${ttlDays}` : ''}${distanceKm ? ` km=${distanceKm}` : ''}${durationMin ? ` min=${durationMin}` : ''}${legsCount ? ` legs=${legsCount}` : ''}${waypointsCount ? ` wp=${waypointsCount}` : ''}`;
                            }
                            return `Supabase cache: upsert ${table}${key ? ` (${key})` : ''}${ttlDays ? ` ttlDays=${ttlDays}` : ''}`;
                          }
                        }

                        if (r.status === 'SUPABASE_CACHE_UPSERT' && table && key) {
                          const ttlDays = isRecord(response) && response.ttlDays != null ? String(response.ttlDays) : '';
                          return `Supabase cache: upsert ${table}${key ? ` (${key})` : ''}${ttlDays ? ` ttlDays=${ttlDays}` : ''}`;
                        }

                        if (action && table) {
                          return `Supabase cache: ${action} ${table}${key ? ` (${key})` : ''}`;
                        }

                        if (isGeocoding) return 'Guardamos en Supabase: api_logs + cityName/resolvedFrom/resultsCount';
                        if (isDirections) return 'Guardamos en Supabase: api_logs + distance/duration/legs/waypoints';
                        if (isPlaces) return 'Guardamos en Supabase: api_logs + supercat/resultsCount (1 request por supercat)';
                        return 'Guardamos en Supabase: api_logs';
                      })();

                      const summaryInline = `Cache:${cacheInfo.label} · ${apiResponseSummary}`;

                      return (
                        <details
                          key={`details-${r.id}`}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            background: '#ffffff',
                            padding: '10px 12px',
                          }}
                        >
                          <summary style={{ cursor: 'pointer', color: '#111827', fontWeight: 600 }}>
                            <span>{title}</span>
                            <span style={{ color: '#6b7280', fontWeight: 500 }}> · {summaryInline}</span>
                          </summary>

                          <div style={{ marginTop: 10, border: '1px solid #eef2f7', borderRadius: 10, padding: 10 }}>
                            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#111827' }}>
                              <div><span style={{ color: '#6b7280' }}>1) API + coste:</span> {r.api} · {cacheInfo.cost} · {r.duration_ms ?? 0} ms</div>
                              <div><span style={{ color: '#6b7280' }}>2) Caché:</span> {cacheInfo.label} · {cacheInfo.detail}</div>
                              <div><span style={{ color: '#6b7280' }}>3) Respuesta API:</span> {apiResponseSummary}</div>
                              <div><span style={{ color: '#6b7280' }}>4) Guardado en Supabase:</span> {supabaseWriteSummary}</div>
                            </div>

                            <details style={{ marginTop: 10, borderTop: '1px solid #eef2f7', paddingTop: 10 }}>
                              <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#111827' }}>Ver debug (url + request/response + row)</summary>
                              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                                <div><span style={{ color: '#6b7280' }}>id:</span> <span style={{ fontFamily: 'monospace' }}>{r.id}</span></div>
                                <div><span style={{ color: '#6b7280' }}>created_at:</span> {createdAt.toISOString()}</div>
                                <div><span style={{ color: '#6b7280' }}>env:</span> {r.env}</div>
                                <div><span style={{ color: '#6b7280' }}>trip_id:</span> <span style={{ fontFamily: 'monospace' }}>{r.trip_id || '-'}</span></div>
                                <div><span style={{ color: '#6b7280' }}>method:</span> {r.method || '-'}</div>
                                <div><span style={{ color: '#6b7280' }}>status:</span> {r.status || '-'}</div>
                                <div><span style={{ color: '#6b7280' }}>cached:</span> {String(Boolean(r.cached))}</div>

                                <div style={{ marginTop: 10 }}><span style={{ color: '#6b7280' }}>url:</span></div>
                                <pre style={{ marginTop: 6, background: '#f9fafb', color: '#111827', padding: 10, borderRadius: 8, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>{r.url || '-'}</pre>

                                <div style={{ marginTop: 10 }}><span style={{ color: '#6b7280' }}>request:</span></div>
                                <pre style={{ marginTop: 6, background: '#f9fafb', color: '#111827', padding: 10, borderRadius: 8, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>{formatJson(r.request)}</pre>

                                <div style={{ marginTop: 10 }}><span style={{ color: '#6b7280' }}>response:</span></div>
                                <pre style={{ marginTop: 6, background: '#f9fafb', color: '#111827', padding: 10, borderRadius: 8, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>{formatJson(r.response)}</pre>

                                <div style={{ marginTop: 10 }}><span style={{ color: '#6b7280' }}>row:</span></div>
                                <pre style={{ marginTop: 6, background: '#111827', color: '#e5e7eb', padding: '1rem', borderRadius: 6, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>{formatJson(r)}</pre>
                              </div>
                            </details>
                          </div>
                        </details>
                      );
                    })}
                  </div>

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
