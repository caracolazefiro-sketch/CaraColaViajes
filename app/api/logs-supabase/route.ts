import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseServer } from '../../utils/supabase-server';

export async function GET(req: Request) {
  try {
    const host = new URL(req.url).host;
    const prodHost = process.env.NEXT_PUBLIC_PROD_HOST || 'cara-cola-viajes.vercel.app';
    if (host === prodHost) {
      return NextResponse.json({ error: 'disabled-on-production-host' }, { status: 404 });
    }
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase server not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '100');
    const tripId = searchParams.get('tripId');
    const api = searchParams.get('api');

    let query = supabaseServer.from('api_logs').select('*').order('created_at', { ascending: false }).limit(Math.min(limit, 500));
    if (tripId) query = query.eq('trip_id', tripId);
    if (api) query = query.eq('api', api);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
