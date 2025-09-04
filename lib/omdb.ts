export async function omdbByImdbId(imdbId: string, key: string) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&plot=short`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}

export async function omdbByTitleExact(title: string, year: string | null | undefined, key: string) {
  const params = new URLSearchParams({
    apikey: key,
    t: title,
    plot: 'short',
  });
  if (year && /^\d{4}$/.test(year)) params.set('y', year);
  const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}

export async function omdbSearch(title: string, key: string) {
  const params = new URLSearchParams({ apikey: key, s: title, type: 'movie' });
  const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
  if (!res.ok) throw new Error('OMDb search failed');
  return res.json();
}

/** Try exact title(s) first, then search, returning a full OMDb record (not just Search hits). */
export async function omdbFindByCandidates(candidates: string[], year: string | null | undefined, key: string) {
  // 1) Exact title attempts (highest precision)
  for (const t of candidates) {
    const r = await omdbByTitleExact(t, year, key);
    if (r && r.Response === 'True') return r;
  }
  // 2) Search and pick the movie whose year is closest (or any movie if no year)
  for (const t of candidates) {
    const sr = await omdbSearch(t, key);
    const list = Array.isArray(sr?.Search) ? sr.Search : [];
    if (!list.length) continue;

    const yrNum = year && /^\d{4}$/.test(year) ? Number(year) : undefined;
    let pick = list[0];
    if (yrNum) {
      let best = list[0], bestDiff = 999;
      for (const item of list) {
        const y = Number(String(item?.Year || '').slice(0, 4));
        const diff = Number.isFinite(y) ? Math.abs(y - yrNum) : 999;
        if (diff < bestDiff) { best = item; bestDiff = diff; }
      }
      pick = best;
    }
    if (pick?.imdbID) {
      const full = await omdbByImdbId(pick.imdbID, key);
      if (full && full.Response === 'True') return full;
    }
  }
  return null;
}