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
    const checkTable = async (table: string) => {
      const { error, data } = await supabaseServer.from(table).select('key').limit(1);
      if (error) return { ok: false as const, table, error: error.message };
      return { ok: true as const, table, rows: Array.isArray(data) ? data.length : 0 };
    };

    const checkApiLogs = async () => {
      const { error, data } = await supabaseServer.from('api_logs').select('id').limit(1);
      if (error) return { ok: false as const, table: 'api_logs', error: error.message };
      return { ok: true as const, table: 'api_logs', rows: Array.isArray(data) ? data.length : 0 };
    };

    const results = await Promise.all([
      checkApiLogs(),
      checkTable('api_cache_geocoding'),
      checkTable('api_cache_places_supercat'),
    ]);

    const ok = results.every(r => r.ok);
    if (!ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'missing-table-or-permissions',
          details: { projectRef, keyPrefix },
          checks: results,
          hint: 'Apply supabase/migrations/004_api_cache.sql in this Supabase project, then reload schema cache.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'supabase server configured and tables available',
      details: { projectRef, keyPrefix },
      checks: results,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: 'exception', message: err instanceof Error ? err.message : 'unknown', details: { projectRef, keyPrefix } }, { status: 500 });
  }
}
