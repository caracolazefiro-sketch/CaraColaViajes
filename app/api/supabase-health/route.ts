import { NextResponse } from 'next/server';
import { supabaseServer } from '../../supabase';

export async function GET() {
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasUrl || !hasKey) {
    return NextResponse.json({
      ok: false,
      reason: 'missing-env',
      SUPABASE_URL: hasUrl ? 'set' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: hasKey ? 'set' : 'missing'
    }, { status: 500 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ ok: false, reason: 'client-null' }, { status: 500 });
  }

  try {
    // minimal auth check: query a known empty select
    const { error } = await supabaseServer.from('api_logs').select('id').limit(1);
    if (error) {
      return NextResponse.json({ ok: false, reason: 'query-error', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: 'supabase server configured and query ok' });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: 'exception', message: err instanceof Error ? err.message : 'unknown' }, { status: 500 });
  }
}
