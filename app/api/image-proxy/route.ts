import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOW = new Set([
  'image.tmdb.org',
  'm.media-amazon.com',
  'via.placeholder.com',
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    const target = new URL(url);
    if (!ALLOW.has(target.hostname)) return new NextResponse('Host not allowed', { status: 400 });

    const res = await fetch(target.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return new NextResponse('Upstream error', { status: 502 });
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = await res.arrayBuffer();
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    return new NextResponse(buf, { status: 200, headers });
  } catch (e) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}