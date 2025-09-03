import { describe, it, expect } from 'vitest';
import { tmdbImageUrl, rtSearchUrl, imdbTitleUrl } from '@/lib/utils';

describe('utils', () => {
  it('builds TMDb image URL (w342)', () => {
    expect(tmdbImageUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });
  it('builds TMDb image URL (w500)', () => {
    expect(tmdbImageUrl('/poster.png', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.png');
  });
  it('builds Rotten Tomatoes search URL', () => {
    expect(rtSearchUrl('Inception')).toBe('https://www.rottentomatoes.com/search?search=Inception');
  });
  it('builds IMDb title URL when id present', () => {
    expect(imdbTitleUrl('tt1375666')).toBe('https://www.imdb.com/title/tt1375666/');
  });
  it('returns undefined IMDb URL when id missing', () => {
    expect(imdbTitleUrl(null)).toBeUndefined();
  });
});
