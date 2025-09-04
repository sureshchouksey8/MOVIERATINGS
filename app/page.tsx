'use client';
import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { RatingBadge } from '@/components/RatingBadge';

// NOTE: Keeping the existing layout you have. We add a header brand line
// and a Share button that generates a downloadable share card image.

export default function Page() {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadDetails(tmdbId: number) {
    setError(null); setLoading(true);
    try {
      const bust = Date.now();
      const r = await fetch(`/api/details?tmdbId=${tmdbId}&t=${bust}`, {
        cache: 'no-store',
        headers: { 'x-no-cache': String(bust) },
      });
      const j = await r.json();
      if (r.ok) setDetail(j); else setError(j?.error || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  // Build & download share card; also try native share with the image file
  async function onShare() {
    if (!detail) return;
    // Try native share of URL first
    try {
      if (navigator.share) {
        await navigator.share({
          title: detail.title,
          text: `${detail.title} (${detail.year}) — Only the ratings that matter`,
          url: window.location.href,
        });
      }
    } catch {/* ignore */}

    // Always generate a downloadable image
    const blob = await generateShareCard(detail);
    if (!blob) return;
    const fileName = `ratings-${slugify(detail.title)}.png`;
    const url = URL.createObjectURL(blob);

    // Try share with image file (if supported)
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if ((navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: detail.title, url: window.location.href });
        URL.revokeObjectURL(url);
        return;
      }
    } catch {/* fallback to download */}

    // Fallback: download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <header className="mb-3">
        <h1 className="text-3xl font-semibold tracking-tight">Movie Ratings Finder</h1>
        <p className="text-sm text-slate-300">
          Only the ratings that matter <span className="opacity-80">— by RONNY</span>
        </p>
      </header>

      <section className="mt-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
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
                {/* Poster */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
                  alt={detail.title}
                  className="h-[360px] w-[240px] rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
                />
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-semibold leading-snug">{detail.title}</h3>
                    <button
                      onClick={onShare}
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100 hover:bg-white/15 transition"
                      title="Share"
                    >
                      Share
                    </button>
                    {copied && <span className="text-xs text-emerald-300">Share card saved!</span>}
                  </div>
                  <p className="text-sm text-slate-300">
                    {detail.year} {detail.genres?.length ? <>• <span>{detail.genres.join(', ')}</span></> : null}
                  </p>

                  {/* Little facts */}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300/95">
                    {detail.tagline ? <span className="italic">“{detail.tagline}”</span> : null}
                    {detail.runtime ? <span>⏱ {detail.runtime} min</span> : null}
                    {detail.releaseDate ? <span>📅 {detail.releaseDate}</span> : null}
                  </div>

                  {/* Trailer (embed if we have a key; else link to YT search) */}
                  {detail?.trailer?.youtubeKey ? (
                    <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-white/10">
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
                  ) : (
                    <div className="mt-3">
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
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm uppercase tracking-wider text-slate-400">Ratings</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RatingBadge label="IMDb" value={detail?.imdbRating || null} href={detail?.links?.imdb} />
            <RatingBadge label="Rotten Tomatoes" value={detail?.rottenTomatoes || null} href={detail?.links?.rottentomatoesSearch || detail?.links?.rottenTomatoesSearch} />
          </div>
        </div>
      </section>
    </div>
  );
}

// --- helpers ---

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function generateShareCard(detail: any): Promise<Blob | null> {
  // Open Graph size
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0f172a'); // slate-900
  g.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Poster (proxied to avoid CORS taint)
  let posterImg: HTMLImageElement | null = null;
  if (detail?.poster) {
    try {
      const proxied = `/api/image-proxy?url=${encodeURIComponent(detail.poster)}`;
      const res = await fetch(proxied, { cache: 'no-store' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      posterImg = await loadImage(url);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  // Draw poster with shadow
  if (posterImg) {
    const PW = 380, PH = Math.round(PW * 1.5);
    const PX = 60, PY = Math.round((H - PH) / 2);
    // shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(posterImg, PX, PY, PW, PH);
    ctx.restore();
  }

  // Text block
  const title = `${detail?.title || ''}`;
  const yearGenres = [detail?.year, Array.isArray(detail?.genres) ? detail.genres.join(', ') : '']
    .filter(Boolean).join(' • ');
  const tagline = detail?.tagline ? `“${detail.tagline}”` : '';
  const imdb = detail?.imdbRating ? `IMDb: ${detail.imdbRating}` : '';
  const rt = detail?.rottenTomatoes ? `Rotten Tomatoes: ${detail.rottenTomatoes}` : '';

  const TX = 480, TY = 150;
  ctx.fillStyle = '#e5e7eb'; // slate-200

  // Title
  ctx.font = 'bold 48px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
  wrapText(ctx, title, TX, TY, 660, 56);

  // Meta
  ctx.font = 'normal 24px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
  ctx.fillStyle = '#cbd5e1'; // slate-300
  wrapText(ctx, yearGenres, TX, TY + 110, 660, 32);

  // Tagline
  if (tagline) {
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.font = 'italic 24px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
    wrapText(ctx, tagline, TX, TY + 160, 660, 32);
  }

  // Ratings
  let rY = TY + 230;
  ctx.font = '600 26px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
  ctx.fillStyle = '#f1f5f9'; // slate-100
  if (imdb) { ctx.fillText(imdb, TX, rY); rY += 40; }
  if (rt)   { ctx.fillText(rt,   TX, rY); rY += 40; }

  // Brand line
  ctx.font = '600 22px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
  ctx.fillStyle = '#93c5fd'; // sky-300
  ctx.fillText('Only the ratings that matter — by RONNY', TX, H - 60);

  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png', 0.92)
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}