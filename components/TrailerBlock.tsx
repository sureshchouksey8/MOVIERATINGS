'use client';
import React, { useState } from 'react';

export default function TrailerBlock({
  title, year,
  trailer,
}: {
  title: string; year?: string;
  trailer?: { embedUrl?: string; searchEmbedUrl?: string; youtubeUrl?: string };
}) {
  const [useAlt, setUseAlt] = useState(false);
  const ytSearchUrl = `https://www.youtube.com/results?${new URLSearchParams({
    search_query: `${title} ${year || ''} official trailer`,
  }).toString()}`;

  const embedSrc = (!useAlt && trailer?.embedUrl) ? trailer.embedUrl : trailer?.searchEmbedUrl;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Trailer{useAlt ? ' (alternate)' : trailer?.embedUrl ? '' : ' (best match)'}
        </div>
        <div className="flex items-center gap-2">
          {trailer?.searchEmbedUrl && trailer?.embedUrl && (
            <button
              onClick={() => setUseAlt((v) => !v)}
              className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
            >
              {useAlt ? 'Try official' : 'Having trouble? Try alternate'}
            </button>
          )}
          <a
            className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
            href={trailer?.youtubeUrl || ytSearchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open on YouTube ↗
          </a>
        </div>
      </div>

      {embedSrc ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10 shadow-2xl">
          <div className="aspect-video">
            <iframe
              className="h-full w-full"
              src={embedSrc}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}