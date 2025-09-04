const TMDB = {
  base: 'https://api.themoviedb.org/3',
  image: (path: string, size: 'w342' | 'w500' | 'original' = 'w342') =>
    `https://image.tmdb.org/t/p/${size}${path}`,
};

export async function tmdbSearchMovies(q: string, key: string, page = 1) {
  // page is optional; route can pass it for "More results…"
  const url = `${TMDB.base}/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=${page}`;
  const headers: Record<string, string> = {};
  if (key.startsWith('ey')) headers.Authorization = `Bearer ${key}`; // TMDB v4 token (starts with 'ey')

  const res = await fetch(url, { headers });
  if (res.status === 401 || res.status === 404) {
    // Fallback to v3 key if v4 bearer wasn’t accepted
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
  if (key.startsWith('ey')) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(baseUrl, { headers });
  if (res.status === 401 || res.status === 404) {
    const res2 = await fetch(`${baseUrl}&api_key=${encodeURIComponent(key)}`);
    if (!res2.ok) throw new Error('TMDb details failed');
    return res2.json();
  }
  if (!res.ok) throw new Error('TMDb details failed');
  return res.json();
}

export const tmdbImageUrl = TMDB.image;