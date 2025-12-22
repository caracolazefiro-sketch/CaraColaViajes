import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { logApiToSupabase } from '../../../utils/server-logs';
import { supabaseServer } from '../../../utils/supabase-server';

type GooglePlacesAutocompleteJson = {
  status?: string;
  error_message?: string;
  predictions?: Array<{
    description?: string;
    place_id?: string;
    types?: unknown;
  }>;
};

type PlacesAutocompleteResponse = {
  ok: true;
  cached: false;
  predictions: Array<{ description: string; place_id?: string; types?: string[] }>;
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

async function getAuthUserIdFromBearer(req: Request): Promise<string | undefined> {
  try {
    if (!supabaseServer) return undefined;
    const auth = req.headers.get('authorization') || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    if (!token) return undefined;
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error) return undefined;
    return data?.user?.id || undefined;
  } catch {
    return undefined;
  }
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

export async function GET(req: Request) {
  const startedAt = Date.now();

  const url = new URL(req.url);
  const input = String(url.searchParams.get('input') || '').trim();
  const language = String(url.searchParams.get('language') || 'es').trim() || 'es';

  if (!input) return NextResponse.json({ error: 'missing-input' }, { status: 400 });

  const user_id = await getAuthUserIdFromBearer(req);
  if (!user_id) {
    return NextResponse.json({ ok: false, reason: 'auth-required' }, { status: 401 });
  }

  const client_id = getClientId(req);
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || undefined;

  const rl = await isRateLimited({
    api: 'google-places',
    routeTag: 'places-autocomplete',
    clientId: client_id,
    ip,
    limitPerMinute: 60,
  });

  if (rl.limited) {
    await logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: 'caracola:/api/google/places-autocomplete',
      status: 'RATE_LIMITED',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { user_id, input, language, client_id, ip, ua, route: 'places-autocomplete' },
      response: { error: 'rate-limited', reason: rl.reason },
    });

    return NextResponse.json({ error: 'rate-limited', reason: rl.reason }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: 'caracola:/api/google/places-autocomplete',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { user_id, input, language, client_id, ip, ua, route: 'places-autocomplete' },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  googleUrl.searchParams.set('input', input);
  googleUrl.searchParams.set('language', language);
  // We only need place suggestions for trip planning; keep it strict.
  googleUrl.searchParams.set('types', 'geocode');
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

    const json = (await res.json()) as GooglePlacesAutocompleteJson;
    const status = String(json.status || res.status);

    const rawPredictions = Array.isArray(json.predictions) ? json.predictions : [];
    const predictions = rawPredictions
      .map((p) => ({
        description: typeof p.description === 'string' ? p.description.trim() : '',
        place_id: typeof p.place_id === 'string' ? p.place_id : undefined,
        types: Array.isArray(p.types) ? p.types.map(String) : undefined,
      }))
      .filter((p) => p.description);

    await logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status,
      duration_ms: durationMs,
      cached: false,
      request: { user_id, input, language, client_id, ip, ua, route: 'places-autocomplete' },
      response: {
        status,
        httpStatus: res.status,
        predictionsCount: predictions.length,
        error_message: json.error_message,
      },
    });

    if (status !== 'OK' && status !== 'ZERO_RESULTS') {
      return NextResponse.json({ error: 'google-places-error', status }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      cached: false,
      predictions,
    } satisfies PlacesAutocompleteResponse);
  } catch (err) {
    await logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { user_id, input, language, client_id, ip, ua, route: 'places-autocomplete' },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
