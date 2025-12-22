import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { logApiToSupabase } from '../../../utils/server-logs';

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || undefined;
  const realIp = req.headers.get('x-real-ip');
  return realIp || undefined;
}

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);

  const ref = String(url.searchParams.get('ref') || '').trim();
  const name = String(url.searchParams.get('name') || '').trim();
  if (!ref && !name) {
    return NextResponse.json({ error: 'missing-ref-or-name' }, { status: 400 });
  }

  const maxwidth = Math.max(1, Math.min(2000, Number(url.searchParams.get('maxwidth') || 400)));
  const maxheight = url.searchParams.get('maxheight');
  const maxheightNum = maxheight ? Math.max(1, Math.min(2000, Number(maxheight))) : null;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    await logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: 'caracola:/api/google/place-photo',
      status: 'MISSING_API_KEY',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { ref: ref ? ref.slice(0, 12) + '…' : undefined, name: name ? name.slice(0, 24) + '…' : undefined, maxwidth, maxheight: maxheightNum, route: 'place-photo', client_id: req.headers.get('x-caracola-client-id') || undefined, ip: getClientIp(req), ua: req.headers.get('user-agent') || undefined },
      response: { error: 'missing-api-key' },
    });

    return NextResponse.json({ error: 'missing-api-key' }, { status: 500 });
  }

  const googleUrl = (() => {
    if (ref) {
      const u = new URL('https://maps.googleapis.com/maps/api/place/photo');
      u.searchParams.set('photoreference', ref);
      if (Number.isFinite(maxwidth)) u.searchParams.set('maxwidth', String(Math.round(maxwidth)));
      if (maxheightNum != null && Number.isFinite(maxheightNum)) u.searchParams.set('maxheight', String(Math.round(maxheightNum)));
      u.searchParams.set('key', apiKey);
      return u;
    }

    // Places API (New): photo resource name (places/..../photos/..)
    const u = new URL(`https://places.googleapis.com/v1/${encodeURI(name)}/media`);
    if (Number.isFinite(maxwidth)) u.searchParams.set('maxWidthPx', String(Math.round(maxwidth)));
    if (maxheightNum != null && Number.isFinite(maxheightNum)) u.searchParams.set('maxHeightPx', String(Math.round(maxheightNum)));
    u.searchParams.set('key', apiKey);
    return u;
  })();

  const googleUrlNoKey = (() => {
    const u = new URL(googleUrl.toString());
    u.searchParams.delete('key');
    return u.toString();
  })();

  try {
    const t0 = Date.now();
    const upstream = await fetch(googleUrl.toString(), { method: 'GET' });
    const durationMs = Date.now() - t0;

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    void logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status: upstream.ok ? 'OK' : String(upstream.status),
      duration_ms: durationMs,
      cached: false,
      request: { ref: ref ? ref.slice(0, 12) + '…' : undefined, name: name ? name.slice(0, 24) + '…' : undefined, maxwidth, maxheight: maxheightNum, route: 'place-photo', client_id: req.headers.get('x-caracola-client-id') || undefined, ip: getClientIp(req), ua: req.headers.get('user-agent') || undefined },
      response: { httpStatus: upstream.status, ok: upstream.ok, contentType },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'upstream-failed', status: upstream.status }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        // Allow CDN/browser caching for a day; photo references are stable.
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    void logApiToSupabase({
      api: 'google-places',
      method: 'GET',
      url: googleUrlNoKey,
      status: 'EXCEPTION',
      duration_ms: Date.now() - startedAt,
      cached: false,
      request: { ref: ref ? ref.slice(0, 12) + '…' : undefined, name: name ? name.slice(0, 24) + '…' : undefined, maxwidth, maxheight: maxheightNum, route: 'place-photo', client_id: req.headers.get('x-caracola-client-id') || undefined, ip: getClientIp(req), ua: req.headers.get('user-agent') || undefined },
      response: { error: err instanceof Error ? err.message : 'unknown' },
    });

    return NextResponse.json({ error: 'exception' }, { status: 500 });
  }
}
