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
      // bust cache explicitly (in addition to server no-store)
      const bust = Date.now();
      const r = await fetch(`/api/details?tmdbId=${tmdbId}&t=${bust}`, { cache: 'no-store', headers: { 'x-no-cache': String(bust) } });
      const j = await r.json();
      if (r.ok) setDetail(j); else setError(j?.error || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Movie Ratings Finder</h1>
          <p className="text-sm text-slate-300">Type → pick a movie → see ratings. Use ✕ to clear.</p>
        </div>
        <div className="text-xs text-slate-400">This product uses the TMDb API but is not endorsed by TMDb.</div>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
        <SearchBar onSelect={loadDetails} onClearSelection={() => setDetail(null)} />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  className="h-[360px] w-[240px] rounded-xl object-cover shadow-md"
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

        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm uppercase tracking-wider text-slate-400">Ratings</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
              <RatingBadge label="Rotten Tomatoes" value={detail?.rottenTomatoes || null} href={detail?.links?.rottenTomatoesSearch} />
            </div>

            {/* Trailer block */}
            {detail?.trailer?.embedUrl ? (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Trailer</div>
                <div className="overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={detail.trailer.embedUrl}
                      title="Official trailer"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ) : detail?.trailer?.searchEmbedUrl ? (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Trailer (best match)</div>
                <div className="overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={detail.trailer.searchEmbedUrl}
                      title="Trailer search"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ) : detail ? (
              <div className="mt-5">
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
                  href={`https://www.youtube.com/results?${new URLSearchParams({ search_query: `${detail.title} ${detail.year || ''} official trailer` }).toString()}`}
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