import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseServer } from '../../supabase';

export async function GET() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return NextResponse.json({ ok: false, reason: 'disabled-in-production' }, { status: 404 });
  }
  if (!supabaseServer) {
    return NextResponse.json({ ok: false, reason: 'no-supabase-server' }, { status: 500 });
  }
  const payload = {
    env,
    trip_id: 'health-test',
    api: 'other',
    method: 'GET',
    url: '/api/logs-supabase-test',
    status: 'TEST',
    duration_ms: 1,
    cost: 0,
    cached: false,
    request: { ping: true },
    response: { pong: true }
  };
  const { data, error } = await supabaseServer.from('api_logs').insert(payload).select('*').limit(1);
  if (error) {
    return NextResponse.json({ ok: false, reason: 'insert-error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, inserted: data?.[0] || null });
}
