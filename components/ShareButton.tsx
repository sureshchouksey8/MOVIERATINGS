'use client';
import React from 'react';

export default function ShareButton({ detail }: { detail: any }) {
  if (!detail?.tmdbId) return null;

  const slug = `${(detail.title || 'movie').replace(/[^\w]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${detail.year || ''}`.toLowerCase();
  const href = `/api/share?tmdbId=${detail.tmdbId}`;

  return (
    <div className="mt-3 flex items-center gap-2">
      <a
        href={href}
        download={`${slug || 'movie-card'}.png`}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        ⬇️ Download share card
      </a>
    </div>
  );
}