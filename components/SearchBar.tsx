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
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global "/" hotkey to focus the input
  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onDocKey);
    return () => document.removeEventListener('keydown', onDocKey);
  }, []);

  useEffect(() => {
    const term = q.trim();

    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const id = ++seq.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setOpen(true);

    const t = setTimeout(async () => {
      const bust = Date.now();
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}&t=${bust}`, {
          signal: ctrl.signal,
          cache: 'no-store',
          headers: { 'x-no-cache': String(bust) },
        });
        const j = await r.json();
        if (id === seq.current) {
          setResults(j.results || []);
          setOpen(true);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && id === seq.current) {
          setResults([]);
          setOpen(false);
        }
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 200);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  function clearAll() {
    setQ('');
    setResults([]);
    setOpen(false);
    onClearSelection?.();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function pick(tmdbId: number) {
    onSelect(tmdbId);
    setQ('');
    setResults([]);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative">
      <input
        id="movie-search-input"
        ref={inputRef}
        className="w-full rounded-xl bg-slate-800/70 pl-11 pr-10 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        placeholder="Search any movie… (press / to focus)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clearAll();
          if (e.key === 'Enter' && open && results.length > 0) {
            e.preventDefault();
            pick(results[0].tmdbId); // fast path: first result
          }
        }}
        onFocus={() => {
          if (results.length >= 1) setOpen(true);
        }}
      />

      {/* Search icon */}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>

      {/* Clear */}
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
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-slate-400">No matches. Try a different title.</div>
          )}
          <ul className="divide-y divide-slate-700/40">
            {results.map((m) => (
              <li key={m.tmdbId} className="hover:bg-slate-800/40">
                <button
                  className="flex w-full items-center gap-3 p-2 text-left"
                  onClick={() => pick(m.tmdbId)}
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