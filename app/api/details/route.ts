import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId, omdbByTitleYear } from '@/lib/omdb';
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
    const title = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || '';
    const imdbId: string | null = t?.external_ids?.imdb_id || null;

    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    // 1) OMDb by imdbId
    if (OMDB_KEY && imdbId) {
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
          const rt = o.Ratings.find((r: any) =>
            String(r.Source).toLowerCase().includes('rotten')
          )?.Value;
          if (rt) rottenTomatoes = rt;
        }
      } catch {/* ignore */}
    }

    // 2) If still missing, OMDb by title/year
    if (OMDB_KEY && (!imdbRating || !rottenTomatoes)) {
      try {
        const o2 = await omdbByTitleYear(title, year || undefined, OMDB_KEY);
        if (o2?.Response === 'True') {
          if (!imdbRating) {
            if (o2?.imdbRating && o2.imdbRating !== 'N/A') imdbRating = `${o2.imdbRating}/10`;
            else if (Array.isArray(o2?.Ratings)) {
              const v = o2.Ratings.find((r: any) =>
                String(r.Source).toLowerCase().includes('internet movie database')
              )?.Value;
              if (v) imdbRating = v;
            }
          }
          if (!rottenTomatoes && Array.isArray(o2?.Ratings)) {
            const rt = o2.Ratings.find((r: any) =>
              String(r.Source).toLowerCase().includes('rotten')
            )?.Value;
            if (rt) rottenTomatoes = rt;
          }
        }
      } catch {/* ignore */}
    }

    // 3) Trailer pick (YouTube official → fallback to search-embed)
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
    const ytQuery = encodeURIComponent(`${title} ${year || ''} official trailer`.trim());

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
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${ytQuery}`,
          }
        : {
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${ytQuery}`,
          },
    };

    return NextResponse.json(details, { status: 200, headers: noStore() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500, headers: noStore() });
  }
}

function noStore() {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
}