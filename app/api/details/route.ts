import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Ratings
    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    if (imdbId && OMDB_KEY) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        if (o?.imdbRating && o.imdbRating !== 'N/A') imdbRating = `${o.imdbRating}/10`;
        else if (Array.isArray(o?.Ratings)) {
          const imdbFromRatings = o.Ratings.find(
            (r: any) => String(r.Source).toLowerCase().includes('internet movie database')
          )?.Value;
          if (imdbFromRatings) imdbRating = imdbFromRatings;
        }
        if (Array.isArray(o?.Ratings)) {
          const rt = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
          if (rt) rottenTomatoes = rt;
        }
      } catch {
        // ignore OMDb failures
      }
    }

    // Smarter trailer selection from TMDb videos
    let trailerKey: string | undefined;
    const vids = Array.isArray(t?.videos?.results) ? t.videos.results : [];
    if (vids.length) {
      const sorted = [...vids]
        .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
        .sort((a: any, b: any) => {
          // Prefer "Official Trailer" and official=true, then latest published_at
          const aScore =
            (a.official ? 2 : 0) +
            (String(a.name || '').toLowerCase().includes('official trailer') ? 3 : 0) +
            (a.type === 'Trailer' ? 1 : 0);
          const bScore =
            (b.official ? 2 : 0) +
            (String(b.name || '').toLowerCase().includes('official trailer') ? 3 : 0) +
            (b.type === 'Trailer' ? 1 : 0);
          if (bScore !== aScore) return bScore - aScore;
          return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
        });
      trailerKey = sorted[0]?.key;
    }

    const details: DetailResult = {
      tmdbId,
      imdbId,
      title: t.title || t.original_title || '—',
      year: (t.release_date || '').slice(0, 4) || '—',
      genres: Array.isArray(t.genres) ? t.genres.map((g: any) => g.name) : [],
      poster: t.poster_path ? tmdbImageUrl(t.poster_path, 'w500') : null,
      plot: t.overview || null,

      // facts
      backdrop: t.backdrop_path ? tmdbImageUrl(t.backdrop_path, 'original') : (t.poster_path ? tmdbImageUrl(t.poster_path, 'w500') : null),
      runtime: Number.isFinite(t?.runtime) ? Number(t.runtime) : null,
      tagline: t?.tagline || null,
      releaseDate: t?.release_date || null,

      imdbRating,
      rottenTomatoes,
      trailer: trailerKey
        ? {
            youtubeKey: trailerKey,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
          }
        : undefined,

      links: {
        imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
        rottenTomatoesSearch: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(t.title || '')}`,
      },
    };

    return NextResponse.json(details, { status: 200, headers: noStore() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Details failed' }, { status: 500, headers: noStore() });
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