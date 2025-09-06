import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStore() {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400, headers: noStore() });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY; // optional
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });

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
          const v = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('internet movie database'))?.Value;
          if (v) imdbRating = v;
        }
        if (Array.isArray(o?.Ratings)) {
          const rt = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
          if (rt) rottenTomatoes = rt;
        }
      } catch {/* ignore */}
    }

    // ---------- Trailer selection (YouTube) ----------
    let trailerKey: string | undefined;
    const vids: any[] = Array.isArray(t?.videos?.results) ? t.videos.results : [];
    // priority: Official Trailer (YouTube) -> any Trailer (YouTube) -> any YouTube video
    const byType = (x: any) => String(x?.type || '').toLowerCase();
    const yt = vids.filter(v => String(v?.site).toLowerCase() === 'youtube');

    trailerKey =
      yt.find(v => byType(v).includes('trailer') && v?.official && v?.key)?.key ||
      yt.find(v => byType(v).includes('trailer') && v?.key)?.key ||
      yt.find(v => v?.key)?.key;

    const title = t.title || t.original_title || '—';
    const year = (t.release_date || '').slice(0, 4) || '—';

    const query = encodeURIComponent(`${title} ${year || ''} official trailer`.trim());

    const details: DetailResult & {
      trailer?: { youtubeKey?: string; embedUrl?: string; searchEmbedUrl?: string; youtubeUrl?: string };
    } = {
      tmdbId,
      imdbId,
      title,
      year,
      genres: Array.isArray(t.genres) ? t.genres.map((g: any) => g.name) : [],
      poster: t.poster_path ? tmdbImageUrl(t.poster_path, 'w500') : null,
      plot: t.overview || null,
      imdbRating,
      rottenTomatoes,
      links: {
        imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
        rottenTomatoesSearch: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`,
      },
      trailer: trailerKey
        ? {
            youtubeKey: trailerKey,
            embedUrl: `https://www.youtube.com/embed/${trailerKey}`,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
          }
        : {
            // no key? use YT search-embed which plays the top result
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
            youtubeUrl: `https://www.youtube.com/results?search_query=${query}`,
          },
    };

    return NextResponse.json(details, { status: 200, headers: noStore() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500, headers: noStore() });
  }
}