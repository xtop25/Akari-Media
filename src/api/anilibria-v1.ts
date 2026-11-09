import { apiGet } from './proxy';

export interface LibriaEpisode { id: string; ordinal: number; name: string | null; hls_480: string | null; hls_720: string | null; hls_1080: string | null }
interface Release { id: number; shikimori: { id: number } | null; is_blocked_by_geo: boolean; is_blocked_by_copyrights: boolean; episodes?: LibriaEpisode[] }
const base = 'https://anilibria.top/api/v1';

// Не используем приблизительное совпадение названия: оно может вернуть другой сезон.
export async function findEpisodes(shikimoriId: number, title: string): Promise<LibriaEpisode[]> {
  const params = new URLSearchParams({ 'f[search]': title, limit: '50' });
  const result = await apiGet<{ data: Release[] }>(`${base}/anime/catalog/releases?${params}`);
  const match = result.data.find(r => r.shikimori?.id === shikimoriId);
  if (!match || match.is_blocked_by_geo || match.is_blocked_by_copyrights) return [];
  const release = await apiGet<Release>(`${base}/anime/releases/${match.id}`);
  if (release.is_blocked_by_geo || release.is_blocked_by_copyrights) return [];
  return (release.episodes || []).filter(e => e.hls_720 || e.hls_480 || e.hls_1080).sort((a,b) => a.ordinal-b.ordinal);
}
