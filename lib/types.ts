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
  poster: string | null; // full URL
  plot: string | null;
  imdbRating: string | null; // e.g., "8.5/10" or null if missing
  rottenTomatoes: string | null; // e.g., "94%" or null if missing
  links: {
    imdb?: string;
    rottenTomatoesSearch?: string;
  };
  // NEW: optional trailer info
  trailer?: {
    youtubeKey?: string;
    youtubeUrl?: string;
    embedUrl?: string;        // https://www.youtube.com/embed/<key>
    searchEmbedUrl?: string;  // https://www.youtube.com/embed?listType=search&list=...
  };
};