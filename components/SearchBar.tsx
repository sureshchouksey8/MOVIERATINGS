'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function SearchBar({
  onSelect,
  onClearSelection,
}: {
  onSelect: (tmdbId: number) => void;
  onClearSelection?: () => void;
}) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ tmdbId: number; title: string; year: string; poster: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const querySeq = useRef(0);

  useEffect(() => {
    const term = q.trim();

    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const seq = ++querySeq.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    const bust = Date.now();
    fetch(`/api/search?q=${encodeURIComponent(term)}&t=${bust}`, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { 'x-no-cache': String(bust) },
    })
      .then(async (r) => r.json())
      .then((j) => {
        if (seq === querySeq.current) {
          setResults(j.results || []);
          setOpen(true);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // optional: surface error state
        }
      })
      .finally(() => {
        if (seq === querySeq.current) setLoading(false);
      });

    return () => ctrl.abort();
  }, [q]);

  function clearAll() {
    setQ('');
    setResults([]);
    setOpen(false);
    onClearSelection?.();
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl bg-slate-800/70 pl-11 pr-10 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        placeholder="Search any movie…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clearAll();
        }}
        onFocus={() => { if (results.length >= 1) setOpen(true); }}
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
      {q && (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-slate-700/60"
          onClick={clearAll}
        >
          ✕
        </button>
      )}
      {open && (
        <div className="absolute z-10 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
          {loading && <div className="p-3 text-sm text-slate-300">Searching…</div>}
          {!loading && results.length === 0 && <div className="p-3 text-sm text-slate-400">No matches. Try a different title.</div>}
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