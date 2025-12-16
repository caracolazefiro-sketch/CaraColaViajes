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

type Supercat = 1 | 2;

type PlacesSupercatRequest = {
  tripId?: string;
  tripName?: string;
  center: LatLng;
  radius?: number;
  supercat: Supercat;
};

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

const SUPERCAT_1_KEYWORD =
  'camping OR "área de autocaravanas" OR "RV park" OR "motorhome area" OR pernocta OR restaurante OR restaurant OR "fast food" OR comida OR supermercado OR supermarket OR "grocery store"';

const SUPERCAT_2_KEYWORD =
  'gas OR gas_station OR laundry OR "self-service laundry" OR "self service laundry" OR "lavandería autoservicio" OR museum OR park OR tourist_attraction';

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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, reason: 'no-google-key' }, { status: 500 });
    }

    const body = (await req.json()) as Partial<PlacesSupercatRequest>;
    const supercat = body.supercat;
    const center = body.center;
    const tripId = body.tripId;
    const tripName = body.tripName;
    const radius = typeof body.radius === 'number' && Number.isFinite(body.radius) ? body.radius : 20000;

    if (!supercat || (supercat !== 1 && supercat !== 2)) {
      return NextResponse.json({ ok: false, reason: 'invalid-supercat' }, { status: 400 });
    }
    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
      return NextResponse.json({ ok: false, reason: 'invalid-center' }, { status: 400 });
    }

    const keyword = supercat === 1 ? SUPERCAT_1_KEYWORD : SUPERCAT_2_KEYWORD;

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
          keyword,
          cache: { provider: 'supabase', key: cacheKey.key },
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

    const allResults: ServerPlace[] = [];
    const pageLogs: Array<{ status: string; resultsCount: number; durationMs: number; nextPageToken?: string | null }> = [];

    let nextToken: string | undefined = undefined;
    let pages = 0;
    const maxPages = 3; // 3*20 = 60

    while (pages < maxPages) {
      if (nextToken) {
        // Google requiere un pequeño delay para que el token sea válido
        await new Promise((r) => setTimeout(r, 1200));
      }

      const { json, durationMs, url } = await fetchNearbyPage({ center, radius, keyword, apiKey, pageToken: nextToken });
      pages++;

      const status = json.status || 'UNKNOWN';
      const results = json.results || [];
      allResults.push(...results);

      const redactedUrl = redactGoogleKey(url);
      const next = json.next_page_token || null;
      pageLogs.push({ status, resultsCount: results.length, durationMs, nextPageToken: next });

      // Log por página en Supabase
      await logApiToSupabase({
        trip_id: tripId,
        api: 'google-places',
        method: 'GET',
        url: redactedUrl,
        status,
        duration_ms: durationMs,
        cost: 0.003,
        cached: false,
        request: {
          tripName,
          supercat,
          center,
          radius,
          keyword,
          page: pages,
          hasPageToken: Boolean(nextToken),
        },
        response: {
          status,
          resultsCount: results.length,
          nextPageToken: next,
          error_message: json.error_message,
          cache: { provider: 'supabase', key: cacheKey.key, hit: false },
        },
      });

      if (status !== 'OK' || !json.next_page_token) {
        break;
      }
      nextToken = json.next_page_token;

      // Corte duro por tamaño
      if (allResults.length >= 60) {
        break;
      }
    }

    const resultsTrimmed = allResults.slice(0, 60);

    // Build the aggregated payload (same shape as response)
    const basePayload = {
      ok: true,
      supercat,
      center,
      radius,
      totals: {
        pages,
        totalResults: resultsTrimmed.length,
      },
      pageLogs,
    };

    if (supercat === 1) {
      const camping = uniqByPlaceId(resultsTrimmed.filter(classifyCamping));
      const restaurant = uniqByPlaceId(resultsTrimmed.filter(classifyRestaurant));
      const supermarket = uniqByPlaceId(resultsTrimmed.filter(classifySupermarket));

      const payload = {
        ...basePayload,
        categories: { camping, restaurant, supermarket },
      };

      const up = await upsertPlacesSupercatCache({
        key: cacheKey.key,
        supercat,
        centerLat: cacheKey.lat,
        centerLng: cacheKey.lng,
        radius: cacheKey.radius,
        payload,
        ttlDays: 7,
      });
      if (up.ok) {
        await logApiToSupabase({
          trip_id: tripId,
          api: 'other',
          method: 'POST',
          url: 'supabase:api_cache_places_supercat',
          status: 'SUPABASE_CACHE_UPSERT',
          duration_ms: 0,
          cost: 0,
          cached: true,
          request: { cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key } },
          response: { ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays },
        });
      }

      return NextResponse.json({
        ...payload,
        cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
      });
    }

    const gas = uniqByPlaceId(resultsTrimmed.filter(classifyGas));
    const laundry = uniqByPlaceId(resultsTrimmed.filter(classifyLaundry));
    const tourism = uniqByPlaceId(resultsTrimmed.filter(classifyTourism));

    const payload = {
      ...basePayload,
      categories: { gas, laundry, tourism },
    };

    const up = await upsertPlacesSupercatCache({
      key: cacheKey.key,
      supercat,
      centerLat: cacheKey.lat,
      centerLng: cacheKey.lng,
      radius: cacheKey.radius,
      payload,
      ttlDays: 7,
    });
    if (up.ok) {
      await logApiToSupabase({
        trip_id: tripId,
        api: 'other',
        method: 'POST',
        url: 'supabase:api_cache_places_supercat',
        status: 'SUPABASE_CACHE_UPSERT',
        duration_ms: 0,
        cost: 0,
        cached: true,
        request: { cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key } },
        response: { ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays },
      });
    }

    return NextResponse.json({
      ...payload,
      cache: { provider: 'supabase', key: cacheKey.key, hit: false, write: up.ok ? 'upsert' : 'skipped' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}
