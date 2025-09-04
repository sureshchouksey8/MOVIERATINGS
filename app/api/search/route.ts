import { NextResponse } from 'next/server';
import { tmdbSearchMovies, tmdbImageUrl } from '@/lib/tmdb';
import type { SearchResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const pageParam = Number(searchParams.get('page') || '1') || 1;
  const page = Math.max(1, Math.min(pageParam, 5)); // safety cap

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], page: 1, total_pages: 1 }, { status: 200, headers: noStore() });
  }

  const TMDB_KEY = process.env.TMDB_KEY;
  if (!TMDB_KEY) {
    return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });
  }

  try {
    const data = await tmdbSearchMovies(q, TMDB_KEY, page);
    const results: SearchResult[] = (data.results || []).map((m: any) => ({
      tmdbId: m.id,
      title: m.title,
      year: (m.release_date || '').slice(0, 4) || '—',
      poster: m.poster_path ? tmdbImageUrl(m.poster_path, 'w342') : null,
    }));
    return NextResponse.json(
      { results, page: data.page || page, total_pages: data.total_pages || 1 },
      { status: 200, headers: noStore() }
    );
  } catch (e: any) {
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