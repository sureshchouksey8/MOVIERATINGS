import { NextResponse } from 'next/server';
import { tmdbMovieDetails, tmdbImageUrl } from '@/lib/tmdb';
import { omdbByImdbId, omdbFindByCandidates, imdbRatingFromHtml } from '@/lib/omdb';
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400, headers: noStore() });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY || '';
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const title = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || null;

    let imdbId: string | null = t?.external_ids?.imdb_id || null;
    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

<<<<<<< HEAD
    // ---- Ratings path 1: OMDb via imdbId
=======
    // ---------- Ratings (robust tri-path) ----------
    // 1) OMDb by imdbId
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
    if (OMDB_KEY && imdbId) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        if (o?.Response === 'True') {
          if (o?.imdbRating && o.imdbRating !== 'N/A') imdbRating = `${o.imdbRating}/10`;
          else if (Array.isArray(o?.Ratings)) {
<<<<<<< HEAD
            const v = o.Ratings.find((r: any) =>
              String(r.Source).toLowerCase().includes('internet movie database')
            )?.Value;
            if (v) imdbRating = v;
=======
            const v = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('internet movie database'))?.Value;
            if (v) imdbRating = v;
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
          }
          if (Array.isArray(o?.Ratings)) {
            const rt = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
            if (rt) rottenTomatoes = rt;
          }
        }
<<<<<<< HEAD
      } catch { /* continue */ }
=======
      } catch {/* continue */}
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
    }
<<<<<<< HEAD

    // ---- Ratings path 2: IMDb JSON-LD scrape (when imdbId exists but OMDb lacks rating)
=======
    // 2) If still no IMDb rating and we DO have imdbId, scrape IMDb JSON-LD
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
    if (!imdbRating && imdbId) {
      const scraped = await imdbRatingFromHtml(imdbId);
      if (scraped) imdbRating = scraped;
    }
<<<<<<< HEAD

    // ---- Ratings path 3: OMDb by title/year with smart candidates (when no imdbId or still missing)
=======
    // 3) If no imdbId or still missing ratings, OMDb by smart title/year candidates
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
    if (OMDB_KEY && (!imdbId || (!imdbRating && !rottenTomatoes))) {
      try {
        const o2 = await omdbFindByCandidates(buildTitleCandidates(title, t?.original_title, t?.tagline), year, OMDB_KEY);
        if (o2) {
          if (!imdbId && o2.imdbID) imdbId = o2.imdbID;
          if (!imdbRating) {
            if (o2?.imdbRating && o2.imdbRating !== 'N/A') imdbRating = `${o2.imdbRating}/10`;
            else if (Array.isArray(o2?.Ratings)) {
<<<<<<< HEAD
              const v = o2.Ratings.find((r: any) =>
                String(r.Source).toLowerCase().includes('internet movie database')
              )?.Value;
              if (v) imdbRating = v;
=======
              const v = o2.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('internet movie database'))?.Value;
              if (v) imdbRating = v;
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
            }
          }
          if (!rottenTomatoes && Array.isArray(o2?.Ratings)) {
            const rt = o2.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
            if (rt) rottenTomatoes = rt;
          }
        }
      } catch {/* ignore */}
    }

<<<<<<< HEAD
    // ---- Trailer selection
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

    const query = encodeURIComponent(`${title} ${year || ''} official trailer`.trim());

=======
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

    const query = encodeURIComponent(`${title} ${year || ''} official trailer`.trim());
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
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
<<<<<<< HEAD
      trailer: trailerKey
        ? {
            youtubeKey: trailerKey,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
            embedUrl: `https://www.youtube.com/embed/${trailerKey}`,
          }
        : {
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
          },
=======
      trailer: trailerKey
        ? {
            youtubeKey: trailerKey,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
            embedUrl: `https://www.youtube.com/embed/${trailerKey}`,
          }
        : {
            // no key? use YT search-embed which plays the top result
            searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
          },
>>>>>>> 45b4f786ff96d024261973ad06b1a6942f078547
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

/** Normalize messy titles (songs/trailers) into movie-title candidates for OMDb. */
function buildTitleCandidates(...titles: Array<string | undefined>) {
  const set = new Set<string>();
  for (const raw of titles) {
    if (!raw) continue;
    const base = raw.trim();
    push(base); // as-is
    push(base.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()); // strip brackets
    const fromMatch = base.match(/from\s+['"]([^'"]+)['"]/i);
    if (fromMatch?.[1]) push(fromMatch[1].trim()); // “Param Sundari (from ‘Mimi’)” → Mimi
    for (const part of base.split(/[:\-–—]\s*/)) if (part) push(part.trim()); // split
    push(
      base
        .toLowerCase()
        .replace(/\b(official|full|video|song|lyric|lyrical|audio|remix|trailer|teaser|promo|4k|hdr|feat\.?|ft\.?)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    );
  }
  return Array.from(set).filter((s) => s && s.length > 2);
  function push(s: string) { const v = (s || '').trim(); if (v) set.add(v); }
}