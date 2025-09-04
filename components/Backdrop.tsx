import React from 'react';

export default function Backdrop({ imageUrl }: { imageUrl: string | null | undefined }) {
  if (!imageUrl) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-center bg-cover opacity-60 blur-3xl scale-110 transition-opacity duration-500"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      {/* gradient vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
    </div>
  );
}