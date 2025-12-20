import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import fs from 'node:fs/promises';
import path from 'node:path';

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
  // Places API (New) photo resource name (client builds URL)
  photoName?: string;
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
  photos?: Array<{ name?: string }>;
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

function readResultsCountFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const p = payload as { resultsCount?: unknown; totals?: unknown };
  if (typeof p.resultsCount === 'number') return p.resultsCount;

  const totals = p.totals;
  if (!totals || typeof totals !== 'object') return undefined;
  const t = totals as { totalResults?: unknown };
  return typeof t.totalResults === 'number' ? t.totalResults : undefined;
}

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
  if (!t.includes('laundry')) return false;
  if (t.includes('lodging')) return false;
  // Exclude dry cleaners / "tintorerías".
  if (t.includes('dry_cleaner')) return false;

  const name = String(r.name || '').toLowerCase();
  if (/tintorer/.test(name)) return false;
  if (/limpieza\s+en\s+seco|\bseco\b|dry\s*clean/.test(name)) return false;

  return true;
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

type AreasAcEntry = {
  id: string;
  province?: string;
  municipality?: string;
  name?: string;
  rawTags?: string;
  tags?: {
    type?: string;
    flags?: {
      openAllYear?: boolean;
      paid?: boolean;
      free?: boolean;
      warning?: boolean;
    };
    codes?: string[];
  };
  coordinates?: { lat: number; lng: number };
};

let AREASAC_DATASET: AreasAcEntry[] | null = null;
let AREASAC_DATASET_LOAD_ERROR: string | null = null;

async function loadAreasAcDataset(): Promise<AreasAcEntry[]> {
  if (AREASAC_DATASET) return AREASAC_DATASET;
  if (AREASAC_DATASET_LOAD_ERROR) return [];

  try {
    const filePath = path.join(process.cwd(), 'data', 'areasac-espana-20210630.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      AREASAC_DATASET_LOAD_ERROR = 'areasac-json-not-array';
      return [];
    }
    AREASAC_DATASET = parsed as AreasAcEntry[];
    return AREASAC_DATASET;
  } catch (e) {
    AREASAC_DATASET_LOAD_ERROR = e instanceof Error ? e.message : 'unknown';
    return [];
  }
}

