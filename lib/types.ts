export type SearchResult = {
  tmdbId: number;
  title: string;
  year: string;
  poster: string | null; // full URL
};

export type DetailResult = {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  year: string;
  genres: string[];
  poster: string | null;   // full URL
  backdrop: string | null; // full URL
  plot: string | null;

  // Little facts
  runtime: number | null;       // minutes
  tagline: string | null;
  releaseDate: string | null;   // YYYY-MM-DD

  // Ratings
  imdbRating: string | null;      // e.g., "8.5/10" or null if missing
  rottenTomatoes: string | null;  // e.g., "94%" or null if missing

  // Trailer (if available)
  trailer?: {
    youtubeKey?: string;
    youtubeUrl?: string;
  };

  links: {
    imdb?: string;
    rottenTomatoesSearch?: string;
  };
};