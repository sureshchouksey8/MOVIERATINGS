import { NextResponse } from 'next/server';
import { tmdbSearchMovies, tmdbImageUrl } from '@/lib/tmdb';
import type { SearchResult } from '@/lib/types';
import { lru } from '@/lib/cache';
import { limitOrThrow } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    limitOrThrow(req, 'search', 180); // 180 rpm per IP
  } catch (e: any) {
    return new NextResponse(e.message, { status: e.status || 429, headers: e.headers });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] }, { status: 200, headers: noStore() });
  }

  const TMDB_KEY = process.env.TMDB_KEY;
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });

  // in-memory 5 min cache for the same query
  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = lru.get<any>(cacheKey);
  if (cached) return NextResponse.json(cached, { status: 200, headers: noStore() });

  try {
    const data = await tmdbSearchMovies(q, TMDB_KEY);
    const results: SearchResult[] = (data.results || []).slice(0, 10).map((m: any) => ({
      tmdbId: m.id,
      title: m.title,
      year: (m.release_date || '').slice(0, 4) || '—',
      poster: m.poster_path ? tmdbImageUrl(m.poster_path, 'w342') : null,
    }));
    const payload = { results };
    lru.set(cacheKey, payload, 5 * 60_000);
    return NextResponse.json(payload, { status: 200, headers: noStore() });
  } catch (e: any) {
    console.error('search error', e?.message);
    return NextResponse.json({ error: e?.message || 'Search failed' }, { status: 500, headers: noStore() });
  }
}

function noStore() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: '*',
  };
}