function toAreasAcServerPlace(entry: AreasAcEntry): ServerPlace | null {
  const loc = entry.coordinates;
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;

  const type = (entry.tags?.type || '').toUpperCase();
  const flags = entry.tags?.flags;
  const codes = (entry.tags?.codes || []).map((c) => (c || '').toUpperCase()).filter(Boolean);

  const noteParts: string[] = [];
  noteParts.push(`ÁreasAC${type ? ` (${type})` : ''}`);
  if (flags?.free) noteParts.push('Gratis');
  else if (flags?.paid) noteParts.push('Pago');
  if (flags?.openAllYear) noteParts.push('Todo el año');
  if (flags?.warning) noteParts.push('Aviso');
  if (codes.length) noteParts.push(`Servicios: ${codes.join(', ')}`);

  const province = (entry.province || '').trim();
  const municipality = (entry.municipality || '').trim();
  const vicinity = [municipality, province].filter(Boolean).join(', ') || undefined;

  return {
    place_id: `areasac:${entry.id}`,
    name: (entry.name || '').trim() || 'Área (ÁreasAC)',
    vicinity,
    geometry: { location: { lat: loc.lat, lng: loc.lng } },
    // Ensure it passes the camping classifier (server + client)
    types: ['rv_park'],
    note: noteParts.join(' · '),
    link: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`,
  };
}

async function getAreasAcNearby(params: { center: LatLng; radius: number; maxResults: number }): Promise<ServerPlace[]> {
  const dataset = await loadAreasAcDataset();
  if (!dataset.length) return [];

  const out: Array<{ place: ServerPlace; distM: number }> = [];
  for (const entry of dataset) {
    const loc = entry.coordinates;
    if (!loc) continue;
    const distM = haversineDistanceM(params.center, { lat: loc.lat, lng: loc.lng });
    if (distM > params.radius) continue;

    const place = toAreasAcServerPlace(entry);
    if (!place) continue;
    out.push({ place, distM });
  }

  out.sort((a, b) => a.distM - b.distM);
  return uniqByPlaceId(out.slice(0, Math.max(0, params.maxResults)).map((x) => x.place));
}

// Estrategia agresiva (control de coste): 1 llamada por bloque (máx 20 resultados)
// 1) Spots (dormir)
// Nota: NearbySearch `keyword` NO interpreta "OR" como booleano; suele comportarse como texto.
// Queremos incluir tanto campings (campground) como áreas de autocaravanas / RV parks.
// Usamos un keyword multi-idioma (sin OR) y filtramos por `types` con Portero.
const SUPERCAT_1_KEYWORD = 'camping camper motorhome autocaravana rv park stellplatz';

// 2) Comer + Super (DOS llamadas: una por categoría)
// Motivo: mejora calidad (ranking/popularidad) al separar restaurantes y supermercados.
const SUPERCAT_2_RESTAURANT_INCLUDED_TYPES = ['restaurant'] as const;
// Nota: set conservador para “super” (a veces viene como grocery_store).
const SUPERCAT_2_SUPERMARKET_INCLUDED_TYPES = ['supermarket', 'grocery_store'] as const;

// 3) Gas + Lavar (DOS llamadas: una por categoría)
// Motivo: mejora calidad (ranking) al separar gasolineras y lavanderías.
// Nota: evitamos `dry_cleaner` a propósito (sesgo a lavanderías autoservicio).
const SUPERCAT_3_GAS_INCLUDED_TYPES = ['gas_station'] as const;
const SUPERCAT_3_LAUNDRY_INCLUDED_TYPES = ['laundry'] as const;

// 4) Turismo
// Estrategia: 1 llamada Places API (New) con `includedTypes`.
const SUPERCAT_4_INCLUDED_TYPES = ['tourist_attraction', 'museum', 'park'] as const;

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

function toServerPlaceFromNew(p: NewPlacesNearbyPlace): ServerPlace {
  const placeId =
    p.id ||
    (typeof p.name === 'string' && p.name.includes('/') ? p.name.split('/').pop() : undefined);

  const lat = p.location?.latitude;
  const lng = p.location?.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  const photoName = p.photos?.[0]?.name;

  const types = Array.isArray(p.types) ? p.types.filter(Boolean) : [];
  if (typeof p.primaryType === 'string' && p.primaryType.length > 0 && !types.includes(p.primaryType)) {
    types.push(p.primaryType);
  }

  return {
    name: p.displayName?.text,
    place_id: placeId,
    types: types.length ? types : undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    user_ratings_total: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
    vicinity: p.shortFormattedAddress || p.formattedAddress,
    geometry: hasCoords ? { location: { lat: lat as number, lng: lng as number } } : undefined,
    // Note: Photos from Places API (New) are not compatible with legacy `photo_reference`.
    photoName: typeof photoName === 'string' && photoName.length > 0 ? photoName : undefined,
  };
}

async function fetchNearbyNew(params: {
  center: LatLng;
  radius: number;
  includedTypes: string[];
  apiKey: string;
  maxResultCount?: number;
  rankPreference?: 'POPULARITY' | 'DISTANCE';
}) {
  const { center, radius, includedTypes, apiKey } = params;
  const maxResultCount = Math.max(1, Math.min(20, Math.round(params.maxResultCount ?? 20)));
  const rankPreference = params.rankPreference ?? 'POPULARITY';

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes,
    maxResultCount,
    rankPreference,
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
        'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.photos.name',
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
          ? `includedTypes=restaurant | includedTypes=supermarket,grocery_store`
          : supercat === 3
            ? `includedTypes=gas_station | includedTypes=laundry`
            : `includedTypes=${SUPERCAT_4_INCLUDED_TYPES.join(',')}`;

    // Query strategy (cost-control): 1 llamada por supercat usando Places API (New).
    const includedTypes =
      supercat === 1
        ? (['campground', 'rv_park'] as const)
        : supercat === 4
          ? SUPERCAT_4_INCLUDED_TYPES
          : ([] as const);

    // Nota: Places API (New) no ofrece “cuotas” por tipo en una sola llamada.
    // Con 1 llamada, puede ocurrir que salgan 0 resultados de una sub-categoría.
    const rankPreference: 'POPULARITY' | 'DISTANCE' = 'POPULARITY';
    const queryInfo =
      supercat === 2
        ? {
            provider: 'places-new',
            subqueries: [
              { category: 'restaurant', includedTypes: [...SUPERCAT_2_RESTAURANT_INCLUDED_TYPES] },
              { category: 'supermarket', includedTypes: [...SUPERCAT_2_SUPERMARKET_INCLUDED_TYPES] },
            ],
            rankPreference,
            keyword: null,
          }
        : supercat === 3
          ? {
              provider: 'places-new',
              subqueries: [
                { category: 'gas', includedTypes: [...SUPERCAT_3_GAS_INCLUDED_TYPES] },
                { category: 'laundry', includedTypes: [...SUPERCAT_3_LAUNDRY_INCLUDED_TYPES] },
              ],
              rankPreference,
              keyword: null,
            }
          : { provider: 'places-new', includedTypes: [...includedTypes], rankPreference, keyword: null };

    // Opción A: tope de radio por bloque/supercat (defensa también en servidor)
    const capMeters = SUPERCAT_RADIUS_CAP_METERS[supercat];
    const radius = clampRadiusMeters(Math.min(requestedRadius, capMeters));

    const porteroAuditResolved = resolvePorteroAudit(req);

    // 0) Supabase cache HIT
    // Bump supercat=1 cache namespace when query semantics change.
    // v7: includes full AreasAC dataset integration + ordering (AreasAC first, by distance).
    // v5/v4/v3: migrate supercats 2/3/4 to Places API (New) includedTypes.
    // v8q2k/v6q1k/v7q1k/v4q1k: quantized cache keys (stabilize center jitter).
    const quantizeMeters = supercat === 1 ? 2000 : 1000;
    const cacheNamespace =
      supercat === 1
        ? 'places-supercat-v8q2k'
        : supercat === 2
          ? 'places-supercat-v7q1k'
          : supercat === 3
            ? 'places-supercat-v8q1k'
            : 'places-supercat-v4q1k';
    const cacheKey = makePlacesSupercatCacheKey({
      supercat,
      lat: center.lat,
      lng: center.lng,
      radius,
      // bump version where query semantics changed
      namespace: cacheNamespace,
      quantizeMeters,
    });
    const cached = await getPlacesSupercatCache({ key: cacheKey.key });
    const cacheReadDebug = cached.ok
      ? { ok: true as const, hit: cached.hit as boolean, expiresAt: cached.hit ? cached.expiresAt : undefined }
      : { ok: false as const, reason: cached.reason as string };
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
          cacheNamespace,
          cacheRead: cacheReadDebug,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key },
        },
        response: {
          status: 'CACHE_HIT_SUPABASE',
          resultsCount,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          cacheRead: cacheReadDebug,
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

    // 0b) Cache fallback (to avoid accidental spend when bumping namespaces)
    // We only fallback for camping (supercat=1). For other supercats, semantics/quality can change,
    // so we prefer warming the new cache via fresh Google calls.
    if (cached.ok && !cached.hit && supercat === 1) {
      const legacyNamespaces =
        ['places-supercat-v7', 'places-supercat-v6'];

      for (const ns of legacyNamespaces) {
        // Legacy key uses exact center rounding (no quantization)
        const fbKey = makePlacesSupercatCacheKey({ supercat, lat: center.lat, lng: center.lng, radius, namespace: ns });
        const fb = await getPlacesSupercatCache({ key: fbKey.key });
        if (!fb.ok || !fb.hit) continue;

        // Camping: if v7 hit, rehydrate as-is into v8q2k. If v6 hit, keep existing v6->v7 merge logic and still rehydrate.
        if (ns === 'places-supercat-v7') {
          const payload = fb.payload as object;
          const up = await upsertPlacesSupercatCache({
            key: cacheKey.key,
            supercat,
            centerLat: cacheKey.lat,
            centerLng: cacheKey.lng,
            radius: cacheKey.radius,
            payload,
            ttlDays: placesCacheTtlDays,
          });

          await logApiToSupabase({
            trip_id: tripId,
            api: 'google-places',
            method: 'GET',
            url: 'supabase:api_cache_places_supercat',
            status: 'CACHE_HIT_SUPABASE_FALLBACK',
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
              cacheNamespace,
              cacheRead: cacheReadDebug,
              cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key },
              cacheFallback: { provider: 'supabase', table: 'api_cache_places_supercat', key: fbKey.key, namespace: ns, expiresAt: fb.expiresAt },
            },
            response: {
              status: 'CACHE_HIT_SUPABASE_FALLBACK',
              resultsCount: readResultsCountFromPayload(payload),
              cacheRead: cacheReadDebug,
              cache: { provider: 'supabase', key: cacheKey.key, hit: true, source: 'fallback', sourceKey: fbKey.key, sourceNamespace: ns },
              cacheWrite: up.ok
                ? { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: true, expiresAt: up.expiresAt, ttlDays: up.ttlDays }
                : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason },
            },
          });

          return NextResponse.json({
            ...(payload as object),
            resultsCount: readResultsCountFromPayload(payload),
            cache: { provider: 'supabase', key: cacheKey.key, hit: true, source: 'fallback', sourceKey: fbKey.key, expiresAt: up.ok ? up.expiresAt : undefined },
          });
        }

        const fbPayload = fb.payload as unknown as {
          pageLogs?: unknown;
          totals?: unknown;
          categories?: Record<string, unknown>;
        };

        const campingRaw = (fbPayload && typeof fbPayload === 'object' ? fbPayload.categories?.camping : undefined) as unknown;
        const campingList = (Array.isArray(campingRaw) ? (campingRaw as ServerPlace[]) : []).filter(Boolean);
        const googleFromCache = uniqByPlaceId(
          campingList.filter((p) => !(String(p.place_id || '').startsWith('areasac:')))
        );

        const AREASAC_CAMPING_MAX = 10;
        const CAMPING_MAX = 20;
        const areasAcCamping = await getAreasAcNearby({ center, radius, maxResults: AREASAC_CAMPING_MAX });
        const googleSorted = googleFromCache
          .map((p) => ({
            p,
            d: haversineDistanceM(center, {
              lat: p.geometry?.location?.lat ?? center.lat,
              lng: p.geometry?.location?.lng ?? center.lng,
            }),
          }))
          .sort((a, b) => a.d - b.d)
          .map((x) => x.p);

        const merged = uniqByPlaceId([...areasAcCamping, ...googleSorted]).slice(0, CAMPING_MAX);
        const camping = uniqByPlaceId(merged.filter(classifyCamping)).slice(0, 20);

        const fbTotals = (fbPayload && typeof fbPayload === 'object' ? (fbPayload.totals as unknown) : null) as
          | { pages?: unknown; totalResults?: unknown }
          | null;
        const fbPages = typeof fbTotals?.pages === 'number' ? fbTotals.pages : 1;
        const fbPageLogs = (fbPayload && typeof fbPayload === 'object' ? fbPayload.pageLogs : undefined) as unknown;

        const payload = {
          ok: true,
          supercat,
          center,
          radius,
          requestedRadius,
          radiusCapMeters: capMeters,
          query: queryInfo,
          totals: {
            pages: fbPages,
            totalResults: camping.length,
          },
          pageLogs: Array.isArray(fbPageLogs) ? fbPageLogs : [],
          categories: { camping },
        };

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
          ? {
              provider: 'supabase',
              action: 'upsert',
              table: 'api_cache_places_supercat',
              key: cacheKey.key,
              ok: true,
              expiresAt: up.expiresAt,
              ttlDays: up.ttlDays,
            }
          : { provider: 'supabase', action: 'upsert', table: 'api_cache_places_supercat', key: cacheKey.key, ok: false, reason: up.reason };

        await logApiToSupabase({
          trip_id: tripId,
          api: 'google-places',
          method: 'GET',
          url: 'supabase:api_cache_places_supercat',
          status: 'CACHE_HIT_SUPABASE_FALLBACK',
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
            cacheNamespace,
            cacheRead: cacheReadDebug,
            cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key },
            cacheFallback: { provider: 'supabase', table: 'api_cache_places_supercat', key: fbKey.key, namespace: ns, expiresAt: fb.expiresAt },
          },
          response: {
            status: 'CACHE_HIT_SUPABASE_FALLBACK',
            resultsCount: camping.length,
            cacheRead: cacheReadDebug,
            cache: { provider: 'supabase', key: cacheKey.key, hit: true, source: 'fallback', sourceKey: fbKey.key, sourceNamespace: ns },
            cacheWrite,
          },
        });

        return NextResponse.json({
          ...payload,
          resultsCount: camping.length,
          cache: { provider: 'supabase', key: cacheKey.key, hit: true, source: 'fallback', sourceKey: fbKey.key, expiresAt: up.ok ? up.expiresAt : undefined },
        });
      }
    }

    const GOOGLE_PLACES_CALL_COST = 0.032;

    let status = 'UNKNOWN';
    let results: ServerPlace[] = [];
    let pageLogs: Array<{ status: string; resultsCount: number; durationMs: number; nextPageToken?: string | null; url?: string }> = [];
    let firstPageUrl = '';
    let pages = 1;
    let totalDurationMs = 0;
    let googleCalls = 0;
    let supercat2RestaurantRaw: ServerPlace[] | undefined;
    let supercat2SupermarketRaw: ServerPlace[] | undefined;
    let supercat3GasRaw: ServerPlace[] | undefined;
    let supercat3LaundryRaw: ServerPlace[] | undefined;

    const joinStatus = (a: string, b: string) => {
      if (a === b) return a;
      if (a === 'OK' && b === 'OK') return 'OK';
      return `${a}|${b}`;
    };

    if (supercat === 2) {
      const p1 = await fetchNearbyNew({
        center,
        radius,
        apiKey,
        includedTypes: [...SUPERCAT_2_RESTAURANT_INCLUDED_TYPES],
        maxResultCount: 20,
        rankPreference,
      });
      const r1 = (p1.ok ? (p1.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);

      const p2 = await fetchNearbyNew({
        center,
        radius,
        apiKey,
        includedTypes: [...SUPERCAT_2_SUPERMARKET_INCLUDED_TYPES],
        maxResultCount: 20,
        rankPreference,
      });
      const r2 = (p2.ok ? (p2.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);

      supercat2RestaurantRaw = r1;
      supercat2SupermarketRaw = r2;

      googleCalls = 2;
      pages = 1;
      status = joinStatus(p1.status, p2.status);
      results = uniqByPlaceId([...r1, ...r2]);
      totalDurationMs = p1.durationMs + p2.durationMs;
      firstPageUrl = p1.url;
      pageLogs = [
        { status: p1.status, resultsCount: r1.length, durationMs: p1.durationMs, nextPageToken: null, url: p1.url },
        { status: p2.status, resultsCount: r2.length, durationMs: p2.durationMs, nextPageToken: null, url: p2.url },
      ];
    } else if (supercat === 3) {
      const p1 = await fetchNearbyNew({
        center,
        radius,
        apiKey,
        includedTypes: [...SUPERCAT_3_GAS_INCLUDED_TYPES],
        maxResultCount: 20,
        rankPreference,
      });
      const r1 = (p1.ok ? (p1.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);

      const p2 = await fetchNearbyNew({
        center,
        radius,
        apiKey,
        includedTypes: [...SUPERCAT_3_LAUNDRY_INCLUDED_TYPES],
        maxResultCount: 20,
        rankPreference,
      });
      const r2 = (p2.ok ? (p2.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);

      supercat3GasRaw = r1;
      supercat3LaundryRaw = r2;

      googleCalls = 2;
      pages = 1;
      status = joinStatus(p1.status, p2.status);
      results = uniqByPlaceId([...r1, ...r2]);
      totalDurationMs = p1.durationMs + p2.durationMs;
      firstPageUrl = p1.url;
      pageLogs = [
        { status: p1.status, resultsCount: r1.length, durationMs: p1.durationMs, nextPageToken: null, url: p1.url },
        { status: p2.status, resultsCount: r2.length, durationMs: p2.durationMs, nextPageToken: null, url: p2.url },
      ];
    } else {
      const p = await fetchNearbyNew({
        center,
        radius,
        apiKey,
        includedTypes: [...includedTypes],
        maxResultCount: 20,
        rankPreference,
      });
      googleCalls = 1;
      pages = 1;

      status = p.status;
      const raw = (p.ok ? (p.json.places || []) : []).slice(0, 20).map(toServerPlaceFromNew);
      results = raw;
      totalDurationMs = p.durationMs;
      firstPageUrl = p.url;
      pageLogs = [{ status, resultsCount: raw.length, durationMs: p.durationMs, nextPageToken: null, url: p.url }];
    }

    // Dedup defensivo (supercat=1 puede traer duplicados)
    results = uniqByPlaceId(results);
    const AREASAC_CAMPING_MAX = 10;
    const CAMPING_MAX = 20;

    const googleCamping = supercat === 1 ? uniqByPlaceId(results.filter(classifyCamping)) : [];
    const areasAcCamping =
      supercat === 1 ? await getAreasAcNearby({ center, radius, maxResults: AREASAC_CAMPING_MAX }) : [];

    if (supercat === 1) {
      // Preserve some Google results (freshness/photos), while keeping AreasAC first.
      const googleSorted = googleCamping
        .map((p) => ({
          p,
          d: haversineDistanceM(center, {
            lat: p.geometry?.location?.lat ?? center.lat,
            lng: p.geometry?.location?.lng ?? center.lng,
          }),
        }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.p);

      results = uniqByPlaceId([...areasAcCamping, ...googleSorted]).slice(0, CAMPING_MAX);
    }

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
          cacheNamespace,
          cacheRead: cacheReadDebug,
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
          cacheRead: cacheReadDebug,
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
      const restaurant = uniqByPlaceId(
        (supercat2RestaurantRaw ?? results.filter(classifyRestaurant)).filter(classifyRestaurant),
      ).slice(0, 20);
      const supermarket = uniqByPlaceId(
        (supercat2SupermarketRaw ?? results.filter(classifySupermarket)).filter(classifySupermarket),
      ).slice(0, 20);
      const payload = {
        ...basePayload,
        totals: { ...basePayload.totals, totalResults: restaurant.length + supermarket.length },
        categories: { restaurant, supermarket },
      };

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
          cacheNamespace,
          cacheRead: cacheReadDebug,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: restaurant.length + supermarket.length,
          totals: payload.totals,
          pageLogs,
          inputDebug: inputDebug ?? undefined,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          portero: porteroAudit ?? undefined,
          cacheRead: cacheReadDebug,
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
      const gas = uniqByPlaceId((supercat3GasRaw ?? results.filter(classifyGas)).filter(classifyGas)).slice(0, 20);
      const laundry = uniqByPlaceId(
        (supercat3LaundryRaw ?? results.filter(classifyLaundry)).filter(classifyLaundry),
      ).slice(0, 20);
      const payload = {
        ...basePayload,
        totals: { ...basePayload.totals, totalResults: gas.length + laundry.length },
        categories: { gas, laundry },
      };

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
          cacheNamespace,
          cacheRead: cacheReadDebug,
          cache: { provider: 'supabase', table: 'api_cache_places_supercat', key: cacheKey.key, hit: false },
        },
        response: {
          status,
          resultsCount: gas.length + laundry.length,
          totals: payload.totals,
          pageLogs,
          inputDebug: inputDebug ?? undefined,
          porteroAuditMode: porteroAuditResolved.mode,
          porteroAuditSource: porteroAuditResolved.source,
          portero: porteroAudit ?? undefined,
          cacheRead: cacheReadDebug,
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
        cacheNamespace,
        cacheRead: cacheReadDebug,
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
        cacheRead: cacheReadDebug,
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
