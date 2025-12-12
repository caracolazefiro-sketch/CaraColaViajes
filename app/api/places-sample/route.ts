import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { logApiToSupabase } from '../../utils/server-logs';

type PlaceResult = {
  name?: string;
  place_id?: string;
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
};

function classifyCamping(r: PlaceResult) {
  const t = r.types || [];
  const name = r.name || '';
  const campingTag = t.includes('campground') || t.includes('rv_park');
  const parkingCamping = t.includes('parking') && /camping|area|camper|autocaravana/i.test(name);
  const esTienda = t.includes('hardware_store') || t.includes('store') || t.includes('shopping_mall');
  return (campingTag || parkingCamping) && !esTienda;
}
function classifyRestaurant(r: PlaceResult) {
  const t = r.types || [];
  return t.includes('restaurant') || t.includes('cafe') || t.includes('food') || t.includes('meal_takeaway');
}
function classifySupermarket(r: PlaceResult) {
  const t = r.types || [];
  return t.includes('supermarket') || t.includes('grocery_or_supermarket') || t.includes('grocery_store');
}
function classifyGas(r: PlaceResult) {
  const t = r.types || [];
  return t.includes('gas_station');
}
function classifyLaundry(r: PlaceResult) {
  const t = r.types || [];
  return t.includes('laundry') && !t.includes('lodging');
}
function classifyTourism(r: PlaceResult) {
  const t = r.types || [];
  return t.includes('tourist_attraction') || t.includes('museum') || t.includes('park') || t.includes('point_of_interest');
}

async function nearbySearch(center: { lat: number; lng: number }, radius: number, keyword: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
  const start = performance.now();
  const res = await fetch(url);
  const json = await res.json();
  const duration = performance.now() - start;
  await logApiToSupabase({ api: 'google-places', method: 'GET', url, status: json.status, duration_ms: Math.round(duration), cost: 0.003, cached: false, request: { center, radius, keyword }, response: { status: json.status, resultsCount: (json.results || []).length } });
  return json;
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, reason: 'no-google-key' }, { status: 500 });
    }
    // Mérida, España (aprox. Plaza de España)
    const center = { lat: 38.915, lng: -6.345 };
    const radius = 10000;

    // Supercategoría 1: Spots+Comer+Super
    const keyword1 = 'camping OR "área de autocaravanas" OR "RV park" OR "motorhome area" OR pernocta OR restaurante OR restaurant OR "fast food" OR comida OR supermercado OR supermarket OR "grocery store"';
    const r1 = await nearbySearch(center, radius, keyword1, apiKey);
    const results1: PlaceResult[] = r1.results || [];
    const camping = results1.filter(classifyCamping);
    const restaurant = results1.filter(classifyRestaurant);
    const supermarket = results1.filter(classifySupermarket);

    // Supercategoría 2: Gas+Lavar+Turismo
    const keyword2 = 'gas OR gas_station OR laundry OR "lavandería autoservicio" OR museum OR park OR tourist_attraction';
    const r2 = await nearbySearch(center, radius, keyword2, apiKey);
    const results2: PlaceResult[] = r2.results || [];
    const gas = results2.filter(classifyGas);
    const laundry = results2.filter(classifyLaundry);
    const tourism = results2.filter(classifyTourism);

    return NextResponse.json({
      ok: true,
      center,
      radius,
      rawCounts: { supercat1: results1.length, supercat2: results2.length },
      categories: {
        camping: { count: camping.length },
        restaurant: { count: restaurant.length },
        supermarket: { count: supermarket.length },
        gas: { count: gas.length },
        laundry: { count: laundry.length },
        tourism: { count: tourism.length }
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}
