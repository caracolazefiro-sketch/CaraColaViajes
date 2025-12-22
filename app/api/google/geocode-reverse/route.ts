import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';
import {
  getGeocodingCache,
  makeGeocodingCacheKey,
  upsertGeocodingCache,
} from '../../../utils/supabase-cache';

type ReverseGeocodeRequest = {
  lat?: number;
  lng?: number;
  language?: string;
  tripId?: string;
};

type ReverseGeocodeOk = {
  ok: true;
  cached: boolean;
  result: {
    cityName: string;
    resolvedFrom?: string;
  };
};

type GoogleReverseGeocodeJson = {
  status?: string;
  error_message?: string;
  results?: Array<{
    address_components?: Array<{ long_name?: string; types?: string[] }>;
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

function extractCityName(json: GoogleReverseGeocodeJson): { cityName: string; resolvedFrom?: string } {
  const result0 = Array.isArray(json.results) ? json.results[0] : undefined;
  const comps = Array.isArray(result0?.address_components) ? result0?.address_components : [];

  const tryType = (t: string) => comps.find((c) => Array.isArray(c.types) && c.types.includes(t))?.long_name;

  const locality = tryType('locality');
  if (locality) return { cityName: locality, resolvedFrom: 'locality' };

  const sublocality = tryType('sublocality');
  if (sublocality) return { cityName: sublocality, resolvedFrom: 'sublocality' };

  const admin3 = tryType('administrative_area_level_3');
  if (admin3) return { cityName: admin3, resolvedFrom: 'administrative_area_level_3' };

  const admin2 = tryType('administrative_area_level_2');
  if (admin2) return { cityName: admin2, resolvedFrom: 'administrative_area_level_2' };

  const admin1 = tryType('administrative_area_level_1');
  if (admin1) return { cityName: admin1, resolvedFrom: 'administrative_area_level_1' };

  return { cityName: 'Punto en Ruta', resolvedFrom: 'fallback' };
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  let body: ReverseGeocodeRequest = {};
  try {
    body = (await req.json()) as ReverseGeocodeRequest;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'missing-latlng' }, { status: 400 });
  }

  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'es';

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const geoKey = makeGeocodingCacheKey(lat, lng, { namespace: 'reverse' });

  const cached = await getGeocodingCache({ key: geoKey.key });
  if (cached.ok && cached.hit) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'POST',
      url: 'supabase:api_cache_geocoding',
      status: 'CACHE_HIT_SUPABASE',
      duration_ms: Date.now() - startedAt,
      cached: true,
      request: { lat, lng, language, client_id, ip, ua, route: 'geocode-reverse', cache: { provider: 'supabase', key: geoKey.key } },
      response: { status: 'CACHE_HIT_SUPABASE', cityName: cached.cityName, resolvedFrom: cached.resolvedFrom, expiresAt: cached.expiresAt },
    });

    return NextResponse.json({ ok: true, cached: true, result: { cityName: cached.cityName, resolvedFrom: cached.resolvedFrom } } satisfies ReverseGeocodeOk);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'POST',
      url: 'caracola:/api/google/geocode-reverse',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { lat, lng, language, client_id, ip, ua, route: 'geocode-reverse' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const googleUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  googleUrl.searchParams.set('latlng', `${lat},${lng}`);
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
    const json = (await res.json()) as GoogleReverseGeocodeJson;

    const status = String(json.status || res.status);

    if (status !== 'OK') {
      await logApiToSupabase({
        trip_id: body.tripId,
        api: 'google-geocoding',
        method: 'GET',
        url: googleUrlNoKey,
        status,
        duration_ms: durationMs,
        cached: false,
        request: { lat, lng, language, client_id, ip, ua, route: 'geocode-reverse', cache: { provider: 'supabase', key: geoKey.key, hit: false } },
        response: { status, httpStatus: res.status, error_message: json.error_message },
      });

      return NextResponse.json({ error: 'google-geocoding-error', status }, { status: 502 });
    }

    const extracted = extractCityName(json);

    await upsertGeocodingCache({
      key: geoKey.key,
      lat: geoKey.lat,
      lng: geoKey.lng,
      cityName: extracted.cityName,
      resolvedFrom: extracted.resolvedFrom,
      payload: { status, cityName: extracted.cityName, resolvedFrom: extracted.resolvedFrom },
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
      request: { lat, lng, language, client_id, ip, ua, route: 'geocode-reverse', cache: { provider: 'supabase', key: geoKey.key, hit: false } },
      response: { status, httpStatus: res.status, cityName: extracted.cityName, resolvedFrom: extracted.resolvedFrom, cacheWrite: { provider: 'supabase', action: 'upsert', table: 'api_cache_geocoding', key: geoKey.key } },
    });

    return NextResponse.json({ ok: true, cached: false, result: extracted } satisfies ReverseGeocodeOk);
  } catch (err) {
    await logApiToSupabase({
      trip_id: body.tripId,
      api: 'google-geocoding',
      method: 'GET',
      url: googleUrlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { lat, lng, language, client_id, ip, ua, route: 'geocode-reverse' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
