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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hi, setHi] = useState<number>(-1); // highlight index
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Fetch results for a given page
  async function fetchPage(term: string, targetPage = 1, append = false) {
    const seq = ++seqRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setOpen(true);

    const bust = Date.now();
    const url = `/api/search?q=${encodeURIComponent(term)}&page=${targetPage}&t=${bust}`;
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store', headers: { 'x-no-cache': String(bust) } });
      const j = await r.json();
      if (seq !== seqRef.current) return;
      const newResults: Item[] = Array.isArray(j.results) ? j.results : [];
      setResults(append ? [...results, ...newResults] : newResults);
      setPage(j.page || targetPage);
      setHasMore((j.total_pages || 1) > (j.page || targetPage));
      setHi(newResults.length ? 0 : -1);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setResults([]);
        setHasMore(false);
      }
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }

  // Debounced search on input change
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setPage(1);
      setHasMore(false);
      setHi(-1);
      return;
    }
    const t = setTimeout(() => fetchPage(term, 1, false), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function clearAll() {
    setQ('');
    setResults([]);
    setOpen(false);
    setPage(1);
    setHasMore(false);
    setHi(-1);
    onClearSelection?.();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelectByIndex(index: number) {
    const item = results[index];
    if (!item) return;
    onSelect(item.tmdbId);
    // reset so user can immediately type again
    setQ('');
    setResults([]);
    setOpen(false);
    setPage(1);
    setHasMore(false);
    setHi(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!results.length) return;
      const next = (hi + 1) % results.length;
      setHi(next);
      listRef.current?.querySelectorAll('[data-opt]')[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      const next = (hi - 1 + results.length) % results.length;
      setHi(next);
      listRef.current?.querySelectorAll('[data-opt]')[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (open && hi >= 0) {
        e.preventDefault();
        handleSelectByIndex(hi);
      }
    } else if (e.key === 'Escape') {
      clearAll();
    }
  }

  async function loadMore() {
    const term = q.trim();
    if (!term || !hasMore) return;
    await fetchPage(term, page + 1, true);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full rounded-xl bg-slate-800/70 pl-11 pr-10 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-shadow"
        placeholder="Search any movie…"
        value={q}
        onChange={(e) => {
          const val = e.target.value;
          setQ(val);
          setOpen(val.trim().length >= 2);
        }}
        onKeyDown={onKeyDown}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearAll}
        >
          ✕
        </button>
      )}

      {open && (
        <div
          ref={listRef}
          className="absolute z-20 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/95 p-2 shadow-2xl backdrop-blur transition-all duration-200"
          onMouseDown={(e) => e.preventDefault()} // keep input from blurring
        >
          {loading && results.length === 0 && (
            <div className="p-3 text-sm text-slate-300">Searching…</div>
          )}

          <ul className="divide-y divide-slate-700/40">
            {results.map((m, idx) => (
              <li
                key={`${m.tmdbId}-${idx}`}
                data-opt
                className={idx === hi ? 'bg-slate-800/60 rounded-md' : 'hover:bg-slate-800/40 rounded-md'}
                onMouseEnter={() => setHi(idx)}
              >
                <button
                  className="flex w-full items-center gap-3 p-2 text-left"
                  onClick={() => handleSelectByIndex(idx)}
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

          {/* More results */}
          {!loading && hasMore && (
            <div className="mt-2 flex justify-center">
              <button
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700/60"
                onClick={loadMore}
              >
                More results…
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}