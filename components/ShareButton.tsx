'use client';
import React, { useState } from 'react';

type Detail = {
  title: string; year: string; poster: string | null;
  imdbRating: string | null; rottenTomatoes: string | null;
};

export default function ShareButton({ detail }: { detail: Detail }) {
  const [busy, setBusy] = useState(false);

  async function makeCardBlob(): Promise<Blob> {
    const W = 1200, H = 630, PAD = 40;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // bg
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#111827');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // glow
    const glow = ctx.createRadialGradient(W*0.75, H*0.2, 10, W*0.75, H*0.2, W*0.8);
    glow.addColorStop(0, 'rgba(99,102,241,0.25)');
    glow.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(W*0.75, H*0.2, W*0.8, 0, Math.PI*2); ctx.fill();

    // poster via proxy to avoid CORS taint
    const posterW = 330, posterH = 495;
    const x = PAD, y = (H - posterH)/2;

    if (detail.poster) {
      try {
        const proxied = `/api/proxy-image?u=${encodeURIComponent(detail.poster)}`;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.src = proxied;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

        roundRect(ctx, x, y, posterW, posterH, 24); ctx.clip();
        ctx.drawImage(img, x, y, posterW, posterH);
        ctx.restore();
      } catch {
        drawPosterFallback();
      }
    } else {
      drawPosterFallback();
    }

    // title
    const rightX = PAD + posterW + 40;
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '600 48px system-ui, -apple-system, Segoe UI';
    wrapText(ctx, detail.title, rightX, PAD + 70, W - rightX - PAD, 54);
    ctx.fillStyle = '#a5b4fc';
    ctx.font = '500 28px system-ui, -apple-system, Segoe UI';
    ctx.fillText(detail.year || '', rightX, PAD + 120);

    // chips
    drawChip(`IMDb: ${detail.imdbRating || 'N/A'}`, rightX, PAD + 190);
    drawChip(`Rotten Tomatoes: ${detail.rottenTomatoes || 'N/A'}`, rightX + 280, PAD + 190);

    // footer
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px system-ui, -apple-system, Segoe UI';
    ctx.fillText('Movie Ratings Finder — only the ratings that matter · by Ronny', rightX, H - PAD);

    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png', 0.95));

    function drawPosterFallback() {
      ctx.fillStyle = 'rgba(148,163,184,0.2)';
      roundRect(ctx, x, y, posterW, posterH, 24); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI';
      ctx.fillText('No Poster', x + 90, H/2);
    }
    function roundRect(c: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, r: number) {
      c.save(); c.beginPath();
      c.moveTo(x0 + r, y0);
      c.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
      c.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
      c.arcTo(x0, y0 + h, x0, y0, r);
      c.arcTo(x0, y0, x0 + w, y0, r);
      c.closePath();
    }
    function wrapText(c: CanvasRenderingContext2D, text: string, x1: number, y1: number, maxW: number, lh: number) {
      const words = text.split(' '); let line = '', yy = y1;
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (c.measureText(test).width > maxW) { c.fillText(line, x1, yy); line = w; yy += lh; }
        else line = test;
      }
      if (line) c.fillText(line, x1, yy);
    }
    function drawChip(label: string, cx: number, cy: number) {
      const padX = 16, padY = 10;
      ctx.font = '600 22px system-ui, -apple-system, Segoe UI';
      const w = ctx.measureText(label).width + padX*2, h = 44;
      ctx.fillStyle = 'rgba(148,163,184,0.12)';
      roundRect(ctx, cx, cy, w, h, 12); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(label, cx + padX, cy + h - padY);
    }
  }

  async function onShare() {
    setBusy(true);
    try {
      const blob = await makeCardBlob();
      const file = new File([blob], 'movie-ratings-card.png', { type: 'image/png' });

      const navAny = navigator as any;
      if (navAny.canShare?.({ files: [file] })) {
        await navAny.share({
          title: `${detail.title} — ratings`,
          text: 'Only the ratings that matter · by Ronny',
          files: [file],
        });
      } else {
        // fallback: auto-download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'movie-ratings-card.png';
        document.body.appendChild(a); a.click(); a.remove();
      }
    } catch {
      // ultimate fallback: minimal text share (what you saw earlier)
      try { await navigator.share?.({ title: `${detail.title} — ratings` }); } catch {}
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onShare}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition disabled:opacity-50"
      title="Share or download a poster-style card"
    >
      {busy ? 'Preparing…' : 'Share / Download Card'}
    </button>
  );
}