'use client';
import React, { useState } from 'react';

export default function ShareButton({ detail }: { detail: any }) {
  const [downloading, setDownloading] = useState(false);
  if (!detail?.tmdbId) return null;

  const slug = `${(detail.title || 'movie')
    .replace(/[^\w]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')}-${detail.year || ''}`.toLowerCase() || 'movie-card';

  async function handleDownload() {
    try {
      setDownloading(true);
      const url = `/api/share?tmdbId=${detail.tmdbId}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Share API ${res.status}`);
      const blob = await res.blob();
      // basic validation: ensure we really got a PNG
      if (!blob.size || (res.headers.get('content-type') || '').indexOf('image/png') === -1) {
        throw new Error('Bad image payload');
      }
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      // Last-resort fallback: open the API in a new tab (lets user save manually)
      window.open(`/api/share?tmdbId=${detail.tmdbId}`, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        {downloading ? 'Preparing…' : '⬇️ Download share card'}
      </button>
    </div>
  );
}