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
  const OMDB_KEY = process.env.OMDB_KEY; // optional; without it, we’ll return N/A for RT/IMDb
  if (!TMDB_KEY) return NextResponse.json({ error: 'Server missing TMDB_KEY' }, { status: 500 });

  try {
    const t = await tmdbMovieDetails(tmdbId, TMDB_KEY);
    const imdbId: string | null = t?.external_ids?.imdb_id || null;

    let imdbRating: string | null = null;
    let rottenTomatoes: string | null = null;

    if (imdbId && OMDB_KEY) {
      try {
        const o = await omdbByImdbId(imdbId, OMDB_KEY);
        // IMDb rating
        if (o?.imdbRating && o.imdbRating !== 'N/A') imdbRating = `${o.imdbRating}/10`;
        else if (Array.isArray(o?.Ratings)) {
          const imdbFromRatings = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('internet movie database'))?.Value;
          if (imdbFromRatings) imdbRating = imdbFromRatings;
        }
        // Rotten Tomatoes from OMDb Ratings array, if present
        if (Array.isArray(o?.Ratings)) {
          const rt = o.Ratings.find((r: any) => String(r.Source).toLowerCase().includes('rotten'))?.Value;
          if (rt) rottenTomatoes = rt; // like "94%"
        }
      } catch {
        // gracefully ignore
      }
    }
