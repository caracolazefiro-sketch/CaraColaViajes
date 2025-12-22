import { supabaseServer } from './supabase-server';
import { createHash } from 'crypto';

export type CacheProvider = 'supabase';

const roundCoord = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toKeyNumber = (value: number, decimals: number) => {
  // Keep keys stable across locales
  return Number.isFinite(value) ? value.toFixed(decimals) : (0).toFixed(decimals);
};

export function makeGeocodingCacheKey(
  lat: number,
  lng: number,
  opts?: {
    decimals?: number;
    namespace?: string;
  }
) {
  const decimals = opts?.decimals ?? 4;
  const namespace = opts?.namespace ?? 'geocode';
  const latR = roundCoord(lat, decimals);
  const lngR = roundCoord(lng, decimals);
  return {
    key: `${namespace}:${toKeyNumber(latR, decimals)},${toKeyNumber(lngR, decimals)}`,
    lat: latR,
    lng: lngR,
  };
}

export function makePlacesSupercatCacheKey(params: {
  supercat: 1 | 2 | 3 | 4;
  lat: number;
  lng: number;
  radius: number;
  namespace?: string;
  quantizeMeters?: number;
}) {
  const quantizeMeters = params.quantizeMeters;

  const quantizeLatLng = (lat: number, lng: number, meters: number) => {
    const m = Math.max(250, Math.min(5000, Math.round(meters)));
    const metersPerDegLat = 111_320;
    const latStep = m / metersPerDegLat;
    const cos = Math.cos((lat * Math.PI) / 180);
    const metersPerDegLng = metersPerDegLat * Math.max(0.2, Math.abs(cos));
    const lngStep = m / metersPerDegLng;
    const qLat = Number.isFinite(latStep) && latStep > 0 ? Math.round(lat / latStep) * latStep : lat;
    const qLng = Number.isFinite(lngStep) && lngStep > 0 ? Math.round(lng / lngStep) * lngStep : lng;
    return { lat: qLat, lng: qLng, meters: m };
  };

  const latLng =
    typeof quantizeMeters === 'number' && Number.isFinite(quantizeMeters) && quantizeMeters > 0
      ? quantizeLatLng(params.lat, params.lng, quantizeMeters)
      : { lat: params.lat, lng: params.lng, meters: null as number | null };

  const latR = roundCoord(latLng.lat, 4);
  const lngR = roundCoord(latLng.lng, 4);
  const radius = Math.round(params.radius);
  const namespace = params.namespace ?? 'places-supercat';
  return {
    key: `${namespace}:${params.supercat}:${toKeyNumber(latR, 4)},${toKeyNumber(lngR, 4)}:${radius}`,
    lat: latR,
    lng: lngR,
    radius,
    supercat: params.supercat,
  };
}

export function makeDirectionsCacheKey(params: {
  origin: string;
  destination: string;
  waypoints: string[];
  travelMode: string;
}) {
  const canonical = `${params.travelMode}|${params.origin}|${params.destination}|${params.waypoints.join('|')}`;
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
  return {
    key: `directions:${hash}`,
    hash,
    origin: params.origin,
    destination: params.destination,
    waypoints: params.waypoints,
    travelMode: params.travelMode,
  };
}

export function makePlacesDetailsCacheKey(params: {
  placeId: string;
  fields: string[];
  language?: string;
}) {
  const sortedFields = [...params.fields].map(String).map((s) => s.trim()).filter(Boolean).sort();
  const canonical = `${params.placeId}|${sortedFields.join(',')}|${params.language ?? ''}`;
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
  return {
    key: `places-details:${hash}`,
    hash,
    placeId: params.placeId,
    fields: sortedFields,
    language: params.language,
  };
}

export function makeGeocodeAddressCacheKey(params: { query: string; language?: string }) {
  const canonical = `${params.query.trim()}|${params.language ?? ''}`;
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
  return {
    key: `geocode-address:${hash}`,
    hash,
    query: params.query.trim(),
    language: params.language,
  };
}

