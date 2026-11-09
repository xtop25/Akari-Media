import { apiGet } from './proxy';
export interface LibriaEpisode { id: string; ordinal: number; name: string | null; hls_480: string | null; hls_720: string | null; hls_1080: string | null }
interface Release { id: number; shikimori: { id: number } | null; is_blocked_by_geo: boolean; is_blocked_by_copyrights: boolean; episodes?: LibriaEpisode[] }
interface SearchResult { data: Release[]; meta?: { pagination?: {total_pages?: number} } }
export type VideoResult = { episodes: LibriaEpisode[]; reason: 'not_found' | 'blocked' | 'no_episodes' | null };
const base = 'https://anilibria.top/api/v1';

// Проверяем ID Shikimori, а не похожее название; иначе можно включить другой сезон.
export async function findEpisodes(shikimoriId: number, titles: string[]): Promise<VideoResult> {
  let match: Release | undefined;
  for (const title of [...new Set(titles.filter(Boolean))]) {
    let page = 1;
    do {
      const params = new URLSearchParams({ 'f[search]': title, limit: '50', page: String(page) });
      const result = await apiGet<SearchResult>(`${base}/anime/catalog/releases?${params}`);
      match = result.data.find(r => r.shikimori?.id === shikimoriId);
      if (match) break;
      if (page >= Math.min(result.meta?.pagination?.total_pages || 1, 3)) break;
      page++;
    } while (true);
    if (match) break;
  }
  if (!match) return { episodes: [], reason: 'not_found' };
  if (match.is_blocked_by_geo || match.is_blocked_by_copyrights) return { episodes: [], reason: 'blocked' };
  const release = await apiGet<Release>(`${base}/anime/releases/${match.id}`);
  if (release.is_blocked_by_geo || release.is_blocked_by_copyrights) return { episodes: [], reason: 'blocked' };
  const episodes = (release.episodes || []).filter(e => e.hls_720 || e.hls_480 || e.hls_1080).sort((a,b) => a.ordinal-b.ordinal);
  return { episodes, reason: episodes.length ? null : 'no_episodes' };
}
