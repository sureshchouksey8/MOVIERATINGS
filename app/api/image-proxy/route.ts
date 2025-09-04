import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOW = new Set(['image.tmdb.org', 'm.media-amazon.com', 'via.placeholder.com']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u') || '';
    const url = new URL(u);
    if (!ALLOW.has(url.hostname)) return NextResponse.json({ error: 'host not allowed' }, { status: 400 });

    const res = await fetch(url.toString(), { redirect: 'follow' });
    if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 });

    const arrayBuf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}