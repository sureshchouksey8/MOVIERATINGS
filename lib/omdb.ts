export async function omdbByImdbId(imdbId: string, key: string) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&plot=short`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OMDb fetch failed');
  return res.json();
}
