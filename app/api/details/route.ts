// ...imports unchanged...
import type { DetailResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId') || '');
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId required' }, { status: 400, headers: noStore() });

  const TMDB_KEY = process.env.TMDB_KEY;
  const OMDB_KEY = process.env.OMDB_KEY;
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500, headers: noStore() });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const imdbId: string | null = t?.external_ids?.imdb_id || null;

    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    // Path 1: OMDb by imdbId
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
      } catch { /* ignore */ }
    }

    // Path 2: OMDb by Title/Year if still needed
    if (OMDB_KEY && (!imdbRating || !rottenTomatoes)) {
      try {
        const title = t.title || t.original_title || '';
        const year = (t.release_date || '').slice(0, 4) || undefined;
        const o2 = await omdbByTitleYear(title, year, OMDB_KEY);
        if (o2?.Response === 'True') {
          if (!imdbRating) {
            if (o2?.imdbRating && o2.imdbRating !== 'N/A') imdbRating = `${o2.imdbRating}/10`;
            else if (Array.isArray(o2?.Ratings)) {
              const v = o2.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('internet movie database'))?.Value;
              if (v) imdbRating = v;
            }
          }
          if (!rottenTomatoes && Array.isArray(o2?.Ratings)) {
            const rt = o2.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
            if (rt) rottenTomatoes = rt;
          }
        }
      } catch { /* ignore */ }
    }

    // ---------- Trailer selection ----------
    const title = t.title || t.original_title || '';
    const year = (t.release_date || '').slice(0, 4) || '';
    const vids = Array.isArray(t?.videos?.results) ? t.videos.results : [];
    const best =
      vids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
      vids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ??
      vids.find((v: any) => v.site === 'YouTube');

    let trailer: DetailResult['trailer'] | undefined = undefined;
    const query = encodeURIComponent(`${title} ${year} official trailer`.trim());

    if (best?.key) {
      trailer = {
        youtubeKey: best.key,
        embedUrl: `https://www.youtube.com/embed/${best.key}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${best.key}`,
        // always provide a search-embed fallback:
        searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
      };
    } else {
      trailer = {
        searchEmbedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
      };
    }

    const details: DetailResult = {
      tmdbId,
      imdbId,
      title,
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
      trailer, // <-- include it
    };

    return NextResponse.json(details, { status: 200, headers: noStore() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Details failed' }, { status: 500, headers: noStore() });
  }
}

function noStore() {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
}