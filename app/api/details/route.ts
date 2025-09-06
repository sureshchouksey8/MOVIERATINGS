import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';

// tiny helper to return JSON without NextResponse
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
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return json({ error: 'tmdbId required' }, { status: 400, headers: cacheHeaders(0) });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY; // optional
  if (!TMDB_KEY) return json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: cacheHeaders(0) });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const imdbId: string | null = t?.external_ids?.imdb_id || null;

    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    if (imdbId && OMDB_KEY) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        if (o?.imdbRating && o.imdbRating !== 'N/A') imdbRating = `${o.imdbRating}/10`;
        else if (Array.isArray(o?.Ratings)) {
          const v = o.Ratings.find((r: any) =>
            String(r.Source).toLowerCase().includes('internet movie database')
          )?.Value;
          if (v) imdbRating = v;
        }
        if (Array.isArray(o?.Ratings)) {
          const rt = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
          if (rt) rottenTomatoes = rt;
        }
      } catch { /* ignore */ }
    }

    const details: DetailResult = {
      tmdbId,
      imdbId,
      title: t.title || t.original_title || '—',
      year: (t.release_date || '').slice(0, 4) || '—',
      genres: Array.isArray(t.genres) ? t.genres.map((g: any) => g.name) : [],
      poster: t.poster_path ? tmdbImageUrl(t.poster_path, 'w500') : null,
      plot: t.overview || null,
      imdbRating,
      rottenTomatoes,
      links: {
        imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
        rottenTomatoesSearch: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(t.title || '')}`,
      },
    };

    return json(details, { status: 200, headers: cacheHeaders(86400) });
  } catch (e: any) {
    return json({ error: e?.message || 'Details failed' }, { status: 500, headers: cacheHeaders(0) });
  }
}