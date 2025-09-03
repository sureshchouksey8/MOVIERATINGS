'use client';
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetails(tmdbId: number) {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/details?tmdbId=${tmdbId}`);
      const j = await r.json();
      if (r.ok) setDetail(j);
      else setError(j?.error || 'Failed');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12">
      <header className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Movie Ratings Finder</h1>
        <p className="text-sm text-slate-300">Search → pick a movie → see poster + IMDb + Rotten Tomatoes.</p>
        <div className="mt-1 text-xs text-slate-400">
          This product uses the TMDb API but is not endorsed by TMDb.
        </div>
      </header>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
        <SearchBar onSelect={loadDetails} onClearSelection={() => setDetail(null)} />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      {loading && <p className="mt-4 text-sm text-slate-300">Loading details…</p>}

      {detail && (
        <section className="mt-6 grid grid-cols-[auto,1fr] gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
            alt={detail.title}
            className="h-[300px] w-[200px] rounded-xl object-cover shadow-md"
          />
          <div>
            <h2 className="text-2xl font-semibold leading-snug">{detail.title}</h2>
            <p className="text-sm text-slate-300">
              {detail.year} {detail.genres?.length ? <>• <span>{detail.genres.join(', ')}</span></> : null}
            </p>
            {detail.plot && (
              <p className="mt-2 text-sm leading-relaxed text-slate-200/90">{detail.plot}</p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
              <RatingBadge
                label="Rotten Tomatoes"
                value={detail?.rottenTomatoes || null}
                href={detail?.links?.rottenTomatoesSearch}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}