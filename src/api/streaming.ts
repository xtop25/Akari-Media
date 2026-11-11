import { invoke, isTauri } from '@tauri-apps/api/core';

export interface StreamingLink { site: string; url: string }
export interface StreamingCatalog { providers: StreamingLink[] }

// Данные AniList содержат ссылки, а не видеопотоки. Некоторые ссылки и доступность могут устареть.
const HOSTS = ['crunchyroll.com', 'netflix.com', 'hulu.com', 'hidive.com', 'youtube.com', 'youtu.be', 'amazon.com', 'amazon.co.uk', 'primevideo.com', 'tubitv.com', 'bilibili.tv', 'iq.com', 'wetv.vip', 'adultswim.com', 'crackle.com', 'hoopladigital.com', 'disneyplus.com', 'animelab.com', 'funimation.com', 'retrocrush.tv'];
export function safeStreamingUrl(value: string): string | null {
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.port || !HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) return null;
    u.protocol = 'https:'; return u.href;
  } catch { return null; }
}
export async function openStreamingUrl(value: string): Promise<void> {
  const url = safeStreamingUrl(value);
  if (!url) throw new Error('Unsupported URL');
  if (isTauri()) await invoke('open_streaming_url', { url });
  else window.open(url, '_blank', 'noopener,noreferrer');
}
export async function getStreamingCatalog(id: number): Promise<StreamingCatalog> {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: 'query($id:Int){Media(idMal:$id,type:ANIME){idMal externalLinks{site url type}}}', variables: { id } }),
  });
  if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors || !json.data) throw new Error('Invalid AniList response');
  const media = json.data.Media;
  if (!media || media.idMal !== id) return { providers: [] };
  const providers: StreamingLink[] = (media.externalLinks || []).filter((x: any) => x.type === 'STREAMING' && x.site && safeStreamingUrl(x.url)).map((x: any) => ({ site: x.site, url: safeStreamingUrl(x.url)! }));
  return { providers };
}
