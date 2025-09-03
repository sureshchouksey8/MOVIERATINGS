import { tmdbImageUrl } from '@/lib/utils';

const TMDB = {
  base: 'https://api.themoviedb.org/3',
};

export async function tmdbSearchMovies(q: string, key: string) {
  const url = `${TMDB.base}/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
  const headers: Record<string, string> = {};
  if (key.startsWith('ey')) headers.Authorization = `Bearer ${key}`; // TMDb v4 token
  const res = await fetch(url, { headers });
  // Support both API key styles: v3 (?api_key=) and v4 (Bearer)
  if (res.status === 401 || res.status === 404) {
    // try v3 fallback
    const res2 = await fetch(`${url}&api_key=${encodeURIComponent(key)}`);
    if (!res2.ok) throw new Error('TMDb search failed');
    return res2.json();
  }
  if (!res.ok) throw new Error('TMDb search failed');
  return res.json();
}

export async function tmdbMovieDetails(tmdbId: number, key: string) {
  const baseUrl = `${TMDB.base}/movie/${tmdbId}?append_to_response=external_ids`;
  const headers: Record<string, string> = {};
  if (key.startsWith('ey')) headers.Authorization = `Bearer ${key}`; // TMDb v4 token
  const res = await fetch(baseUrl, { headers });
  if (res.status === 401 || res.status === 404) {
    const res2 = await fetch(`${baseUrl}&api_key=${encodeURIComponent(key)}`);
    if (!res2.ok) throw new Error('TMDb details failed');
    return res2.json();
  }
  if (!res.ok) throw new Error('TMDb details failed');
  return res.json();
}

export { tmdbImageUrl };
