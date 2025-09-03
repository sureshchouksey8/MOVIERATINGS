# Movie Ratings Finder (Next.js, server-side keys)

Users just search → click → see **poster + IMDb + Rotten Tomatoes (when available)**.
No keys in the browser. TMDb/OMDb keys live on the server.

## Quick start

```bash
npm install
cp .env.example .env.local
# edit .env.local with your keys
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

- Add env vars in the project settings:
  - `TMDB_KEY` (required)
  - `OMDB_KEY` (optional but recommended)
  - `SITE_NAME` (optional UI text)
- Deploy. Done.

## Notes

- Search & posters: **TMDb**
- Ratings: **IMDb** (from OMDb `imdbRating`) and **Rotten Tomatoes** if present in OMDb `Ratings`.
- We do **not** scrape RT; we link to RT search if no score is available.
