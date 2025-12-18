import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../utils/server-logs';
import {
  getPlacesSupercatCache,
  makePlacesSupercatCacheKey,
  upsertPlacesSupercatCache,
} from '../../utils/supabase-cache';

type LatLng = { lat: number; lng: number };

type ServerPlace = {
  name?: string;
  place_id?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  geometry?: { location: { lat: number; lng: number } };
  photos?: Array<{ photo_reference?: string }>;
};

type PlacesNearbyResponse = {
  status: string;
  results?: ServerPlace[];
  next_page_token?: string;
  error_message?: string;
};

type Supercat = 1 | 2 | 3 | 4;

type PlacesSupercatRequest = {
  tripId?: string;
  tripName?: string;
  center: LatLng;
  radius?: number;
  supercat: Supercat;
};

function getPlacesSupercatCacheTtlDays() {
  const raw = process.env.PLACES_SUPERCAT_CACHE_TTL_DAYS;
  const parsed = raw != null ? Number.parseInt(raw, 10) : NaN;
  // Default: 90 días. Límites defensivos para evitar valores absurdos.
  if (!Number.isFinite(parsed)) return 90;
  return Math.max(1, Math.min(365, parsed));
}

const SUPERCAT_RADIUS_CAP_METERS: Record<Supercat, number> = {
  1: 25_000,
  2: 8_000,
  3: 12_000,
  4: 15_000,
};

function clampRadiusMeters(input: number) {
  const safe = Number.isFinite(input) ? input : 20_000;
  return Math.max(1000, Math.min(50_000, Math.round(safe)));
}

function redactGoogleKey(url: string) {
  return url.replace(/([?&]key=)([^&]+)/i, '$1REDACTED');
}

function classifyCamping(r: ServerPlace) {
  const t = r.types || [];
  const name = r.name || '';
  const campingTag = t.includes('campground') || t.includes('rv_park');
  const parkingCamping = t.includes('parking') && /camping|area|camper|autocaravana/i.test(name);
  const esTienda = t.includes('hardware_store') || t.includes('store') || t.includes('shopping_mall');
  return (campingTag || parkingCamping) && !esTienda;
}

function classifyRestaurant(r: ServerPlace) {
  const t = r.types || [];
  return t.includes('restaurant') || t.includes('cafe') || t.includes('food') || t.includes('meal_takeaway');
}

function classifySupermarket(r: ServerPlace) {
  const t = r.types || [];
  return t.includes('supermarket') || t.includes('grocery_or_supermarket') || t.includes('grocery_store');
}

function classifyGas(r: ServerPlace) {
  const t = r.types || [];
  return t.includes('gas_station');
}

function classifyLaundry(r: ServerPlace) {
  const t = r.types || [];
  return t.includes('laundry') && !t.includes('lodging');
}

function classifyTourism(r: ServerPlace) {
  const t = r.types || [];
  const esLaundry = t.includes('laundry') && !t.includes('lodging');
  if (esLaundry) return false;
  return t.includes('tourist_attraction') || t.includes('museum') || t.includes('park') || t.includes('point_of_interest');
}

function uniqByPlaceId(arr: ServerPlace[]) {
  const seen = new Set<string>();
  const out: ServerPlace[] = [];
  for (const p of arr) {
    const id = p.place_id || '';
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(p);
  }
  return out;
}

// Estrategia agresiva (control de coste): 1 llamada por bloque (máx 20 resultados)
// 1) Spots (dormir)
const SUPERCAT_1_KEYWORD =
  'camping OR "área de autocaravanas" OR "RV park" OR "motorhome area" OR pernocta OR "area camper" OR "área camper"';

// 2) Comer + Super (una sola llamada, luego se reparte)
const SUPERCAT_2_KEYWORD =
  'restaurant OR restaurante OR bar OR "fast food" OR comida OR cafe OR cafetería OR cafeteria OR pizzeria OR hamburguesería OR hamburger OR tapas OR asador OR mesón OR meson OR supermarket OR supermercado OR "grocery store" OR groceries OR "tienda de alimentación" OR alimentacion OR alimentación';

// 3) Gas + Lavar (una sola llamada, luego se reparte)
const SUPERCAT_3_KEYWORD =
  'gas OR gas_station OR "petrol station" OR "service station" OR laundry OR "self-service laundry" OR "self service laundry" OR "lavandería autoservicio"';

