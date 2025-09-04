'use client';
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetails(tmdbId: number) {
    setError(null); setLoading(true);
    try {
      const r = await fetch(`/api/details?tmdbId=${tmdbId}`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok) setDetail(j); else setError(j?.error || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
      <header className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Movie Ratings Finder</h1>
            <p className="text-xs sm:text-sm text-slate-300">Type → pick a movie → see ratings. Use ✕ to clear.</p>
          </div>
          {/* brand line on the right, rainbow gradient */}
          <div className="text-right">
            <div className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-pink-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent tracking-wide">
              Only the ratings that matter — by RONNY
            </div>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">This product uses the TMDb API but is not endorsed by TMDb.</div>
      </header>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
        <SearchBar onSelect={loadDetails} onClearSelection={() => setDetail(null)} />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Poster + summary */}
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-sm uppercase tracking-wider text-slate-400">Selected</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
            {!detail ? (
              <div className="text-slate-300">Search and choose a movie.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
                  alt={detail.title}
                  className="h-[380px] w-[260px] rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
                />
                <div>
                  <h3 className="text-2xl font-semibold leading-snug">{detail.title}</h3>
                  <p className="text-sm text-slate-300">
                    {detail.year} {detail.genres?.length ? <>• <span>{detail.genres.join(', ')}</span></> : null}
                  </p>
                  {detail.plot && <p className="mt-2 text-sm leading-relaxed text-slate-200/90">{detail.plot}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Ratings + Trailer directly beneath */}
        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm uppercase tracking-wider text-slate-400">Ratings</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
              <RatingBadge label="Rotten Tomatoes" value={detail?.rottenTomatoes || null} href={detail?.links?.rottenTomatoesSearch} />
            </div>

            {/* Trailer fills space below ratings */}
            {detail?.trailer?.youtubeKey ? (
              <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl">
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${detail.trailer.youtubeKey}`}
                    title="Official trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            ) : detail?.title ? (
              <div className="mt-5">
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
                  href={`https://www.youtube.com/results?${new URLSearchParams({ search_query: `${detail.title} trailer` }).toString()}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch trailer on YouTube ↗
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}