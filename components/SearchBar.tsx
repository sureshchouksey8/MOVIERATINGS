'use client';
import React, { useEffect, useState } from 'react';

export default function SearchBar({ onSelect }: { onSelect: (tmdbId: number) => void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ tmdbId: number; title: string; year: string; poster: string | null }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term || term.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const j = await r.json();
        setResults(j.results || []);
        setOpen(true);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl bg-slate-800/70 pl-4 pr-4 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        placeholder="Search any movie…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && (
        <div className="absolute z-10 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
          {loading && <div className="p-3 text-sm text-slate-300">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-slate-400">Type at least 2 characters.</div>
          )}
          <ul className="divide-y divide-slate-700/40">
            {results.map((m) => (
              <li key={m.tmdbId} className="hover:bg-slate-800/40">
                <button
                  className="flex w-full items-center gap-3 p-2 text-left"
                  onClick={() => { setOpen(false); onSelect(m.tmdbId); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.poster || 'https://via.placeholder.com/60x90?text=No+Poster'}
                    alt={m.title}
                    className="h-16 w-12 flex-shrink-0 rounded-md object-cover"
                  />
                  <div>
                    <div className="font-medium leading-tight">{m.title}</div>
                    <div className="text-xs text-slate-400">{m.year}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
