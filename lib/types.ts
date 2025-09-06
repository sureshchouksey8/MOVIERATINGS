export type TrailerInfo = {
  youtubeKey?: string;
  embedUrl?: string;        // https://www.youtube.com/embed/<key>
  youtubeUrl?: string;      // https://www.youtube.com/watch?v=<key>
  searchEmbedUrl?: string;  // YT search-embed fallback
};

export type DetailResult = {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  year: string;
  genres: string[];
  poster: string | null;
  plot: string | null;
  imdbRating: string | null;
  rottenTomatoes: string | null;
  links: {
    imdb?: string;
    rottenTomatoesSearch?: string;
  };
  trailer?: TrailerInfo; // <-- add this
};