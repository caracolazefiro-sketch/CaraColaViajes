import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';
import {
  getDirectionsCache,
  makeDirectionsCacheKey,
  upsertDirectionsCache,
} from '../../../utils/supabase-cache';
import { supabaseServer } from '../../../utils/supabase-server';

type LatLngLiteral = { lat: number; lng: number };

type DirectionsRequestBody = {
  origin?: string | LatLngLiteral;
  destination?: string | LatLngLiteral;
  waypoints?: Array<string | LatLngLiteral>;
  travelMode?: 'driving';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  language?: string;
  tripId?: string;
};

type GoogleDirectionsJson = {
  status?: string;
  error_message?: string;
  routes?: Array<{
    bounds?: {
      northeast?: { lat?: number; lng?: number };
      southwest?: { lat?: number; lng?: number };
    };
    legs?: Array<{
      distance?: { value?: number; text?: string };
      duration?: { value?: number; text?: string };
    }>;
    overview_polyline?: { points?: string };
    summary?: string;
  }>;
};

type DirectionsSummary = {
  distance_m: number;
  duration_s: number;
  route_summary: string | null;
};

type DirectionsPayload = {
  ok: true;
  cached: boolean;
  overviewPolyline: string;
  bounds: NonNullable<GoogleDirectionsJson['routes']>[number]['bounds'] | null;
  summary: DirectionsSummary;
};

function isDirectionsPayload(value: unknown): value is DirectionsPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.ok !== true) return false;
  if (typeof v.cached !== 'boolean') return false;
  if (typeof v.overviewPolyline !== 'string') return false;
  if (!v.summary || typeof v.summary !== 'object') return false;
  return true;
}

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || undefined;
  const realIp = req.headers.get('x-real-ip');
  return realIp || undefined;
}

function getClientId(req: Request): string | undefined {
  return req.headers.get('x-caracola-client-id') || undefined;
}

function asLocationString(v: string | LatLngLiteral | undefined | null): string {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  const lat = Number(v.lat);
  const lng = Number(v.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat},${lng}`;
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

  let body: DirectionsRequestBody = {};
  try {
    body = (await req.json()) as DirectionsRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const origin = asLocationString(body.origin);
  const destination = asLocationString(body.destination);
  if (!origin || !destination) {
    return NextResponse.json({ error: 'missing-origin-or-destination' }, { status: 400 });
  }

  const travelMode = 'driving';
  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'es';
  const avoidTolls = Boolean(body.avoidTolls);
  const avoidHighways = Boolean(body.avoidHighways);

  const waypoints = Array.isArray(body.waypoints)
    ? body.waypoints.map((w) => asLocationString(w)).filter(Boolean)
    : [];

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const rl = await isRateLimited({
    api: 'google-directions',
    routeTag: 'directions',
    clientId: client_id,
    ip,
    limitPerMinute: 20,
  });

  if (rl.limited) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-directions',
      method: 'POST',
      url: 'caracola:/api/google/directions',
      status: 'RATE_LIMITED',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions' },
      response: { error: 'rate-limited', reason: rl.reason },
    });

    return NextResponse.json({ error: 'rate-limited', reason: rl.reason }, { status: 429 });
  }

  const cacheKey = makeDirectionsCacheKey({ origin, destination, waypoints, travelMode: `${travelMode}|tolls:${avoidTolls ? 1 : 0}|hw:${avoidHighways ? 1 : 0}` });

  const cached = await getDirectionsCache({ key: cacheKey.key });
  if (cached.ok && cached.hit && cached.payload) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-directions',
      method: 'POST',
      url: 'supabase:api_cache_directions',
      status: 'CACHE_HIT_SUPABASE',
      duration_ms: Date.now() - startedAt,
      cached: true,
      request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions', cache: { provider: 'supabase', key: cacheKey.key } },
      response: { status: 'CACHE_HIT_SUPABASE', cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt } },
    });

    const cachedPayload = cached.payload as unknown;
    if (isDirectionsPayload(cachedPayload)) {
      return NextResponse.json({ ...cachedPayload, cached: true } satisfies DirectionsPayload);
    }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-directions',
      method: 'POST',
      url: 'caracola:/api/google/directions',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  if (waypoints.length) url.searchParams.set('waypoints', waypoints.join('|'));
  url.searchParams.set('mode', travelMode);
  url.searchParams.set('language', language);
  if (avoidTolls) url.searchParams.set('avoid', 'tolls');
  // Google Directions doesn't support multiple avoid params in a single query param; keep tolls only.
  // If we need highways, we will encode it in the cache key and add a separate request strategy later.
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
    const json = (await res.json()) as GoogleDirectionsJson;

    const status = String(json.status || res.status);
    const firstRoute = Array.isArray(json.routes) ? json.routes[0] : undefined;
    const overviewPolyline = firstRoute?.overview_polyline?.points;

    const totalDistanceM = (firstRoute?.legs || []).reduce((sum, l) => sum + (l.distance?.value || 0), 0);
    const totalDurationS = (firstRoute?.legs || []).reduce((sum, l) => sum + (l.duration?.value || 0), 0);

    if (status !== 'OK' || !overviewPolyline) {
      await logApiToSupabase({
        trip_id: body.tripId,
        api: 'google-directions',
        method: 'GET',
        url: urlNoKey,
        status,
        duration_ms: durationMs,
        cached: false,
        request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
        response: { status, httpStatus: res.status, error_message: json.error_message },
      });

      return NextResponse.json({ error: 'google-directions-error', status }, { status: 502 });
    }

    const payload = {
      ok: true,
      cached: false,
      overviewPolyline,
      bounds: firstRoute?.bounds ?? null,
      summary: {
        distance_m: totalDistanceM,
        duration_s: totalDurationS,
        route_summary: firstRoute?.summary ?? null,
      },
    };

    await upsertDirectionsCache({
      key: cacheKey.key,
      origin,
      destination,
      waypoints,
      travelMode: cacheKey.travelMode,
      payload,
      summary: payload.summary,
      ttlDays: 30,
    });

    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-directions',
      method: 'GET',
      url: urlNoKey,
      status,
      duration_ms: durationMs,
      cached: false,
      request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
      response: { status, httpStatus: res.status, cacheWrite: { provider: 'supabase', action: 'upsert', table: 'api_cache_directions', key: cacheKey.key } },
    });

    return NextResponse.json(payload);
  } catch (err) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-directions',
      method: 'GET',
      url: urlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { origin, destination, waypoints, travelMode, language, avoidTolls, avoidHighways, client_id, ip, ua, route: 'directions' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
