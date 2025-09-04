export async function omdbByImdbId(imdbId: string, key: string) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&plot=short`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}

export async function omdbByTitleYear(title: string, year: string | undefined, key: string) {
  const params = new URLSearchParams({ apikey: key, t: title });
  if (year) params.set('y', year);
  const url = `https://www.omdbapi.com/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}