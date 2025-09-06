import { tmdbSearchMovies, tmdbImageUrl } from '@/lib/tmdb';

export const runtime = 'nodejs';

type LiteSearch = {
  tmdbId: number;
  title: string;
  year: string;
  poster: string | null;
};

function json(body: any, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function cacheHeaders(seconds: number) {
  return { 'Cache-Control': `s-maxage=${seconds}, stale-while-revalidate=${Math.max(60, seconds)}` };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q || q.length < 2) {
    return json({ results: [] }, { status: 200, headers: cacheHeaders(30) });
  }

  const TMDB_KEY = process.env.TMDB_KEY;
  if (!TMDB_KEY) return json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: cacheHeaders(0) });

  try {
    const data = await tmdbSearchMovies(q, TMDB_KEY);
    const results: LiteSearch[] = (data.results || []).slice(0, 10).map((m: any) => ({
      tmdbId: m.id,
      title: m.title,
      year: (m.release_date || '').slice(0, 4) || '—',
      poster: m.poster_path ? tmdbImageUrl(m.poster_path, 'w342') : null,
    }));
    return json({ results }, { status: 200, headers: cacheHeaders(120) });
  } catch (e: any) {
    return json({ error: e?.message || 'Search failed' }, { status: 500, headers: cacheHeaders(0) });
  }
}