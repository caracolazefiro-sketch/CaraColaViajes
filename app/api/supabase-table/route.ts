import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { supabaseServer } from '../../utils/supabase-server';

const ALLOWED_TABLES = new Set([
  'api_logs',
  'api_cache_geocoding',
  'api_cache_places_supercat',
  'api_cache_directions',
  'api_cache_places_details',
  'api_cache_geocode_address',
]);

type AllowedTable =
  | 'api_logs'
  | 'api_cache_geocoding'
  | 'api_cache_places_supercat'
  | 'api_cache_directions'
  | 'api_cache_places_details'
  | 'api_cache_geocode_address';

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

function isDisabledOnProductionHost(req: Request): boolean {
  const host = new URL(req.url).host;
  const prodHost = process.env.NEXT_PUBLIC_PROD_HOST || 'cara-cola-viajes.vercel.app';
  return host === prodHost;
}

function hasValidViewerToken(req: Request): boolean {
  const required = process.env.SUPABASE_VIEWER_TOKEN;
  if (!required) return true;
  const got = req.headers.get('x-supabase-viewer-token');
  return got === required;
}

function getSelectColumns(table: AllowedTable, includePayload: boolean): string {
  if (includePayload) return '*';
  if (table === 'api_logs') return '*';
  if (table === 'api_cache_geocoding') {
    return 'key, lat, lng, city_name, resolved_from, expires_at, updated_at, created_at';
  }
  if (table === 'api_cache_places_supercat') {
    return 'key, supercat, center_lat, center_lng, radius, expires_at, updated_at, created_at';
  }
  if (table === 'api_cache_directions') {
    return 'key, origin, destination, travel_mode, waypoints, summary, expires_at, updated_at, created_at';
  }
  if (table === 'api_cache_places_details') {
    return 'key, place_id, fields, language, expires_at, updated_at, created_at';
  }
  if (table === 'api_cache_geocode_address') {
    return 'key, query, language, expires_at, updated_at, created_at';
  }
  return '*';
}

export async function GET(req: Request) {
  try {
    if (isDisabledOnProductionHost(req)) {
      return NextResponse.json({ error: 'disabled-on-production-host' }, { status: 404 });
    }

    if (!hasValidViewerToken(req)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase server not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);

    const tableRaw = String(searchParams.get('table') || '');
    if (!ALLOWED_TABLES.has(tableRaw)) {
      return NextResponse.json(
        {
          error: 'invalid-table',
          allowedTables: Array.from(ALLOWED_TABLES.values()),
        },
        { status: 400 }
      );
    }

    const table = tableRaw as AllowedTable;
    const includePayload = searchParams.get('includePayload') === '1';

    const limit = clampInt(searchParams.get('limit') || '50', 1, 200, 50);
    const offset = clampInt(searchParams.get('offset') || '0', 0, 50_000, 0);

    const key = searchParams.get('key');
    const tripId = searchParams.get('tripId');
    const api = searchParams.get('api');

    let query = supabaseServer
      .from(table)
      .select(getSelectColumns(table, includePayload), { count: 'exact' });

    if (table === 'api_logs') {
      query = query.order('created_at', { ascending: false });
      if (tripId) query = query.eq('trip_id', tripId);
      if (api) query = query.eq('api', api);
    } else {
      query = query.order('updated_at', { ascending: false });
      if (key) query = query.eq('key', key);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      table,
      limit,
      offset,
      count: count ?? null,
      rows: data ?? [],
      includePayload,
      tokenRequired: Boolean(process.env.SUPABASE_VIEWER_TOKEN),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
