/*
  P1: Test exhaustivo AreasAC (smoke + cache)

  Uso:
    1) Arranca el dev server: npm run dev
    2) Ejecuta: node scripts/test-areasac-exhaustive.js

  Opcional:
    BASE_URL=http://localhost:3000 node scripts/test-areasac-exhaustive.js
*/

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

function countAreasac(results) {
  return results.filter((p) => String(p?.place_id || '').startsWith('areasac:')).length;
}

function firstIds(results, n = 8) {
  return results.slice(0, n).map((p) => String(p?.place_id || '')).join(', ');
}

async function runCase(name, center, radius = 25000) {
  const body = {
    tripName: `P1-AREASAC-${name}`,
    tripId: `p1-areasac-${name}-${Date.now()}`,
    supercat: 1,
    center,
    radius,
  };

  const url = `${BASE_URL}/api/places-supercat`;

  const r1 = await postJson(url, body);
  const camping1 = r1.json?.categories?.camping || [];

  const r2 = await postJson(url, body);
  const camping2 = r2.json?.categories?.camping || [];

  const cache1 = r1.json?.cache;
  const cache2 = r2.json?.cache;

  const a1 = Array.isArray(camping1) ? countAreasac(camping1) : 0;
  const a2 = Array.isArray(camping2) ? countAreasac(camping2) : 0;

  console.log('\n===', name, '===');
  console.log('center=', center, 'radius=', radius);
  console.log('1st call:', {
    http: r1.status,
    ok: r1.ok,
    cache: cache1,
    results: Array.isArray(camping1) ? camping1.length : 0,
    areasac: a1,
    firstIds: Array.isArray(camping1) ? firstIds(camping1) : '(none)',
  });
  console.log('2nd call:', {
    http: r2.status,
    ok: r2.ok,
    cache: cache2,
    results: Array.isArray(camping2) ? camping2.length : 0,
    areasac: a2,
    firstIds: Array.isArray(camping2) ? firstIds(camping2) : '(none)',
  });

  // Expectations (soft):
  // - Some AreasAC results near Spain points
  // - 2nd call ideally cache hit (if Supabase server is configured)
  const expectAreasac = a1 > 0 || a2 > 0;
  const expectCacheHitSecond = cache2?.hit === true || cache2?.source === 'fallback';

  console.log('checks:', {
    hasAreasac: expectAreasac,
    cacheSecondLooksLikeHit: expectCacheHitSecond,
  });
}

async function main() {
  console.log('BASE_URL=', BASE_URL);
  console.log('NOTE: cache hit requires Supabase server env configured.');

  const cases = [
    { name: 'ALBACETE_LEZUZA', center: { lat: 38.9497, lng: -2.3552712 }, radius: 25000 },
    { name: 'MADRID', center: { lat: 40.4168, lng: -3.7038 }, radius: 25000 },
    { name: 'VALENCIA', center: { lat: 39.4699, lng: -0.3763 }, radius: 25000 },
    { name: 'BARCELONA', center: { lat: 41.3874, lng: 2.1686 }, radius: 25000 },
    { name: 'SEVILLA', center: { lat: 37.3891, lng: -5.9845 }, radius: 25000 },
  ];

  for (const c of cases) {
    // eslint-disable-next-line no-await-in-loop
    await runCase(c.name, c.center, c.radius);
  }
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
