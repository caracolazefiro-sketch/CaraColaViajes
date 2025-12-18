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

type PorteroDecision = {
  place_id?: string;
  name?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  keep: boolean;
  keepAs?: string;
  reasons: string[];
};

function isProductionHost(req: Request): boolean {
  const host = new URL(req.url).host;
  const prodHost = process.env.NEXT_PUBLIC_PROD_HOST || 'cara-cola-viajes.vercel.app';
  return host === prodHost;
}

function parseBoolEnv(raw: string | undefined | null): boolean {
  const v = String(raw || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on' || v === 'yes';
}

function resolvePorteroAudit(req: Request): {
  mode: 'off' | 'on';
  source: 'env' | 'header' | 'off';
  envValue: string | null;
} {
  const envValue = process.env.PLACES_PORTERO_AUDIT ?? null;
  const envOn = parseBoolEnv(envValue);

  // Safety: do not allow header overrides on the production host.
  if (!isProductionHost(req)) {
    const header = req.headers.get('x-caracola-portero-audit');
    if (parseBoolEnv(header)) {
      return { mode: 'on', source: 'header', envValue };
    }
  }

  if (envOn) return { mode: 'on', source: 'env', envValue };
  return { mode: 'off', source: 'off', envValue };
}

function namePreview(s: string | undefined, maxLen = 80) {
  const v = String(s || '').trim();
  if (!v) return undefined;
  return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
}

function typesPreview(types: string[] | undefined, maxLen = 8) {
  if (!Array.isArray(types)) return undefined;
  const cleaned = types.filter(Boolean);
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen);
}

function decideSupercat(supercat: Supercat, r: ServerPlace): PorteroDecision {
  const t = r.types || [];
  const name = r.name || '';
  const reasons: string[] = [];

  const id = r.place_id || '';
  if (!id) reasons.push('NO_PLACE_ID');

  if (supercat === 1) {
    const campingTag = t.includes('campground') || t.includes('rv_park');
    const parkingCamping = t.includes('parking') && /camping|area|camper|autocaravana/i.test(name);
    const esTienda = t.includes('hardware_store') || t.includes('store') || t.includes('shopping_mall');
    if (esTienda) reasons.push('EXCLUDED_STORE');
    if (!campingTag && !parkingCamping) reasons.push('NOT_CAMPING_TAG');

    const keep = id.length > 0 && (campingTag || parkingCamping) && !esTienda;
    return {
      place_id: r.place_id,
      name: namePreview(r.name),
      types: typesPreview(r.types),
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      vicinity: namePreview(r.vicinity, 110),
      keep,
      keepAs: keep ? 'camping' : undefined,
      reasons: keep ? [] : reasons,
    };
  }

  if (supercat === 2) {
    const isRestaurant = classifyRestaurant(r);
    const isSupermarket = classifySupermarket(r);
    if (!isRestaurant && !isSupermarket) reasons.push('NOT_RESTAURANT_OR_SUPERMARKET');

    const keep = id.length > 0 && (isRestaurant || isSupermarket);
    return {
      place_id: r.place_id,
      name: namePreview(r.name),
      types: typesPreview(r.types),
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      vicinity: namePreview(r.vicinity, 110),
      keep,
      keepAs: keep ? (isRestaurant ? 'restaurant' : 'supermarket') : undefined,
      reasons: keep ? [] : reasons,
    };
  }

  if (supercat === 3) {
    const isGas = classifyGas(r);
    const isLaundry = classifyLaundry(r);
    if (!isGas && !isLaundry) reasons.push('NOT_GAS_OR_LAUNDRY');

    const keep = id.length > 0 && (isGas || isLaundry);
    return {
      place_id: r.place_id,
      name: namePreview(r.name),
      types: typesPreview(r.types),
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      vicinity: namePreview(r.vicinity, 110),
      keep,
      keepAs: keep ? (isGas ? 'gas' : 'laundry') : undefined,
      reasons: keep ? [] : reasons,
    };
  }

  // supercat === 4
  const isTourism = classifyTourism(r);
  if (!isTourism) reasons.push('NOT_TOURISM');

  const keep = id.length > 0 && isTourism;
  return {
    place_id: r.place_id,
    name: namePreview(r.name),
    types: typesPreview(r.types),
    rating: r.rating,
    user_ratings_total: r.user_ratings_total,
    vicinity: namePreview(r.vicinity, 110),
    keep,
    keepAs: keep ? 'tourism' : undefined,
    reasons: keep ? [] : reasons,
  };
}

