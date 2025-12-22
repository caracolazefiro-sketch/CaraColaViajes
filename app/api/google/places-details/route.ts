import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';
import {
  getPlacesDetailsCache,
  makePlacesDetailsCacheKey,
  upsertPlacesDetailsCache,
} from '../../../utils/supabase-cache';
import { supabaseServer } from '../../../utils/supabase-server';

type PlacesDetailsRequest = {
  placeId?: string;
  fields?: string[];
  language?: string;
  tripId?: string;
};

type PlacesDetailsResponse = {
  ok: true;
  cached: boolean;
  place: {
    place_id: string;
    name?: string;
    vicinity?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
    geometry?: { location?: { lat: number; lng: number } };
    photoUrl?: string;
  };
};

type GooglePlacesDetailsJson = {
  status?: string;
  result?: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    vicinity?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: unknown;
    geometry?: { location?: { lat?: number; lng?: number } };
    photos?: Array<{ photo_reference?: string }>;
  };
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

const SAFE_FIELDS = new Set([
  'place_id',
  'name',
  'formatted_address',
  'vicinity',
  'rating',
  'user_ratings_total',
  'geometry',
  'types',
  'photos',
]);

function normalizeFields(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  const fields = arr
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => SAFE_FIELDS.has(f));

  // Always include the basics we rely on.
  const required = ['place_id', 'name', 'geometry'];
  for (const r of required) if (!fields.includes(r)) fields.push(r);
  if (!fields.includes('photos')) fields.push('photos');
  return Array.from(new Set(fields)).sort();
}

async function isRateLimited(params: {
  api: string;
  routeTag: string;
  clientId?: string;
  ip?: string;
  limitPerMinute: number;
}): Promise<{ limited: boolean; reason?: string }>
{
  if (!supabaseServer) return { limited: false };

  const sinceIso = new Date(Date.now() - 60_000).toISOString();

  const identifierField = params.clientId ? 'request->>client_id' : (params.ip ? 'request->>ip' : null);
  const identifierValue = params.clientId || params.ip;
  if (!identifierField || !identifierValue) return { limited: false };

  const { count, error } = await supabaseServer
    .from('api_logs')
    .select('id', { count: 'exact', head: true })
    .eq('api', params.api)
    .gte('created_at', sinceIso)
    .filter('request->>route', 'eq', params.routeTag)
    .filter(identifierField, 'eq', identifierValue);

  if (error) {
    // If the query fails, prefer allowing the request rather than breaking UX.
    return { limited: false };
  }

  if ((count ?? 0) >= params.limitPerMinute) {
    return { limited: true, reason: `rate-limit ${params.limitPerMinute}/min` };
  }

  return { limited: false };
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  let body: PlacesDetailsRequest = {};

  try {
    body = (await req.json()) as PlacesDetailsRequest;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const placeId = String(body.placeId || '').trim();
  if (!placeId) {
    return NextResponse.json({ error: 'missing-placeId' }, { status: 400 });
  }

  const fields = normalizeFields(body.fields);
  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'es';

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const rl = await isRateLimited({
    api: 'google-places',
    routeTag: 'places-details',
    clientId: client_id,
    ip,
    limitPerMinute: 30,
  });

  if (rl.limited) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-places',
      method: 'POST',
      url: 'caracola:/api/google/places-details',
      status: 'RATE_LIMITED',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { placeId, fields, language, client_id, ip, ua, route: 'places-details' },
      response: { error: 'rate-limited', reason: rl.reason },
    });

    return NextResponse.json({ error: 'rate-limited', reason: rl.reason }, { status: 429 });
  }

  const cacheKey = makePlacesDetailsCacheKey({ placeId, fields, language });

  // 1) Cache HIT
  const cached = await getPlacesDetailsCache({ key: cacheKey.key });
  if (cached.ok && cached.hit && cached.payload) {
    const cachedPlace = cached.payload as unknown as PlacesDetailsResponse['place'];

    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-places',
      method: 'POST',
      url: 'supabase:api_cache_places_details',
      status: 'CACHE_HIT_SUPABASE',
      duration_ms: Date.now() - startedAt,
      cached: true,
      request: { placeId, fields, language, cache: { provider: 'supabase', key: cacheKey.key }, client_id, ip, ua, route: 'places-details' },
      response: { status: 'CACHE_HIT_SUPABASE', cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt } },
    });

    return NextResponse.json({ ok: true, cached: true, place: cachedPlace } satisfies PlacesDetailsResponse);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-places',
      method: 'POST',
      url: 'caracola:/api/google/places-details',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { placeId, fields, language, client_id, ip, ua, route: 'places-details' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  googleUrl.searchParams.set('place_id', placeId);
  googleUrl.searchParams.set('fields', fields.join(','));
  googleUrl.searchParams.set('language', language);
  googleUrl.searchParams.set('key', apiKey);

  const googleUrlNoKey = (() => {
    const u = new URL(googleUrl.toString());
    u.searchParams.delete('key');
    return u.toString();
  })();

  let status = 'UNKNOWN';

  try {
    const t0 = Date.now();
    const res = await fetch(googleUrl.toString(), { method: 'GET' });
    const durationMs = Date.now() - t0;
    const json = (await res.json()) as GooglePlacesDetailsJson;

    status = String(json?.status || res.status);

    const result = json?.result || {};
    const lat = result?.geometry?.location?.lat;
    const lng = result?.geometry?.location?.lng;

    const firstPhotoRef = Array.isArray(result?.photos) && result.photos[0]?.photo_reference
      ? String(result.photos[0].photo_reference)
      : undefined;

    const photoUrl = firstPhotoRef
      ? `/api/google/place-photo?ref=${encodeURIComponent(firstPhotoRef)}&maxwidth=400`
      : undefined;

    const place = {
      place_id: String(result?.place_id || placeId),
      name: typeof result?.name === 'string' ? result.name : undefined,
      vicinity:
        typeof result?.formatted_address === 'string'
          ? result.formatted_address
          : (typeof result?.vicinity === 'string' ? result.vicinity : undefined),
      rating: typeof result?.rating === 'number' ? result.rating : undefined,
      user_ratings_total: typeof result?.user_ratings_total === 'number' ? result.user_ratings_total : undefined,
      types: Array.isArray(result?.types) ? result.types.map(String) : undefined,
      geometry:
        typeof lat === 'number' && typeof lng === 'number'
          ? { location: { lat, lng } }
          : undefined,
      photoUrl,
    };

    // Cache only successful results.
    if (status === 'OK') {
      await upsertPlacesDetailsCache({
        key: cacheKey.key,
        placeId,
        fields: fields.join(','),
        language,
        payload: place,
        ttlDays: 30,
      });
    }

    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status,
      duration_ms: durationMs,
      cached: false,
      request: { placeId, fields, language, client_id, ip, ua, route: 'places-details', cache: { provider: 'supabase', key: cacheKey.key, hit: false } },
      response: { status, httpStatus: res.status, hasResult: Boolean(json?.result), cacheWrite: status === 'OK' ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_details', key: cacheKey.key } : { provider: 'supabase', action: 'none' } },
    });

    if (status !== 'OK') {
      return NextResponse.json({ error: 'google-places-error', status }, { status: 502 });
    }

    return NextResponse.json({ ok: true, cached: false, place } satisfies PlacesDetailsResponse);
  } catch (err) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { placeId, fields, language, client_id, ip, ua, route: 'places-details' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
