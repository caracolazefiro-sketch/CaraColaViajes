import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';
import {
  getGeocodeAddressCache,
  makeGeocodeAddressCacheKey,
  upsertGeocodeAddressCache,
} from '../../../utils/supabase-cache';
import { supabaseServer } from '../../../utils/supabase-server';

type GeocodeAddressRequest = {
  query?: string;
  language?: string;
  tripId?: string;
};

type GeocodeAddressOk = {
  ok: true;
  cached: boolean;
  result: {
    formatted_address: string;
    location: { lat: number; lng: number };
    place_id?: string;
    types?: string[];
  };
};

function isGeocodeAddressResult(value: unknown): value is GeocodeAddressOk['result'] {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.formatted_address !== 'string') return false;
  if (!v.location || typeof v.location !== 'object') return false;
  const loc = v.location as Record<string, unknown>;
  return typeof loc.lat === 'number' && Number.isFinite(loc.lat) && typeof loc.lng === 'number' && Number.isFinite(loc.lng);
}

type GoogleGeocodeJson = {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    types?: unknown;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || undefined;
  const realIp = req.headers.get('x-real-ip');
  return realIp || undefined;
}

function getClientId(req: Request): string | undefined {
  return req.headers.get('x-caracola-client-id') || undefined;
}

async function isRateLimited(params: {
  api: string;
  routeTag: string;
  clientId?: string;
  ip?: string;
  limitPerMinute: number;
}): Promise<{ limited: boolean; reason?: string }> {
  if (!supabaseServer) return { limited: false };

  const sinceIso = new Date(Date.now() - 60_000).toISOString();

  const identifierField = params.clientId
    ? 'request->>client_id'
    : (params.ip ? 'request->>ip' : null);
  const identifierValue = params.clientId || params.ip;
  if (!identifierField || !identifierValue) return { limited: false };

  const { count, error } = await supabaseServer
    .from('api_logs')
    .select('id', { count: 'exact', head: true })
    .eq('api', params.api)
    .gte('created_at', sinceIso)
    .filter('request->>route', 'eq', params.routeTag)
    .filter(identifierField, 'eq', identifierValue);

  if (error) return { limited: false };
  if ((count ?? 0) >= params.limitPerMinute) {
    return { limited: true, reason: `rate-limit ${params.limitPerMinute}/min` };
  }
  return { limited: false };
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  let body: GeocodeAddressRequest = {};
  try {
    body = (await req.json()) as GeocodeAddressRequest;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const query = String(body.query || '').trim();
  if (!query) return NextResponse.json({ error: 'missing-query' }, { status: 400 });

  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'es';

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const rl = await isRateLimited({
    api: 'google-geocoding',
    routeTag: 'geocode-address',
    clientId: client_id,
    ip,
    limitPerMinute: 30,
  });

  if (rl.limited) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'POST',
      url: 'caracola:/api/google/geocode-address',
      status: 'RATE_LIMITED',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { query, language, client_id, ip, ua, route: 'geocode-address' },
      response: { error: 'rate-limited', reason: rl.reason },
    });

    return NextResponse.json({ error: 'rate-limited', reason: rl.reason }, { status: 429 });
  }

  const cacheKey = makeGeocodeAddressCacheKey({ query, language });

  const cached = await getGeocodeAddressCache({ key: cacheKey.key });
  if (cached.ok && cached.hit && cached.payload) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'POST',
      url: 'supabase:api_cache_geocode_address',
      status: 'CACHE_HIT_SUPABASE',
      duration_ms: Date.now() - startedAt,
      cached: true,
      request: { query, language, cache: { provider: 'supabase', key: cacheKey.key }, client_id, ip, ua, route: 'geocode-address' },
      response: { status: 'CACHE_HIT_SUPABASE', cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt } },
    });

    const cachedResult = cached.payload as unknown;
    if (isGeocodeAddressResult(cachedResult)) {
      return NextResponse.json({ ok: true, cached: true, result: cachedResult } satisfies GeocodeAddressOk);
    }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'POST',
      url: 'caracola:/api/google/geocode-address',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { query, language, client_id, ip, ua, route: 'geocode-address' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const googleUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  googleUrl.searchParams.set('address', query);
  googleUrl.searchParams.set('language', language);
  googleUrl.searchParams.set('key', apiKey);

  const googleUrlNoKey = (() => {
    const u = new URL(googleUrl.toString());
    u.searchParams.delete('key');
    return u.toString();
  })();

  try {
    const t0 = Date.now();
    const res = await fetch(googleUrl.toString(), { method: 'GET' });
    const durationMs = Date.now() - t0;
    const json = (await res.json()) as GoogleGeocodeJson;

    const status = String(json.status || res.status);
    const first = Array.isArray(json.results) ? json.results[0] : undefined;

    const lat = first?.geometry?.location?.lat;
    const lng = first?.geometry?.location?.lng;

    if (status !== 'OK' || typeof lat !== 'number' || typeof lng !== 'number' || !first?.formatted_address) {
      await logApiToSupabase({
        trip_id: body.tripId,
        api: 'google-geocoding',
        method: 'GET',
        url: googleUrlNoKey,
        status,
        duration_ms: durationMs,
        cached: false,
        request: { query, language, client_id, ip, ua, route: 'geocode-address', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
        response: { status, httpStatus: res.status, error_message: json.error_message },
      });

      return NextResponse.json({ error: 'google-geocoding-error', status }, { status: 502 });
    }

    const payload = {
      formatted_address: String(first.formatted_address),
      location: { lat, lng },
      place_id: first.place_id ? String(first.place_id) : undefined,
      types: Array.isArray(first.types) ? (first.types as unknown[]).map(String) : undefined,
    };

    await upsertGeocodeAddressCache({
      key: cacheKey.key,
      query,
      language,
      payload,
      ttlDays: 90,
    });

    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'GET',
      url: googleUrlNoKey,
      status,
      duration_ms: durationMs,
      cached: false,
      request: { query, language, client_id, ip, ua, route: 'geocode-address', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
      response: { status, httpStatus: res.status, cacheWrite: { provider: 'supabase', action: 'upsert', table: 'api_cache_geocode_address', key: cacheKey.key } },
    });

    return NextResponse.json({ ok: true, cached: false, result: payload } satisfies GeocodeAddressOk);
  } catch (err) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'GET',
      url: googleUrlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { query, language, client_id, ip, ua, route: 'geocode-address' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
