/*
  MUTACIÓN (MAPA) smoke test (browser-side)
  - Opens the app
  - Fills origin/destination
  - Submits itinerary calculation
  - Asserts the *browser* does NOT call paid Google Web APIs directly
    (Directions/Geocoding/Places/Elevation JSON endpoints)

  Usage:
    node scripts/test-mutation-map.js
    node scripts/test-mutation-map.js http://localhost:3000

  Exit codes:
    0 = pass
    1 = fail
*/

const puppeteer = require('puppeteer');

const DEFAULT_URL = 'http://localhost:3000';

function isForbiddenGoogleApiRequest(url) {
  // Allowed: JS SDK, static assets, gen_204 pings.
  const u = String(url);
  if (!u.includes('googleapis.com')) return false;

  // Allow the Maps JS SDK loader
  if (u.includes('maps.googleapis.com/maps/api/js')) return false;
  if (u.includes('maps.googleapis.com/maps/api/mapsjs/')) return false;

  // Block common paid Web Service endpoints if called from the browser
  const forbidden = [
    'maps.googleapis.com/maps/api/directions',
    'maps.googleapis.com/maps/api/geocode',
    'maps.googleapis.com/maps/api/place',
    'maps.googleapis.com/maps/api/elevation',
    'places.googleapis.com',
  ];

  return forbidden.some((s) => u.includes(s));
}

async function waitForHttpOk(url, { timeoutMs = 60_000 } = {}) {
  const start = Date.now();
  // Node 20 has global fetch
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 400) return;
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout esperando a que ${url} responda OK`);
    }
    await new Promise((r) => setTimeout(r, 750));
  }
}

async function run() {
  const baseUrl = process.argv[2] || DEFAULT_URL;

  console.log(`[mutation-map] URL: ${baseUrl}`);

  // Quick preflight
  await waitForHttpOk(baseUrl);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const forbiddenRequests = [];
  const allRequests = [];

  page.on('request', (req) => {
    const url = req.url();
    allRequests.push(url);
    if (isForbiddenGoogleApiRequest(url)) {
      forbiddenRequests.push({ url, method: req.method() });
    }
  });

  page.on('console', (msg) => {
    // Keep this minimal; only surface errors
    if (msg.type() === 'error') {
      console.log('[browser:console:error]', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.log('[browser:pageerror]', err?.message || String(err));
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Fill dates (required)
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 7));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 9));
    const iso = (d) => d.toISOString().slice(0, 10);

    await page.waitForSelector('#fechaInicio', { timeout: 30_000 });
    await page.$eval('#fechaInicio', (el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, iso(start));

    // fechaRegreso is optional; set a short trip to avoid trial limits
    await page.$eval('#fechaRegreso', (el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, iso(end));

    // Fill origin/destination
    await page.waitForSelector('#origen', { timeout: 30_000 });
    await page.click('#origen', { clickCount: 3 });
    await page.type('#origen', 'Madrid', { delay: 10 });

    await page.waitForSelector('#destino', { timeout: 30_000 });
    await page.click('#destino', { clickCount: 3 });
    await page.type('#destino', 'Valencia', { delay: 10 });

    // Submit form
    await page.waitForSelector('button[type="submit"]', { timeout: 30_000 });

    // Wait for the POST back to same-origin (server action) OR itinerary to appear.
    const responsePromise = page.waitForResponse(
      (res) => {
        try {
          const url = res.url();
          return res.request().method() === 'POST' && (url === baseUrl || url === `${baseUrl}/`);
        } catch {
          return false;
        }
      },
      { timeout: 60_000 }
    ).catch(() => null);

    await page.click('button[type="submit"]');

    await responsePromise;

    // Wait a bit for map render/markers
    await new Promise((r) => setTimeout(r, 5_000));

    // Assert
    if (forbiddenRequests.length > 0) {
      console.error('\n[mutation-map] FAIL: El navegador llamó APIs pagadas de Google directamente:');
      for (const r of forbiddenRequests) {
        console.error(`- ${r.method} ${r.url}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log('[mutation-map] PASS: No se detectaron llamadas directas a APIs pagadas de Google desde el navegador.');

    // Helpful hint: show if maps JS SDK loaded
    const loadedMapsSdk = allRequests.some((u) => u.includes('maps.googleapis.com/maps/api/js'));
    console.log(`[mutation-map] Info: Maps JS SDK cargado: ${loadedMapsSdk ? 'sí' : 'no'}`);

    process.exitCode = 0;
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

run().catch((err) => {
  console.error('[mutation-map] ERROR', err);
  process.exitCode = 1;
});
