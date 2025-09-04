'use client';
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';
import BrandMark from '@/components/BrandMark';
import ShareButton from '@/components/ShareButton';

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetails(tmdbId: number) {
    setError(null); setLoading(true);
    try {
      const bust = Date.now();
      const r = await fetch(`/api/details?tmdbId=${tmdbId}&t=${bust}`, { cache: 'no-store', headers: { 'x-no-cache': String(bust) } });
      const j = await r.json();
      if (r.ok) setDetail(j); else setError(j?.error || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Movie Ratings Finder</h1>
          <p className="text-sm text-slate-300">Type → pick a movie → see ratings. Use ✕ to clear.</p>
        </div>
        <BrandMark />
      </header>

      <section className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
        <SearchBar onSelect={loadDetails} onClearSelection={() => setDetail(null)} />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      {/* Render nothing below until a movie is selected */}
      {detail && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
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
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-4">
              <div>
                <h2 className="mb-2 text-sm uppercase tracking-wider text-slate-400">Ratings</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
                  <RatingBadge label="Rotten Tomatoes" value={detail?.rottenTomatoes || null} href={detail?.links?.rottenTomatoesSearch} />
                </div>
              </div>

              {/* Trailer */}
              {detail?.trailer?.embedUrl ? (
                <div>
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
                <div>
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
              ) : null}

              {/* Share */}
              <div className="pt-2">
                <ShareButton detail={{ title: detail.title, year: detail.year, poster: detail.poster, imdbRating: detail.imdbRating, rottenTomatoes: detail.rottenTomatoes }} />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}