function buildPorteroAudit(params: {
  supercat: Supercat;
  results: ServerPlace[];
  maxDiscardedSample?: number;
}) {
  const maxDiscardedSample = params.maxDiscardedSample ?? 20;
  const seen = new Set<string>();
  const decisions: PorteroDecision[] = [];
  const discardedSample: Array<Pick<PorteroDecision, 'place_id' | 'name' | 'types' | 'rating' | 'user_ratings_total' | 'vicinity' | 'reasons'>> = [];
  const reasonsCount: Record<string, number> = {};
  const keptAsCount: Record<string, number> = {};

  let input = 0;
  let noPlaceId = 0;
  let dupPlaceId = 0;
  let kept = 0;
  let discarded = 0;

  for (const r of params.results) {
    input++;
    const d = decideSupercat(params.supercat, r);

    const id = d.place_id || '';
    if (!id) {
      noPlaceId++;
    } else if (seen.has(id)) {
      dupPlaceId++;
      d.keep = false;
      d.keepAs = undefined;
      d.reasons = [...(d.reasons || []), 'DUPLICATE_PLACE_ID'];
    } else {
      seen.add(id);
    }

    if (d.keep) {
      kept++;
      if (d.keepAs) keptAsCount[d.keepAs] = (keptAsCount[d.keepAs] || 0) + 1;
    } else {
      discarded++;
      for (const reason of d.reasons) reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
      if (discardedSample.length < maxDiscardedSample) {
        discardedSample.push({
          place_id: d.place_id,
          name: d.name,
          types: d.types,
          rating: d.rating,
          user_ratings_total: d.user_ratings_total,
          vicinity: d.vicinity,
          reasons: d.reasons,
        });
      }
    }

    decisions.push(d);
  }

  return {
    input,
    uniqueWithPlaceId: seen.size,
    kept,
    discarded,
    noPlaceId,
    duplicatePlaceId: dupPlaceId,
    keptAsCount,
    reasonsCount,
    discardedSample,
  };
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
// Nota: NearbySearch `keyword` NO interpreta "OR" como booleano; suele comportarse como texto.
// Para evitar ZERO_RESULTS sistemáticos en algunos países (p.ej. Alemania), preferimos `type=campground`.
const SUPERCAT_1_KEYWORD = 'camping';

// 2) Comer + Super (una sola llamada, luego se reparte)
// Nota: `keyword` no interpreta OR. Para no sesgar/romper resultados por idioma,
// hacemos NearbySearch genérico y luego clasificamos por `types`.
const SUPERCAT_2_KEYWORD = 'restaurant supermarket';

// 3) Gas + Lavar (una sola llamada, luego se reparte)
const SUPERCAT_3_KEYWORD = 'gas_station laundry';

// 4) Turismo
const SUPERCAT_4_KEYWORD = 'tourist_attraction museum park';

function buildTypesHistogram(results: ServerPlace[]) {
  const counts: Record<string, number> = {};
  for (const r of results) {
    for (const t of r.types || []) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .reduce<Record<string, number>>((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});

  const sample = results.slice(0, 12).map((r) => ({
    place_id: r.place_id,
    name: namePreview(r.name),
    types: typesPreview(r.types),
  }));

  return { top, sample };
}

async function fetchNearbyPage(params: {
  center: LatLng;
  radius: number;
  keyword?: string;
  type?: string;
  apiKey: string;
  pageToken?: string;
}) {
  const { center, radius, keyword, type, apiKey, pageToken } = params;

  const base = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const url = new URL(base);

  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken);
  } else {
    url.searchParams.set('location', `${center.lat},${center.lng}`);
    url.searchParams.set('radius', String(radius));
    if (type) url.searchParams.set('type', type);
    if (keyword) url.searchParams.set('keyword', keyword);
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

    // Query strategy (1 llamada por supercat, sin OR):
    // - Supercat 1: `type=campground` (robusto multi-idioma)
    // - Supercat 2: `keyword="restaurant supermarket"` (evita ruido totalmente genérico)
    // - Supercat 3: `keyword="gas_station laundry"`
    // - Supercat 4: `type=tourist_attraction`
    const queryType = supercat === 1 ? 'campground' : supercat === 4 ? 'tourist_attraction' : undefined;
    const queryKeyword = supercat === 2 ? SUPERCAT_2_KEYWORD : supercat === 3 ? SUPERCAT_3_KEYWORD : undefined;

    // Opción A: tope de radio por bloque/supercat (defensa también en servidor)
    const capMeters = SUPERCAT_RADIUS_CAP_METERS[supercat];
    const radius = clampRadiusMeters(Math.min(requestedRadius, capMeters));

    const porteroAuditResolved = resolvePorteroAudit(req);

    // 0) Supabase cache HIT
    const cacheKey = makePlacesSupercatCacheKey({
      supercat,
      lat: center.lat,
      lng: center.lng,
      radius,
      // v2 for all supercats so old cache rows don't stick after changing query semantics
      namespace: 'places-supercat-v2',
    });
    const cached = await getPlacesSupercatCache({ key: cacheKey.key });
    if (cached.ok && cached.hit) {
      const cachedPayload = cached.payload as unknown as {
        categories?: Record<string, unknown>;
      };
      const categories = (cachedPayload && typeof cachedPayload === 'object' ? cachedPayload.categories : undefined) as
        | Record<string, unknown>
        | undefined;
      const safeLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);
      const resultsCount =
        supercat === 1
          ? safeLen(categories?.camping)
          : supercat === 2
            ? safeLen(categories?.restaurant) + safeLen(categories?.supermarket)
            : supercat === 3
              ? safeLen(categories?.gas) + safeLen(categories?.laundry)
              : safeLen(categories?.tourism);

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
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          porteroAuditEnv: porteroAuditResolved.envValue,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key },
        },
        response: {
          status: 'CACHE_HIT_SUPABASE',
          resultsCount,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          cache: { provider: 'supabase', key: cacheKey.key, expiresAt: cached.expiresAt },
          cacheWrite: { provider: 'supabase', action: 'none' },
        },
      });

      return NextResponse.json({
        ...(cached.payload as object),
        resultsCount,
        cache: { provider: 'supabase', key: cacheKey.key, hit: true, expiresAt: cached.expiresAt },
      });
    }

    // Estrategia agresiva: 1 llamada (1 página) por supercat
    const { json, durationMs, url } = await fetchNearbyPage({
      center,
      radius,
      apiKey,
      type: queryType,
      keyword: queryKeyword,
    });
    const status = json.status || 'UNKNOWN';
    const results = (json.results || []).slice(0, 20);

    const porteroAudit =
      porteroAuditResolved.mode === 'on' ? buildPorteroAudit({ supercat, results, maxDiscardedSample: 20 }) : null;
    const inputDebug = porteroAuditResolved.mode === 'on' ? buildTypesHistogram(results) : null;

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
      query: { type: queryType ?? null, keyword: queryKeyword ?? null },
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
          query: { type: queryType ?? null, keyword: queryKeyword ?? null },
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          porteroAuditEnv: porteroAuditResolved.envValue,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: camping.length,
          totals: basePayload.totals,
          pageLogs,
          inputDebug: inputDebug ?? undefined,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          portero: porteroAudit ?? undefined,
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
          query: { type: queryType ?? null, keyword: queryKeyword ?? null },
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          porteroAuditEnv: porteroAuditResolved.envValue,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: restaurant.length + supermarket.length,
          totals: basePayload.totals,
          pageLogs,
          inputDebug: inputDebug ?? undefined,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          portero: porteroAudit ?? undefined,
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
          query: { type: queryType ?? null, keyword: queryKeyword ?? null },
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          porteroAuditEnv: porteroAuditResolved.envValue,
          cacheTtlDays: placesCacheTtlDays,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: gas.length + laundry.length,
          totals: basePayload.totals,
          pageLogs,
          inputDebug: inputDebug ?? undefined,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          portero: porteroAudit ?? undefined,
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
        query: { type: queryType ?? null, keyword: queryKeyword ?? null },
        porteroAuditMode: porteroAuditResolved.mode,
        porteroAuditSource: porteroAuditResolved.source,
        porteroAuditEnv: porteroAuditResolved.envValue,
        cacheTtlDays: placesCacheTtlDays,
        cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
      },
      response: {
        status,
        resultsCount: tourism.length,
        totals: basePayload.totals,
        pageLogs,
        inputDebug: inputDebug ?? undefined,
        porteroAuditMode: porteroAuditResolved.mode,
        porteroAuditSource: porteroAuditResolved.source,
        portero: porteroAudit ?? undefined,
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
