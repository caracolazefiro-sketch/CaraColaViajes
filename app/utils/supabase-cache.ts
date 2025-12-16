import { supabaseServer } from '../supabase';

export type CacheProvider = 'supabase';

const roundCoord = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toKeyNumber = (value: number) => {
  // Keep keys stable across locales
  return Number.isFinite(value) ? value.toFixed(4) : '0.0000';
};

export function makeGeocodingCacheKey(lat: number, lng: number) {
  const latR = roundCoord(lat, 4);
  const lngR = roundCoord(lng, 4);
  return {
    key: `geocode:${toKeyNumber(latR)},${toKeyNumber(lngR)}`,
    lat: latR,
    lng: lngR,
  };
}

export function makePlacesSupercatCacheKey(params: { supercat: 1 | 2; lat: number; lng: number; radius: number }) {
  const latR = roundCoord(params.lat, 4);
  const lngR = roundCoord(params.lng, 4);
  const radius = Math.round(params.radius);
  return {
    key: `places-supercat:${params.supercat}:${toKeyNumber(latR)},${toKeyNumber(lngR)}:${radius}`,
    lat: latR,
    lng: lngR,
    radius,
    supercat: params.supercat,
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
  supercat: 1 | 2;
  centerLat: number;
  centerLng: number;
  radius: number;
  payload: unknown;
  ttlDays?: number;
}) {
  if (!supabaseServer) return { ok: false as const, reason: 'no-supabase-server' };

  const ttlDays = params.ttlDays ?? 7;
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
