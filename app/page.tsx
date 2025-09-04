'use client';
import React, { useEffect, useRef, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';
import Backdrop from '@/components/Backdrop';
import TrailerEmbed from '@/components/TrailerEmbed';

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  // Deep link: ?m=<tmdbId>
  useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get('m');
    const id = m ? Number(m) : 0;
    if (id) {
      loadDetails(id, { pushUrl: false, scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDetails(tmdbId: number, opts: { pushUrl?: boolean; scroll?: boolean } = { pushUrl: true, scroll: true }) {
    setError(null);
    setLoading(true);
    try {
      const bust = Date.now();
      const r = await fetch(`/api/details?tmdbId=${tmdbId}&t=${bust}`, {
        cache: 'no-store',
        headers: { 'x-no-cache': String(bust) },
      });
      const j = await r.json();
      if (r.ok) {
        setDetail(j);
        if (opts.pushUrl !== false) {
          const url = new URL(window.location.href);
          url.searchParams.set('m', String(tmdbId));
          history.replaceState(null, '', url.toString());
        }
        if (opts.scroll !== false) {
          requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
      } else {
        setError(j?.error || 'Failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const bgImage = detail?.backdrop || detail?.poster || null;

  async function shareLink() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: detail?.title || 'Movie Ratings', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // ignore
    }
  }

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
                AllThatMatters — OnlyTheRatingsThatMatter
              </div>
              <div className="text-xs sm:text-sm text-slate-300/90">
                by <span className="font-semibold">RONNY</span>
              </div>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            This product uses the TMDb API but is not endorsed by TMDb.
          </div>
        </header>

        {/* Sticky search */}
        <section className="sticky top-6 z-30">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-2xl">
            <SearchBar onSelect={(id) => loadDetails(id)} onClearSelection={() => setDetail(null)} />
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          </div>
        </section>

        {/* Skeleton while first loading */}
        {loading && !detail && (
          <div className="mt-6 grid grid-cols-[auto,1fr] gap-5 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md p-5 shadow-2xl animate-pulse">
            <div className="h-[360px] w-[240px] rounded-xl bg-slate-700/40" />
            <div className="space-y-3">
              <div className="h-7 w-1/2 rounded-md bg-slate-700/40" />
              <div className="h-4 w-1/3 rounded-md bg-slate-700/40" />
              <div className="h-4 w-2/3 rounded-md bg-slate-700/40" />
              <div className="h-4 w-3/4 rounded-md bg-slate-700/40" />
            </div>
          </div>
        )}

        {/* Details */}
        {detail && (
          <section
            ref={detailsRef}
            key={detail.tmdbId}
            className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md p-5 shadow-2xl transition-opacity duration-500"
          >
            <div className="grid grid-cols-[auto,1fr] gap-5">
              {/* Poster (Hollywood look) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={detail.title}
                className="h-[380px] w-[260px] rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
              />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-semibold leading-snug drop-shadow-sm">{detail.title}</h2>

                  {/* Share button */}
                  <button
                    onClick={shareLink}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100 hover:bg-white/15 transition"
                    title="Share"
                  >
                    Share
                  </button>
                  {copied && <span className="text-xs text-emerald-300">Link copied!</span>}
                </div>

                <p className="mt-1 text-sm text-slate-200">
                  {detail.year}
                  {detail.genres?.length ? <> • <span>{detail.genres.join(', ')}</span></> : null}
                </p>

                {/* Little facts */}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300/95">
                  {detail.tagline && <span className="italic">“{detail.tagline}”</span>}
                  {detail.runtime ? <span>⏱ {detail.runtime} min</span> : null}
                  {detail.releaseDate ? <span>📅 {detail.releaseDate}</span> : null}
                </div>

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

                {/* Trailer */}
                {detail?.trailer?.youtubeKey ? (
                  <TrailerEmbed youtubeKey={detail.trailer.youtubeKey} />
                ) : (
                  <div className="mt-5">
                    <a
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
                      href={`https://www.youtube.com/results?${new URLSearchParams({
                        search_query: `${detail.title} trailer`,
                      }).toString()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch trailer on YouTube ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}