// 4) Turismo
const SUPERCAT_4_KEYWORD =
  'tourist_attraction OR museum OR park OR monument OR landmark OR viewpoint OR mirador';

async function fetchNearbyPage(params: {
  center: LatLng;
  radius: number;
  keyword: string;
  apiKey: string;
  pageToken?: string;
}) {
  const { center, radius, keyword, apiKey, pageToken } = params;

  const base = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const url = new URL(base);

  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken);
  } else {
    url.searchParams.set('location', `${center.lat},${center.lng}`);
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('keyword', keyword);
  }
  url.searchParams.set('key', apiKey);

  const start = performance.now();
  const res = await fetch(url.toString());
  const json = (await res.json()) as PlacesNearbyResponse;
  const duration = performance.now() - start;

  return { json, durationMs: Math.round(duration), url: url.toString() };
}

// Nota: se elimina paginación intencionalmente (1 llamada por supercat)

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, reason: 'no-google-key' }, { status: 500 });
    }

    const placesCacheTtlDays = getPlacesSupercatCacheTtlDays();

    const body = (await req.json()) as Partial<PlacesSupercatRequest>;
    const supercat = body.supercat;
    const center = body.center;
    const tripId = body.tripId;
    const tripName = body.tripName;
    const requestedRadius = typeof body.radius === 'number' && Number.isFinite(body.radius) ? body.radius : 20000;

    if (!supercat || (supercat !== 1 && supercat !== 2 && supercat !== 3 && supercat !== 4)) {
      return NextResponse.json({ ok: false, reason: 'invalid-supercat' }, { status: 400 });
    }
    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
      return NextResponse.json({ ok: false, reason: 'invalid-center' }, { status: 400 });
    }

    const keyword =
      supercat === 1
        ? SUPERCAT_1_KEYWORD
        : supercat === 2
          ? SUPERCAT_2_KEYWORD
          : supercat === 3
            ? SUPERCAT_3_KEYWORD
            : SUPERCAT_4_KEYWORD;

    // Opción A: tope de radio por bloque/supercat (defensa también en servidor)
    const capMeters = SUPERCAT_RADIUS_CAP_METERS[supercat];
    const radius = clampRadiusMeters(Math.min(requestedRadius, capMeters));

    // 0) Supabase cache HIT
    const cacheKey = makePlacesSupercatCacheKey({
      supercat,
      lat: center.lat,
      lng: center.lng,
      radius,
    });
    const cached = await getPlacesSupercatCache({ key: cacheKey.key });
    if (cached.ok && cached.hit) {
      // Log single HIT (cost 0)
      await logApiToSupabase({
        trip_id: tripId,
        api: 'google-places',
        method: 'GET',
        url: 'supabase:api_cache_places_supercat',
        status: 'CACHE_HIT_SUPABASE',
        duration_ms: 0,
        cost: 0,
        cached: true,
        request: {
          tripName,
          supercat,
          center,
          radius,
          requestedRadius,
          radiusCapMeters: capMeters,
          keyword,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key },
        },
        response: {
          status: 'CACHE_HIT_SUPABASE',
          cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt },
          cacheWrite: { provider: 'supabase', action: 'none' },
        },
      });

      return NextResponse.json({
        ...(cached.payload as object),
        cache: { provider: 'supabase', key: cacheKey.key, hit: true, expiresAt: cached.expiresAt },
      });
    }

    // Estrategia agresiva: 1 llamada (1 página) por supercat
    const { json, durationMs, url } = await fetchNearbyPage({ center, radius, keyword, apiKey });
    const status = json.status || 'UNKNOWN';
    const results = (json.results || []).slice(0, 20);

    const pageLogs: Array<{ status: string; resultsCount: number; durationMs: number; nextPageToken?: string | null; url?: string }> = [
      { status, resultsCount: results.length, durationMs, nextPageToken: json.next_page_token || null, url: redactGoogleKey(url) },
    ];
    const firstPageUrl = redactGoogleKey(url);
    const pages = 1;
    const totalDurationMs = durationMs;

    const basePayload = {
      ok: true,
      supercat,
      center,
      radius,
      requestedRadius,
      radiusCapMeters: capMeters,
      totals: {
        pages,
        totalResults: results.length,
      },
      pageLogs,
    };

    if (supercat === 1) {
      const camping = uniqByPlaceId(results.filter(classifyCamping));
      const payload = { ...basePayload, categories: { camping } };

      const up = await upsertPlacesSupercatCache({
        key: cacheKey.key,
        supercat,
        centerLat: cacheKey.lat,
        centerLng: cacheKey.lng,
        radius: cacheKey.radius,
        payload,
        ttlDays: placesCacheTtlDays,
      });

      const cacheWrite = up.ok
        ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
        : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason };

      await logApiToSupabase({
        trip_id: tripId,
        api: 'google-places',
        method: 'GET',
        url: firstPageUrl,
        status: status,
        duration_ms: totalDurationMs,
        cost: 0.032,
        cached: false,
        request: {
          tripName,
          supercat,
          center,
          radius,
          keyword,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: camping.length,
          totals: basePayload.totals,
          pageLogs,
          cache: { provider: 'supabase', key: cacheKey.key, hit: false },
          cacheWrite,
        },
      });

      return NextResponse.json({
        ...payload,
        cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
      });
    }

    if (supercat === 2) {
      const restaurant = uniqByPlaceId(results.filter(classifyRestaurant));
      const supermarket = uniqByPlaceId(results.filter(classifySupermarket));
      const payload = { ...basePayload, categories: { restaurant, supermarket } };

      const up = await upsertPlacesSupercatCache({
        key: cacheKey.key,
        supercat,
        centerLat: cacheKey.lat,
        centerLng: cacheKey.lng,
        radius: cacheKey.radius,
        payload,
        ttlDays: placesCacheTtlDays,
      });
      const cacheWrite = up.ok
        ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
        : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason };

      await logApiToSupabase({
        trip_id: tripId,
        api: 'google-places',
        method: 'GET',
        url: firstPageUrl,
        status,
        duration_ms: totalDurationMs,
        cost: 0.032,
        cached: false,
        request: {
          tripName,
          supercat,
          center,
          radius,
          keyword,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: restaurant.length + supermarket.length,
          totals: basePayload.totals,
          pageLogs,
          cache: { provider: 'supabase', key: cacheKey.key, hit: false },
          cacheWrite,
        },
      });

      return NextResponse.json({
        ...payload,
        cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
      });
    }

    if (supercat === 3) {
      const gas = uniqByPlaceId(results.filter(classifyGas));
      const laundry = uniqByPlaceId(results.filter(classifyLaundry));
      const payload = { ...basePayload, categories: { gas, laundry } };

      const up = await upsertPlacesSupercatCache({
        key: cacheKey.key,
        supercat,
        centerLat: cacheKey.lat,
        centerLng: cacheKey.lng,
        radius: cacheKey.radius,
        payload,
        ttlDays: placesCacheTtlDays,
      });
      const cacheWrite = up.ok
        ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
        : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason };

      await logApiToSupabase({
        trip_id: tripId,
        api: 'google-places',
        method: 'GET',
        url: firstPageUrl,
        status,
        duration_ms: totalDurationMs,
        cost: 0.032,
        cached: false,
        request: {
          tripName,
          supercat,
          center,
          radius,
          keyword,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: gas.length + laundry.length,
          totals: basePayload.totals,
          pageLogs,
          cache: { provider: 'supabase', key: cacheKey.key, hit: false },
          cacheWrite,
        },
      });

      return NextResponse.json({
        ...payload,
        cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
      });
    }

    // supercat === 4
    const tourism = uniqByPlaceId(results.filter(classifyTourism));
    const payload = { ...basePayload, categories: { tourism } };

    const up = await upsertPlacesSupercatCache({
      key: cacheKey.key,
      supercat,
      centerLat: cacheKey.lat,
      centerLng: cacheKey.lng,
      radius: cacheKey.radius,
      payload,
      ttlDays: placesCacheTtlDays,
    });
    const cacheWrite = up.ok
      ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
      : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason };

    await logApiToSupabase({
      trip_id: tripId,
      api: 'google-places',
      method: 'GET',
      url: firstPageUrl,
      status,
      duration_ms: totalDurationMs,
      cost: 0.032,
      cached: false,
      request: {
        tripName,
        supercat,
        center,
        radius,
        keyword,
        cacheTtlDays: placesCacheTtlDays,
        cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
      },
      response: {
        status,
        resultsCount: tourism.length,
        totals: basePayload.totals,
        pageLogs,
        cache: { provider: 'supabase', key: cacheKey.key, hit: false },
        cacheWrite,
      },
    });

    return NextResponse.json({
      ...payload,
      cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}
