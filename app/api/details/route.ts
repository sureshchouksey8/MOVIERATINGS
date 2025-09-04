import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400 });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY; // optional
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500 });

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
          const imdbFromRatings = o.Ratings.find((r: any) =>
            String(r.Source).toLowerCase().includes('internet movie database')
          )?.Value;
          if (imdbFromRatings) imdbRating = imdbFromRatings;
        }
        if (Array.isArray(o?.Ratings)) {
          const rt = o.Ratings.find((r: any) =>
            String(r.Source).toLowerCase().includes('rotten')
          )?.Value;
          if (rt) rottenTomatoes = rt;
        }
      } catch { /* ignore */ }
    }

    // ---------- Trailer selection ----------
    let trailerKey: string | undefined;
    const vids = Array.isArray(t?.videos?.results) ? t.videos.results : [];
    if (vids.length) {
      const sorted = [...vids]
        .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
        .sort((a: any, b: any) => {
          const score = (x: any) =>
            (x.official ? 2 : 0) +
            (String(x.name || '').toLowerCase().includes('official trailer') ? 3 : 0) +
            (x.type === 'Trailer' ? 1 : 0);
          const sA = score(a), sB = score(b);
          if (sB !== sA) return sB - sA;
          return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
        });
      trailerKey = sorted[0]?.key;
    }
    const title = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || '';
    const query = encodeURIComponent(`${title} ${year || ''} official trailer`.trim());

    const details: DetailResult = {
      tmdbId,
      imdbId,
      title: title || '—',
      year: year || '—',
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
            youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
            embedUrl: `https://www.youtube.com/embed/${trailerKey}`,
            // also give a search-embed as a backup
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
          }
        : {
            // no key? use YT search-embed which plays the top result
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
          },
    };

    return NextResponse.json(details, { status: 200, headers: cacheHeaders(86400) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500 });
  }
}

function cacheHeaders(seconds: number) {
  return {
    'Cache-Control': `s-maxage=${seconds}, stale-while-revalidate=${Math.max(60, seconds)}`,
  };
}