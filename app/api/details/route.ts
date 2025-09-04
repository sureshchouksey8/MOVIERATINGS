import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId, omdbFindByCandidates, imdbRatingFromHtml } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400, headers: noStore() });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY || ''; // optional
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const rawTitle = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || null;

    let imdbId: string | null = t?.external_ids?.imdb_id || null;
    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    // 1) OMDb via imdbId (best path)
    if (OMDB_KEY && imdbId) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        if (o?.Response === 'True') {
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
        }
      } catch { /* ignore; try fallbacks */ }
    }

    // 2) If still no IMDb rating but we DO have an imdbId, scrape IMDb JSON-LD
    if (!imdbRating && imdbId) {
      const scraped = await imdbRatingFromHtml(imdbId);
      if (scraped) imdbRating = scraped;
    }

    // 3) If no imdbId or no rating yet, try OMDb by title/year with smart candidates
    if (OMDB_KEY && (!imdbId || (!imdbRating && !rottenTomatoes))) {
      try {
        const candidates = buildTitleCandidates(rawTitle, t?.original_title, t?.tagline);
        const o2 = await omdbFindByCandidates(candidates, year, OMDB_KEY);
        if (o2) {
          if (!imdbId && o2.imdbID) imdbId = o2.imdbID;
          if (!imdbRating) {
            if (o2?.imdbRating && o2.imdbRating !== 'N/A') imdbRating = `${o2.imdbRating}/10`;
            else if (Array.isArray(o2?.Ratings)) {
              const imdbFromRatings = o2.Ratings.find((r: any) =>
                String(r.Source).toLowerCase().includes('internet movie database')
              )?.Value;
              if (imdbFromRatings) imdbRating = imdbFromRatings;
            }
          }
          if (!rottenTomatoes && Array.isArray(o2?.Ratings)) {
            const rt = o2.Ratings.find((r: any) =>
              String(r.Source).toLowerCase().includes('rotten')
            )?.Value;
            if (rt) rottenTomatoes = rt;
          }
        }
      } catch { /* ignore */ }
    }

    const details: DetailResult = {
      tmdbId,
      imdbId,
      title: rawTitle || '—',
      year: year || '—',
      genres: Array.isArray(t.genres) ? t.genres.map((g: any) => g.name) : [],
      poster: t.poster_path ? tmdbImageUrl(t.poster_path, 'w500') : null,
      plot: t.overview || null,
      imdbRating,
      rottenTomatoes,
      links: {
        imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
        rottenTomatoesSearch: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(rawTitle)}`,
      },
    };

    return NextResponse.json(details, { status: 200, headers: noStore() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500, headers: noStore() });
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

/** Heuristics: turn messy titles into movie-title candidates for OMDb fallback. */
function buildTitleCandidates(...titles: Array<string | undefined>) {
  const set = new Set<string>();
  for (const raw of titles) {
    if (!raw) continue;
    const base = raw.trim();

    push(base); // as-is
    push(base.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()); // strip brackets

    const fromMatch = base.match(/from\s+['"]([^'"]+)['"]/i);
    if (fromMatch?.[1]) push(fromMatch[1].trim()); // “Param Sundari (from ‘Mimi’)” → Mimi

    for (const part of base.split(/[:\-–—]\s*/)) if (part) push(part.trim()); // split at dash/colon

    push(
      base
        .toLowerCase()
        .replace(/\b(official|full|video|song|lyric|lyrical|audio|remix|trailer|teaser|promo|4k|hdr|feat\.?|ft\.?)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    );
  }
  return Array.from(set).filter((s) => s && s.length > 2);

  function push(s: string) {
    const v = (s || '').trim();
    if (v) set.add(v);
  }
}