/** Stores only a selected episode and dub, never a playback position or account token. */
const KEY = 'akari_yummy_selection';
export interface YummySelection { group: string; episode: number }
function readAll(): Record<string, YummySelection> {
  try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
  catch { return {}; }
}
export function readYummySelection(animeId: number): YummySelection | null {
  const x = readAll()[String(animeId)];
  return x && typeof x.group === 'string' && x.group.length <= 256 && Number.isFinite(x.episode) && x.episode > 0 ? x : null;
}
export function saveYummySelection(animeId: number, group: string, episode: number): void {
  if (!Number.isSafeInteger(animeId) || animeId <= 0 || !group || group.length > 256 || !Number.isFinite(episode) || episode <= 0) return;
  try {
    const previous = readAll();
    delete previous[String(animeId)];
    const entries = Object.entries(previous).slice(-199);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries([...entries, [String(animeId), {group, episode}]])));
  } catch { /* Storage can be unavailable or full; viewing still works. */ }
}