export function makeElevationCacheKey(params: { polyline: string; samples: number }) {
  const polyline = String(params.polyline || '').trim();
  const samples = Math.max(1, Math.min(512, Math.round(params.samples || 0)));
  const canonical = `${samples}|${polyline}`;
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
  return {
    key: `elevation:${hash}`,
    hash,
    samples,
  };
}

const nowIso = () => new Date().toISOString();
const addDaysIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export async function getGeocodingCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_geocoding')
    .select('city_name, resolved_from, payload, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    cityName: String(data.city_name || ''),
    resolvedFrom: data.resolved_from ? String(data.resolved_from) : undefined,
    payload: data.payload as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertGeocodingCache(params: {
  key: string;
  lat: number;
  lng: number;
  cityName: string;
  resolvedFrom?: string;
  payload?: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 30;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_geocoding')
    .upsert(
      {
        key: params.key,
        lat: params.lat,
        lng: params.lng,
        city_name: params.cityName,
        resolved_from: params.resolvedFrom ?? null,
        payload: (params.payload ?? null) as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}

export async function getPlacesSupercatCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_places_supercat')
    .select('payload, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    payload: data.payload as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertPlacesSupercatCache(params: {
  key: string;
  supercat: 1 | 2 | 3 | 4;
  centerLat: number;
  centerLng: number;
  radius: number;
  payload: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 90;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_places_supercat')
    .upsert(
      {
        key: params.key,
        supercat: params.supercat,
        center_lat: params.centerLat,
        center_lng: params.centerLng,
        radius: params.radius,
        payload: params.payload as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}

export async function getDirectionsCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_directions')
    .select('payload, summary, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    payload: data.payload as unknown,
    summary: data.summary as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertDirectionsCache(params: {
  key: string;
  origin: string;
  destination: string;
  waypoints: string[];
  travelMode: string;
  payload: unknown;
  summary?: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 30;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_directions')
    .upsert(
      {
        key: params.key,
        origin: params.origin,
        destination: params.destination,
        waypoints: params.waypoints,
        travel_mode: params.travelMode,
        payload: params.payload as unknown,
        summary: (params.summary ?? null) as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}

export async function getPlacesDetailsCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_places_details')
    .select('place_id, fields, language, payload, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    placeId: String(data.place_id || ''),
    fields: String(data.fields || ''),
    language: data.language ? String(data.language) : undefined,
    payload: data.payload as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertPlacesDetailsCache(params: {
  key: string;
  placeId: string;
  fields: string;
  language?: string;
  payload: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 30;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_places_details')
    .upsert(
      {
        key: params.key,
        place_id: params.placeId,
        fields: params.fields,
        language: params.language ?? null,
        payload: params.payload as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}

export async function getGeocodeAddressCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_geocode_address')
    .select('query, language, payload, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    query: String(data.query || ''),
    language: data.language ? String(data.language) : undefined,
    payload: data.payload as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertGeocodeAddressCache(params: {
  key: string;
  query: string;
  language?: string;
  payload: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 90;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_geocode_address')
    .upsert(
      {
        key: params.key,
        query: params.query,
        language: params.language ?? null,
        payload: params.payload as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}

export async function getElevationCache(params: { key: string }) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const { data, error } = await supabaseServer
    .from('api_cache_elevation')
    .select('payload, expires_at')
    .eq('key', params.key)
    .maybeSingle();

  if (error) return { ok: false as const, reason: error.message };
  if (!data) return { ok: true as const, hit: false as const };

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt <= Date.now()) {
    return { ok: true as const, hit: false as const };
  }

  return {
    ok: true as const,
    hit: true as const,
    payload: data.payload as unknown,
    expiresAt: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export async function upsertElevationCache(params: {
  key: string;
  polyline: string;
  samples: number;
  payload: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 180;
  const expires_at = addDaysIso(ttlDays);

  const { error } = await supabaseServer
    .from('api_cache_elevation')
    .upsert(
      {
        key: params.key,
        polyline: params.polyline,
        samples: params.samples,
        payload: params.payload as unknown,
        expires_at,
        updated_at: nowIso(),
      },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, expiresAt: expires_at, ttlDays };
}
