import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId, omdbFindByCandidates } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400 });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY || '';
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500 });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const rawTitle = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || null;

    // Build a smart candidate list for OMDb title fallback
    const candidates = buildTitleCandidates(rawTitle, t?.original_title, t?.tagline);

    // Ratings
    let imdbId: string | null = t?.external_ids?.imdb_id || null;
    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    // Helper to extract ratings from an OMDb full record
    function applyOmdb(o: any) {
      if (!o) return;
      if (!imdbId && o.imdbID) imdbId = o.imdbID;

      if (o?.imdbRating && o.imdbRating !== 'N/A') {
        imdbRating = `${o.imdbRating}/10`;
      } else if (Array.isArray(o?.Ratings)) {
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

    // 1) Prefer IMDb ID if TMDb provided one
    if (OMDB_KEY && imdbId) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        if (o?.Response === 'True') applyOmdb(o);
      } catch {/* ignore and fall back */}
    }

    // 2) Fallback by title/year IF we still have no ratings
    if (OMDB_KEY && !imdbRating && !rottenTomatoes) {
      try {
        const o2 = await omdbFindByCandidates(candidates, year, OMDB_KEY);
        if (o2) applyOmdb(o2);
      } catch {/* ignore */}
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

    // Send no-store so we never cache a temporary “N/A”
    return NextResponse.json(details, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500 });
  }
}

/** Heuristics to turn messy titles into movie title candidates for OMDb. */
function buildTitleCandidates(...titles: Array<string | undefined>) {
  const set = new Set<string>();

  for (const raw of titles) {
    if (!raw) continue;
    const base = raw.trim();

    // 1) Add as-is
    push(base);

    // 2) Strip bracketed parts
    push(base.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').replace(/\s{2,}/g, ' ').trim());

    // 3) If contains “from 'X'” or “from “X””, add X
    const fromMatch = base.match(/from\s+['"]([^'"]+)['"]/i);
    if (fromMatch?.[1]) push(fromMatch[1].trim());

    // 4) Split on dashes/colons and try parts (both sides)
    for (const part of base.split(/[:\-–—]\s*/)) {
      if (part) push(part.trim());
    }

    // 5) Remove common noise words (music video / song / trailer etc.)
    push(
      base
        .toLowerCase()
        .replace(/\b(official|full|video|song|lyric|lyrical|audio|remix|trailer|teaser|promo|4k|hdr|feat\.?|ft\.?)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    );
  }

  // Clean + uniq, drop tiny strings
  return Array.from(set).filter((s) => s && s.length > 2);

  function push(s: string) {
    const v = (s || '').trim();
    if (v) set.add(v);
  }
}