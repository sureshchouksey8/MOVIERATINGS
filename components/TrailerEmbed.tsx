import React from 'react';

export default function TrailerEmbed({ youtubeKey }: { youtubeKey: string }) {
  const src = `https://www.youtube.com/embed/${youtubeKey}`;
  return (
    <div className="mt-5 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
      <div className="aspect-video">
        <iframe
          className="w-full h-full"
          src={src}
          title="YouTube trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}