import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';
import {
  getElevationCache,
  makeElevationCacheKey,
  upsertElevationCache,
} from '../../../utils/supabase-cache';
import { supabaseServer } from '../../../utils/supabase-server';

type ElevationRequestBody = {
  polyline?: string;
  samples?: number;
  tripId?: string;
};

type GoogleElevationJson = {
  status?: string;
  error_message?: string;
  results?: Array<{
    elevation?: number;
    resolution?: number;
    location?: { lat?: number; lng?: number };
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

  const identifierField = params.clientId ? 'request->>client_id' : params.ip ? 'request->>ip' : null;
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

  let body: ElevationRequestBody = {};
  try {
    body = (await req.json()) as ElevationRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const polyline = String(body.polyline || '').trim();
  if (!polyline) return NextResponse.json({ error: 'missing-polyline' }, { status: 400 });

  const samples = Math.max(10, Math.min(512, Math.round(Number(body.samples ?? 100))));

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const rl = await isRateLimited({
    api: 'other',
    routeTag: 'elevation',
    clientId: client_id,
    ip,
    limitPerMinute: 30,
  });

  if (rl.limited) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'other',
      method: 'POST',
      url: 'caracola:/api/google/elevation',
      status: 'RATE_LIMITED',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { samples, client_id, ip, ua, route: 'elevation' },
      response: { error: 'rate-limited', reason: rl.reason },
    });

    return NextResponse.json({ error: 'rate-limited', reason: rl.reason }, { status: 429 });
  }

  const cacheKey = makeElevationCacheKey({ polyline, samples });

  const cached = await getElevationCache({ key: cacheKey.key });
  if (cached.ok && cached.hit && cached.payload) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'other',
      method: 'POST',
      url: 'supabase:api_cache_elevation',
      status: 'CACHE_HIT_SUPABASE',
      duration_ms: Date.now() - startedAt,
      cached: true,
      request: { samples, client_id, ip, ua, route: 'elevation', cache: { provider: 'supabase', key: cacheKey.key } },
      response: { status: 'CACHE_HIT_SUPABASE', cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt } },
    });

    return NextResponse.json({ ok: true, cached: true, results: cached.payload });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'other',
      method: 'POST',
      url: 'caracola:/api/google/elevation',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { samples, client_id, ip, ua, route: 'elevation' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/elevation/json');
  url.searchParams.set('path', `enc:${polyline}`);
  url.searchParams.set('samples', String(samples));
  url.searchParams.set('key', apiKey);

  const urlNoKey = (() => {
    const u = new URL(url.toString());
    u.searchParams.delete('key');
    return u.toString();
  })();

  try {
    const t0 = Date.now();
    const res = await fetch(url.toString(), { method: 'GET' });
    const durationMs = Date.now() - t0;
    const json = (await res.json()) as GoogleElevationJson;

    const status = String(json.status || res.status);
    const results = Array.isArray(json.results) ? json.results : [];

    if (status !== 'OK' || results.length === 0) {
      await logApiToSupabase({
        trip_id: body.tripId,
        api: 'other',
        method: 'GET',
        url: urlNoKey,
        status,
        duration_ms: durationMs,
        cached: false,
        request: { samples, client_id, ip, ua, route: 'elevation', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
        response: { status, httpStatus: res.status, error_message: json.error_message },
      });

      return NextResponse.json({ error: 'google-elevation-error', status }, { status: 502 });
    }

    const payload = results.map((r) => ({
      elevation: r.elevation,
      resolution: r.resolution,
      location: r.location,
    }));

    await upsertElevationCache({
      key: cacheKey.key,
      polyline,
      samples,
      payload,
      ttlDays: 180,
    });

    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'other',
      method: 'GET',
      url: urlNoKey,
      status,
      duration_ms: durationMs,
      cached: false,
      request: { samples, client_id, ip, ua, route: 'elevation', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
      response: { status, httpStatus: res.status, cacheWrite: { provider: 'supabase', action: 'upsert', table: 'api_cache_elevation', key: cacheKey.key } },
    });

    return NextResponse.json({ ok: true, cached: false, results: payload });
  } catch (err) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'other',
      method: 'GET',
      url: urlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { samples, client_id, ip, ua, route: 'elevation' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
