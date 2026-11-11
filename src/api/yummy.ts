/** Optional, personal-use YummyAnime integration. Match only exact Shikimori IDs. */
export interface YummyVideo { id: string; episode: number; dubbing: string; player: 'Aksor' | 'CVH' | 'Kodik' | 'Alloha'; url: string }
export interface YummyResult { videos: YummyVideo[]; blockedIn: string[] }
type RecordItem = { anime_id: number; remote_ids?: { shikimori_id?: number | string }; blocked_in?: string[] };
type VideoItem = { video_id?: number | string; number?: number | string; iframe_url?: string; data?: { player?: string; dubbing?: string } };
const API = 'https://api.yani.tv';
export class YummyError extends Error {
  constructor(public kind: 'http'|'network'|'timeout'|'response'|'ambiguous', public stage: 'search'|'videos', public status?: number) { super('YummyAnime request failed'); }
}
async function request(path: string, token: string): Promise<unknown> {
  const stage = path.startsWith('/anime?') ? 'search' : 'videos';
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(API + path, {headers:{Accept:'application/json', 'X-Application':token}, signal:controller.signal, redirect:'error'});
    if (!response.ok) throw new YummyError('http', stage, response.status);
    let body: any;
    try { body = await response.json(); } catch { throw new YummyError('response', stage); }
    if (!Array.isArray(body?.response)) throw new YummyError('response', stage);
    return body.response;
  } catch (error) {
    if (error instanceof YummyError) throw error;
    throw new YummyError(controller.signal.aborted ? 'timeout' : 'network', stage);
  } finally { clearTimeout(timeout); }
}
function safePlayerUrl(value: string, player: string): string | null {
  try {
    const url = new URL(value.startsWith('//') ? 'https:' + value : value);
    const allowed = player === 'Aksor' ? 'player.aksor.tv' : player === 'CVH' ? 'ru.yummyani.me' : player === 'Kodik' ? 'kodikplayer.com' : player === 'Alloha' ? 'alloha.yani.tv' : '';
    const validPath = player === 'CVH' ? url.pathname === '/iframeCVH.html' : player === 'Aksor' ? /^\/video\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) : player === 'Kodik' ? /^\/(?:serial|season|video|movie)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?\/?$/.test(url.pathname) : player === 'Alloha' && url.pathname === '/';
    return url.protocol === 'https:' && url.hostname === allowed && validPath && !url.port && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export async function findYummyVideos(id: number, titles: string[], applicationToken: string): Promise<YummyResult> {
  const token = applicationToken.trim();
  if (!token || token.length > 256 || !/^[\x21-\x7e]+$/.test(token)) throw new Error('Invalid application key');
  let match: RecordItem | undefined;
  for (const title of [...new Set(titles.map(t => t.trim()).filter(Boolean))]) {
    const params = new URLSearchParams({q:title, limit:'50'});
    const results = await request(`/anime?${params}`, token) as RecordItem[];
    const matches = results.filter(item => Number(item.remote_ids?.shikimori_id) === id && Number.isSafeInteger(item.anime_id));
    if (matches.length === 1) { match = matches[0]; break; }
    if (matches.length > 1) throw new YummyError('ambiguous', 'search');
  }
  if (!match) return {videos:[],blockedIn:[]};
  const items = await request(`/anime/${match.anime_id}/videos`, token) as VideoItem[];
  const videos: YummyVideo[] = [];
  for (const item of items) {
    const raw = item.data?.player || '';
    const player = raw === 'Плеер Aksor' ? 'Aksor' : raw === 'Плеер CVH' ? 'CVH' : raw === 'Плеер Kodik' ? 'Kodik' : raw === 'Плеер Alloha' ? 'Alloha' : null;
    const dubbing = item.data?.dubbing?.trim() || '';
    const episode = Number(item.number);
    if (!player || item.video_id == null || !/^Озвучка(?:\s|$)/iu.test(dubbing) || !Number.isFinite(episode) || episode <= 0 || !item.iframe_url) continue;
    const url = safePlayerUrl(item.iframe_url, player);
    if (url) videos.push({id:String(item.video_id),episode,dubbing,player,url});
  }
  videos.sort((a,b) => a.episode-b.episode || a.dubbing.localeCompare(b.dubbing));
  return {videos, blockedIn:Array.isArray(match.blocked_in) ? match.blocked_in.filter(x => /^[A-Z]{2}$/.test(x)) : []};
}
