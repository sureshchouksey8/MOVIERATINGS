'use client';
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';
import Backdrop from '@/components/Backdrop';

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetails(tmdbId: number) {
    setError(null);
    setLoading(true);
    try {
      const bust = Date.now();
      const r = await fetch(`/api/details?tmdbId=${tmdbId}&t=${bust}`, {
        cache: 'no-store',
        headers: { 'x-no-cache': String(bust) },
      });
      const j = await r.json();
      if (r.ok) setDetail(j);
      else setError(j?.error || 'Failed');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const bgImage = detail?.backdrop || detail?.poster || null;

  return (
    <>
      <Backdrop imageUrl={bgImage} />

      <div className="mx-auto max-w-screen-xl px-6 pb-24 pt-10">
        {/* Brand */}
        <header className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight drop-shadow-sm">
                Movie Ratings Finder
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Search → pick a movie → see poster + IMDb + Rotten Tomatoes.
              </p>
            </div>

            <div className="text-right">
              <div className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-pink-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent tracking-wide">
                OnlyTheRatingsThatMatter
              </div>
              <div className="text-xs sm:text-sm text-slate-300/90">by <span className="font-semibold">RONNY</span></div>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            This product uses the TMDb API but is not endorsed by TMDb.
          </div>
        </header>

        {/* Sticky search */}
        <section className="sticky top-6 z-30">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-2xl">
            <SearchBar onSelect={loadDetails} onClearSelection={() => setDetail(null)} />
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          </div>
        </section>

        {/* Details */}
        {loading && <p className="mt-6 text-sm text-slate-200/90">Loading details…</p>}

        {detail && (
          <section
            key={detail.tmdbId}
            className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md p-5 shadow-2xl transition-opacity duration-500"
          >
            <div className="grid grid-cols-[auto,1fr] gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={detail.title}
                className="h-[360px] w-[240px] rounded-xl object-cover shadow-xl ring-1 ring-white/10"
              />
              <div>
                <h2 className="text-3xl font-semibold leading-snug drop-shadow-sm">{detail.title}</h2>
                <p className="text-sm text-slate-200">
                  {detail.year} {detail.genres?.length ? <>• <span>{detail.genres.join(', ')}</span></> : null}
                </p>
                {detail.plot && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-200/90">{detail.plot}</p>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
                  <RatingBadge
                    label="Rotten Tomatoes"
                    value={detail?.rottenTomatoes || null}
                    href={detail?.links?.rottenTomatoesSearch}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}