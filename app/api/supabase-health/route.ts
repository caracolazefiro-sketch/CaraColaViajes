import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseServer } from '../../supabase';

export async function GET() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return NextResponse.json({ ok: false, reason: 'disabled-in-production' }, { status: 404 });
  }
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const projectRef = url.replace('https://', '').split('.')[0];
  const keyPrefix = key.slice(0, 6);

  if (!hasUrl || !hasKey) {
    return NextResponse.json({
      ok: false,
      reason: 'missing-env',
      SUPABASE_URL: hasUrl ? 'set' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: hasKey ? 'set' : 'missing',
      details: { projectRef, keyPrefix }
    }, { status: 500 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ ok: false, reason: 'client-null', details: { projectRef, keyPrefix } }, { status: 500 });
  }

  try {
    // minimal auth check: query a known empty select
    const { error, data } = await supabaseServer.from('api_logs').select('id').limit(1);
    if (error) {
      return NextResponse.json({ ok: false, reason: 'query-error', message: error.message, details: { projectRef, keyPrefix } }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: 'supabase server configured and query ok', details: { projectRef, keyPrefix, count: Array.isArray(data) ? data.length : 0 } });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: 'exception', message: err instanceof Error ? err.message : 'unknown', details: { projectRef, keyPrefix } }, { status: 500 });
  }
}
