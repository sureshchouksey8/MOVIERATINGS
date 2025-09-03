'use client';
import React, { useEffect, useRef, useState } from 'react';

type Item = { tmdbId: number; title: string; year: string; poster: string | null };

export default function SearchBar({
  onSelect,
  onClearSelection,
}: {
  onSelect: (tmdbId: number) => void;
  onClearSelection?: () => void;
}) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimeout = useRef<number | null>(null);

  useEffect(() => {
    const term = q.trim();

    // Close & clear when too short
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const seq = ++seqRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setOpen(true); // show dropdown while fetching

    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => {
          if (seq === seqRef.current) {
            setResults(Array.isArray(j.results) ? j.results : []);
            setOpen(true);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError' && seq === seqRef.current) {
            // Clear stale list on errors so user doesn't see old results
            setResults([]);
            setOpen(false);
          }
        })
        .finally(() => {
          if (seq === seqRef.current) setLoading(false);
        });
    }, 250); // debounce

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
    // keep focus so user can type again
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelect(id: number) {
    onSelect(id);
    // reset search box so user can search again immediately
    setQ('');
    setResults([]);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full rounded-xl bg-slate-800/70 pl-11 pr-10 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        placeholder="Search any movie…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(e.target.value.trim().length >= 2);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clearAll();
        }}
        onFocus={() => {
          if (results.length >= 1) setOpen(true);
        }}
        onBlur={() => {
          // small delay so clicks on dropdown can register
          blurTimeout.current = window.setTimeout(() => setOpen(false), 150);
        }}
      />

      {/* Search icon */}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>

      {/* Clear button */}
      {q && (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-slate-700/60"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearAll}
        >
          ✕
        </button>
      )}

      {open && (
        <div
          className="absolute z-20 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/95 p-2 shadow-2xl backdrop-blur"
          onMouseDown={(e) => {
            // prevent input blur closing before click registers
            e.preventDefault();
            if (blurTimeout.current) {
              clearTimeout(blurTimeout.current);
              blurTimeout.current = null;
            }
          }}
        >
          {loading && <div className="p-3 text-sm text-slate-300">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-slate-400">No matches. Try a different title.</div>
          )}
          <ul className="divide-y divide-slate-700/40">
            {results.map((m) => (
              <li key={m.tmdbId} className="hover:bg-slate-800/40">
                <button
                  className="flex w-full items-center gap-3 p-2 text-left"
                  onClick={() => handleSelect(m.tmdbId)}
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