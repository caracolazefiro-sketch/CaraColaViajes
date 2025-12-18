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
  // Optional extra info (non-Google sources)
  note?: string;
  link?: string;
};

type PlacesNearbyResponse = {
  status: string;
  results?: ServerPlace[];
  next_page_token?: string;
  error_message?: string;
};

type NewPlacesNearbyPlace = {
  id?: string;
  name?: string; // resource name: places/PLACE_ID
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
};

type NewPlacesNearbyResponse = {
  places?: NewPlacesNearbyPlace[];
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
  return t.includes('laundry') && !t.includes('lodging') && !t.includes('dry_cleaner');
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

function haversineDistanceM(a: LatLng, b: LatLng) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const x = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// MVP: single AreasAC sample entry so we can validate the UX before importing the full dataset.
const AREASAC_SAMPLE_LEZUZA = {
  id: 'areasac-es-albacete-lezuza-area-de-lezuza',
  province: 'ALBACETE',
  municipality: 'Lezuza',
  name: 'Área de Lezuza',
  // In the PDF this line ends with: "-2,35389 38,94778" (lng lat)
  lat: 38.94778,
  lng: -2.35389,
  tags: {
    type: 'PU',
    flags: { openAllYear: true, free: true },
    // Keep raw service codes for v1; we can map to human labels once we confirm the legend.
    codes: ['PN', 'AL', 'AG', 'AN', 'PI', 'JU', 'RT', 'SM'],
  },
} as const;

function maybeAddAreasAcSamples(params: { supercat: Supercat; center: LatLng; radius: number; results: ServerPlace[] }) {
  if (params.supercat !== 1) return params.results;

  const dist = haversineDistanceM(params.center, { lat: AREASAC_SAMPLE_LEZUZA.lat, lng: AREASAC_SAMPLE_LEZUZA.lng });
  if (dist > params.radius) return params.results;

  const noteParts: string[] = [];
  noteParts.push(`ÁreasAC (${AREASAC_SAMPLE_LEZUZA.tags.type})`);
  if (AREASAC_SAMPLE_LEZUZA.tags.flags.free) noteParts.push('Gratis');
  if (AREASAC_SAMPLE_LEZUZA.tags.flags.openAllYear) noteParts.push('Todo el año');
  if (AREASAC_SAMPLE_LEZUZA.tags.codes.length) noteParts.push(`Servicios: ${AREASAC_SAMPLE_LEZUZA.tags.codes.join(', ')}`);

  const samplePlace: ServerPlace = {
    place_id: `areasac:${AREASAC_SAMPLE_LEZUZA.id}`,
    name: AREASAC_SAMPLE_LEZUZA.name,
    vicinity: `${AREASAC_SAMPLE_LEZUZA.municipality}, ${AREASAC_SAMPLE_LEZUZA.province}`,
    geometry: { location: { lat: AREASAC_SAMPLE_LEZUZA.lat, lng: AREASAC_SAMPLE_LEZUZA.lng } },
    // Ensure it passes the camping classifier (server + client)
    types: ['rv_park'],
    note: noteParts.join(' · '),
    link: `https://www.google.com/maps?q=${AREASAC_SAMPLE_LEZUZA.lat},${AREASAC_SAMPLE_LEZUZA.lng}`,
  };

  return uniqByPlaceId([...params.results, samplePlace]);
}

// Estrategia agresiva (control de coste): 1 llamada por bloque (máx 20 resultados)
// 1) Spots (dormir)
// Nota: NearbySearch `keyword` NO interpreta "OR" como booleano; suele comportarse como texto.
// Queremos incluir tanto campings (campground) como áreas de autocaravanas / RV parks.
// Usamos un keyword multi-idioma (sin OR) y filtramos por `types` con Portero.
const SUPERCAT_1_KEYWORD = 'camping camper motorhome autocaravana rv park stellplatz';

// 2) Comer + Super (una sola llamada, luego se reparte)
// Nota: `keyword` no interpreta OR. Para no sesgar/romper resultados por idioma,
// hacemos NearbySearch genérico y luego clasificamos por `types`.
const SUPERCAT_2_KEYWORD = 'restaurant supermarket';

// 3) Gas + Lavar (una sola llamada, luego se reparte)
// Evitar "tintorerías" (dry_cleaner): sesgo a laundromat / autoservicio.
const SUPERCAT_3_KEYWORD = 'gas station laundromat self service';

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

function toServerPlaceFromNew(p: NewPlacesNearbyPlace): ServerPlace {
  const placeId =
    p.id ||
    (typeof p.name === 'string' && p.name.includes('/') ? p.name.split('/').pop() : undefined);

  const lat = p.location?.latitude;
  const lng = p.location?.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  return {
    name: p.displayName?.text,
    place_id: placeId,
    types: Array.isArray(p.types) ? p.types : undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    user_ratings_total: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
    vicinity: p.shortFormattedAddress || p.formattedAddress,
    geometry: hasCoords ? { location: { lat: lat as number, lng: lng as number } } : undefined,
    // Note: Photos from Places API (New) are not compatible with legacy `photo_reference`.
  };
}

async function fetchNearbyNew(params: {
  center: LatLng;
  radius: number;
  includedTypes: string[];
  apiKey: string;
  maxResultCount?: number;
}) {
  const { center, radius, includedTypes, apiKey } = params;
  const maxResultCount = Math.max(1, Math.min(20, Math.round(params.maxResultCount ?? 20)));

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes,
    maxResultCount,
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radius,
      },
    },
  };

  const start = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as NewPlacesNearbyResponse;
  const duration = performance.now() - start;

  if (!res.ok) {
    return {
      ok: false as const,
      status: `HTTP_${res.status}`,
      durationMs: Math.round(duration),
      url,
      json,
    };
  }

  return {
    ok: true as const,
    status: 'OK',
    durationMs: Math.round(duration),
    url,
    json,
  };
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

    // Query strategy (cost-control):
    // - Supercat 1: 1 llamada usando Places API (New) Nearby Search con `includedTypes`
    //   (campground + rv_park) para no depender de `keyword` multi-palabra.
    // - Supercat 2: `keyword="restaurant supermarket"`
    // - Supercat 3: `keyword="gas station laundromat self service"`
    // - Supercat 4: `type=tourist_attraction`
    const queryType = supercat === 4 ? 'tourist_attraction' : undefined;
    const queryKeyword =
      supercat === 2
          ? SUPERCAT_2_KEYWORD
          : supercat === 3
            ? SUPERCAT_3_KEYWORD
            : undefined;

    const queryInfo =
      supercat === 1
        ? { provider: 'places-new', includedTypes: ['campground', 'rv_park'], keyword: null }
        : { provider: 'places-legacy', type: queryType ?? null, keyword: queryKeyword ?? null };

    // Opción A: tope de radio por bloque/supercat (defensa también en servidor)
    const capMeters = SUPERCAT_RADIUS_CAP_METERS[supercat];
    const radius = clampRadiusMeters(Math.min(requestedRadius, capMeters));

    const porteroAuditResolved = resolvePorteroAudit(req);

    // 0) Supabase cache HIT
    // Bump supercat=1 cache namespace when query semantics change.
    // v6: includes AreasAC (non-Google) sample injection.
    const cacheNamespace = supercat === 1 ? 'places-supercat-v6' : supercat === 3 ? 'places-supercat-v3' : 'places-supercat-v2';
    const cacheKey = makePlacesSupercatCacheKey({
      supercat,
      lat: center.lat,
      lng: center.lng,
      radius,
      // bump version where query semantics changed
      namespace: cacheNamespace,
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
          query: queryInfo,
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

    const GOOGLE_PLACES_CALL_COST = 0.032;

    let status = 'UNKNOWN';
    let results: ServerPlace[] = [];
    let pageLogs: Array<{ status: string; resultsCount: number; durationMs: number; nextPageToken?: string | null; url?: string }> = [];
    let firstPageUrl = '';
    let pages = 1;
    let totalDurationMs = 0;
    let googleCalls = 0;

    if (supercat === 1) {
      const p = await fetchNearbyNew({ center, radius, apiKey, includedTypes: ['campground', 'rv_park'], maxResultCount: 20 });
      googleCalls = 1;
      pages = 1;

      status = p.status;
      const raw = (p.ok ? (p.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);
      results = raw;
      totalDurationMs = p.durationMs;
      firstPageUrl = p.url;
      pageLogs = [{ status, resultsCount: results.length, durationMs: p.durationMs, nextPageToken: null, url: p.url }];
    } else {
      const p = await fetchNearbyPage({ center, radius, apiKey, type: queryType, keyword: queryKeyword });
      googleCalls = 1;
      pages = 1;
      status = p.json.status || 'UNKNOWN';
      results = (p.json.results || []).slice(0, 20);
      totalDurationMs = p.durationMs;
      firstPageUrl = redactGoogleKey(p.url);
      pageLogs = [
        { status, resultsCount: results.length, durationMs: p.durationMs, nextPageToken: p.json.next_page_token || null, url: redactGoogleKey(p.url) },
      ];
    }

    // Dedup defensivo (supercat=1 puede traer duplicados)
    results = uniqByPlaceId(results);
    // MVP: inject one AreasAC sample if it falls within radius
    results = maybeAddAreasAcSamples({ supercat, center, radius, results });

    const porteroAudit =
      porteroAuditResolved.mode === 'on' ? buildPorteroAudit({ supercat, results, maxDiscardedSample: 20 }) : null;
    const inputDebug = porteroAuditResolved.mode === 'on' ? buildTypesHistogram(results) : null;

    const basePayload = {
      ok: true,
      supercat,
      center,
      radius,
      requestedRadius,
      radiusCapMeters: capMeters,
      query: queryInfo,
      totals: {
        pages,
        totalResults: results.length,
      },
      pageLogs,
    };

    if (supercat === 1) {
      const camping = uniqByPlaceId(results.filter(classifyCamping)).slice(0, 20);
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
        cost: GOOGLE_PLACES_CALL_COST * googleCalls,
        cached: false,
        request: {
          tripName,
          supercat,
          center,
          radius,
          keyword,
          query: queryInfo,
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
        cost: GOOGLE_PLACES_CALL_COST * googleCalls,
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
        cost: GOOGLE_PLACES_CALL_COST * googleCalls,
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
      cost: GOOGLE_PLACES_CALL_COST * googleCalls,
      cached: false,
      request: {
        tripName,
        supercat,
        center,
        radius,
        keyword,
        query: queryInfo,
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
