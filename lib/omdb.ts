export async function omdbByImdbId(imdbId: string, key: string) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&plot=short`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}

export async function omdbByTitleExact(title: string, year: string | null | undefined, key: string) {
  const params = new URLSearchParams({ apikey: key, t: title, plot: 'short' });
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

export async function omdbFindByCandidates(candidates: string[], year: string | null | undefined, key: string) {
  for (const t of candidates) {
    const r = await omdbByTitleExact(t, year, key);
    if (r && r.Response === 'True') return r;
  }
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

export async function imdbRatingFromHtml(imdbId: string): Promise<string | null> {
  try {
    const url = `https://www.imdb.com/title/${imdbId}/`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' },
      cache: 'no-store' as RequestCache,
    });
    if (!res.ok) return null;
    const html = await res.text();

    const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of blocks) {
      const raw = (m[1] || '').trim();
      try {
        const json = JSON.parse(raw);
        const nodes = Array.isArray(json) ? json : [json];
        for (const node of nodes) {
          const rating = node?.aggregateRating?.ratingValue;
          if (rating && !Number.isNaN(Number(rating))) return `${Number(rating).toFixed(1)}/10`;
        }
      } catch { /* ignore */ }
    }

    const m2 = html.match(/"aggregateRating":\s*\{[^}]*"ratingValue":\s*("?)(\d+(\.\d+)?)\1/);
    if (m2) return `${Number(m2[2]).toFixed(1)}/10`;
    return null;
  } catch {
    return null;
  }
}