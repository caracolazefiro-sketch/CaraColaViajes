/*
  Inspect Supabase cached Places supercat payloads.
  Usage:
    node scripts/inspect-places-cache.js --key "places-supercat:1:39.4740,-0.3745:25000" --tripId "trip-..."

  Loads env from .env.local if present.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) {
      out[k] = true;
    } else {
      out[k] = v;
      i++;
    }
  }
  return out;
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'));

  const args = parseArgs(process.argv);
  const cacheKey = args.key;
  const tripId = args.tripId;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in env/.env.local');
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (cacheKey) {
    const { data: cache, error } = await sb
      .from('api_cache_places_supercat')
      .select('key, supercat, center_lat, center_lng, radius, expires_at, updated_at, payload')
      .eq('key', cacheKey)
      .maybeSingle();

    if (error) throw error;
    if (!cache) {
      console.log('No cache row found for key:', cacheKey);
    } else {
      const camping = (((cache.payload || {}).categories || {}).camping) || [];
      const tourism = (((cache.payload || {}).categories || {}).tourism) || [];
      const restaurant = (((cache.payload || {}).categories || {}).restaurant) || [];
      const supermarket = (((cache.payload || {}).categories || {}).supermarket) || [];
      const gas = (((cache.payload || {}).categories || {}).gas) || [];
      const laundry = (((cache.payload || {}).categories || {}).laundry) || [];

      const categories = {
        camping,
        tourism,
        restaurant,
        supermarket,
        gas,
        laundry,
      };

      const categoryCounts = Object.fromEntries(
        Object.entries(categories)
          .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
          .map(([name, arr]) => [name, arr.length])
      );

      console.log('CACHE ROW:', {
        key: cache.key,
        supercat: cache.supercat,
        center: [cache.center_lat, cache.center_lng],
        radius: cache.radius,
        expires_at: cache.expires_at,
        updated_at: cache.updated_at,
        categoryCounts,
      });

      for (const [catName, arr] of Object.entries(categories)) {
        if (!Array.isArray(arr) || arr.length === 0) continue;
        console.log(`\n${catName.toUpperCase()} (${arr.length})`);
        for (const p of arr) {
          console.log('-', [p.name || '', p.rating ?? '', p.user_ratings_total ?? '', p.vicinity || '', p.place_id || ''].join(' | '));
        }
      }
    }
  }

  if (tripId) {
    const { data: logs, error } = await sb
      .from('api_logs')
      .select('created_at, api, cost, cached, status, request, response')
      .eq('trip_id', tripId)
      .eq('api', 'google-places')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    console.log(`\nRECENT LOGS (google-places) for ${tripId}:`);
    for (const row of logs || []) {
      const req = row.request || {};
      const res = row.response || {};
      const cache = req.cache || {};
      console.log(
        '-',
        row.created_at,
        'cached=',
        row.cached,
        'cost=',
        row.cost,
        'status=',
        row.status,
        'supercat=',
        req.supercat,
        'key=',
        cache.key,
        'resultsCount=',
        res.resultsCount,
        'expiresAt=',
        (res.cache && res.cache.expiresAt) || ''
      );
    }
  }
}

main().catch((e) => {
  console.error('ERROR:', e && e.message ? e.message : String(e));
  process.exit(1);
});
