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

    // poster
    const posterW = 330, posterH = 495;
    let posterLoaded = false;
    if (detail.poster) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.src = detail.poster;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        // rounded rect mask
        const x = PAD, y = (H - posterH)/2;
        roundRect(ctx, x, y, posterW, posterH, 24); ctx.clip();
        ctx.drawImage(img, x, y, posterW, posterH);
        ctx.restore();
        posterLoaded = true;
      } catch {}
    }
    if (!posterLoaded) {
      // fallback poster box
      ctx.fillStyle = 'rgba(148,163,184,0.2)';
      roundRect(ctx, PAD, (H - posterH)/2, posterW, posterH, 24); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI';
      ctx.fillText('No Poster', PAD + 90, H/2);
    }

    // text
    const rightX = PAD + posterW + 40;
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '600 48px system-ui, -apple-system, Segoe UI';
    wrapText(ctx, detail.title, rightX, PAD + 70, W - rightX - PAD, 54);
    ctx.fillStyle = '#a5b4fc';
    ctx.font = '500 28px system-ui, -apple-system, Segoe UI';
    ctx.fillText(detail.year || '', rightX, PAD + 120);

    // ratings chips
    const chipsY = PAD + 190;
    drawChip(ctx, rightX, chipsY, `IMDb: ${detail.imdbRating || 'N/A'}`);
    drawChip(ctx, rightX + 220, chipsY, `Rotten Tomatoes: ${detail.rottenTomatoes || 'N/A'}`);

    // footer brand
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px system-ui, -apple-system, Segoe UI';
    ctx.fillText('Movie Ratings Finder — only the ratings that matter · by Ronny', rightX, H - PAD);

    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png', 0.95));

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      c.save();
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
      const words = text.split(' ');
      let line = '', yy = y;
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (c.measureText(test).width > maxW) { c.fillText(line, x, yy); line = w; yy += lh; }
        else line = test;
      }
      if (line) c.fillText(line, x, yy);
    }
    function drawChip(c: CanvasRenderingContext2D, x: number, y: number, label: string) {
      const padX = 16, padY = 10;
      c.font = '600 22px system-ui, -apple-system, Segoe UI';
      const w = c.measureText(label).width + padX*2, h = 44;
      c.fillStyle = 'rgba(148,163,184,0.12)';
      roundRect(c, x, y, w, h, 12); c.fill(); c.restore();
      c.fillStyle = '#e2e8f0'; c.fillText(label, x + padX, y + h - padY);
    }
  }

  async function onShare() {
    setBusy(true);
    try {
      const blob = await makeCardBlob();
      const file = new File([blob], 'movie-ratings-card.png', { type: 'image/png' });

      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({
          title: `${detail.title} — ratings`,
          text: 'Only the ratings that matter · by Ronny',
          files: [file],
        });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'movie-ratings-card.png';
        document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (e) {
      // final fallback: open a standard share URL
      try {
        await navigator.share?.({
          title: `${detail.title} — ratings`,
          text: 'Only the ratings that matter · by Ronny',
        });
      } catch {}
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