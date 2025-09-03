export function tmdbImageUrl(path: string, size: 'w342' | 'w500' | 'original' = 'w342'): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function rtSearchUrl(title: string): string {
  return `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`;
}

export function imdbTitleUrl(imdbId?: string | null): string | undefined {
  return imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined;
}
