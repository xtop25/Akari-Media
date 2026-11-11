// ============================================
// SHIKIMORI API ИНТЕГРАЦИЯ
// ============================================
// Документация: https://shikimori.one/api/doc
// ВНИМАНИЕ: Shikimori требует обязательный заголовок User-Agent

import { apiGet } from '@/api/proxy';

const BASE_URL = 'https://shikimori.io/api';

export interface ShikimoriAnime {
  id: number;
  name: string;
  russian: string;
  image: {
    original: string;
    preview: string;
    x96: string;
    x48: string;
  };
  url: string;
  kind: string;
  score: string;
  status: string;
  episodes: number;
  episodes_aired: number;
  aired_on: string;
  released_on: string;
  rating: string;
  genres: Array<{ id: number; name: string; russian: string; kind: string }>;
  description?: string;
}

export interface ShikimoriCalendarItem {
  next_episode: number;
  next_episode_at: string;
  duration: number;
  anime: ShikimoriAnime;
}

async function apiShikimori<T>(path: string): Promise<T> {
  return apiGet<T>(`${BASE_URL}${path}`);
}

export async function searchAnime(query: string, limit = 20, filters: AnimeFilters = {}, page = 1): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({ search: query, limit: limit.toString(), page: page.toString(), order: filters.order || 'popularity' });
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.status) params.set('status', filters.status);
  return await apiShikimori<ShikimoriAnime[]>(`/animes?${params}`);
}

export async function getTrendingAnime(limit = 24): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({ order: 'popularity', limit: limit.toString(), kind: 'tv' });
  return await apiShikimori<ShikimoriAnime[]>(`/animes?${params}`);
}

export async function getOngoingAnime(limit = 24): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({ status: 'ongoing', order: 'popularity', limit: limit.toString(), kind: 'tv' });
  return await apiShikimori<ShikimoriAnime[]>(`/animes?${params}`);
}

export async function getCalendar(): Promise<ShikimoriCalendarItem[]> {
  return await apiShikimori<ShikimoriCalendarItem[]>('/calendar');
}

export async function getAnimeDetails(id: number): Promise<ShikimoriAnime> {
  return await apiShikimori<ShikimoriAnime>(`/animes/${id}`);
}

export interface AnimeFilters {
  genre?: string;
  kind?: 'tv' | 'movie' | 'ova' | 'ona' | 'special';
  status?: 'anons' | 'ongoing' | 'released';
  season?: string;
  score?: number;
  order?: 'popularity' | 'ranked' | 'name' | 'aired_on' | 'episodes' | 'status';
}

export async function getAnimeWithFilters(
  filters: AnimeFilters,
  page = 1,
  limit = 24
): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    order: filters.order || 'popularity',
  });
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.kind) params.append('kind', filters.kind);
  if (filters.status) params.append('status', filters.status);
  if (filters.season) params.append('season', filters.season);
  if (filters.score) params.append('score', filters.score.toString());
  return await apiShikimori<ShikimoriAnime[]>(`/animes?${params}`);
}

export async function getGenres(): Promise<Array<{ id: number; name: string; russian: string }>> {
  return await apiShikimori<Array<{ id: number; name: string; russian: string }>>('/genres');
}

import { Anime } from '@/types';

function fixPosterUrl(url: string | undefined, animeId: number): string {
  if (!url || /\/assets\/globals\/missing_|\/missing\.jpg/i.test(url)) return '';
  void animeId;
  if (url.startsWith('http')) return url;
  return `https://shikimori.io${url}`;
}

export function convertShikimoriToAnime(shikimori: ShikimoriAnime): Anime {
  return {
    id: shikimori.id,
    title: shikimori.russian || shikimori.name,
    titleEnglish: shikimori.name,
    poster: fixPosterUrl(shikimori.image?.original, shikimori.id),
    rating: parseFloat(shikimori.score) || undefined,
    year: shikimori.aired_on ? new Date(shikimori.aired_on).getFullYear() : undefined,
    episodes: shikimori.episodes || shikimori.episodes_aired,
    status: shikimori.status as 'ongoing' | 'released' | 'anons',
    genres: shikimori.genres?.map((g) => g.russian || g.name),
    description: shikimori.description,
  };
}
interface FranchiseNode { id: number; name: string; year: number | null; date: number | null; kind: string }
interface FranchiseGraph { nodes: FranchiseNode[]; links: Array<{source_id: number; target_id: number; relation: string}> }
/** Только прямая цепочка prequel/sequel — без спин-оффов, ремейков и фильмов из той же франшизы. */
export async function getSeasons(id: number): Promise<FranchiseNode[]> {
  let graph: FranchiseGraph;
  try {
    graph = await apiShikimori<FranchiseGraph>(`/animes/${id}/franchise`);
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.links)) throw new Error('Invalid franchise response');
  } catch {
    return getAniListSeasons(id);
  }
  const adjacent = new Map<number, number[]>();
  for (const link of graph.links || []) {
    if (!['prequel', 'sequel'].includes(link.relation)) continue;
    adjacent.set(link.source_id, [...(adjacent.get(link.source_id) || []), link.target_id]);
    adjacent.set(link.target_id, [...(adjacent.get(link.target_id) || []), link.source_id]);
  }
  const visited = new Set<number>([id]); const queue = [id];
  for (let i = 0; i < queue.length; i++) for (const next of adjacent.get(queue[i]) || []) {
    if (!visited.has(next)) { visited.add(next); queue.push(next); }
  }
  const seasons = graph.nodes.filter(n => visited.has(n.id)).sort((a,b) => (a.date || 0) - (b.date || 0) || a.id-b.id);
  if (seasons.length < 2) {
    try { const fallback = await getAniListSeasons(id); if (fallback.length > seasons.length) return fallback; } catch { /* Shikimori still supplied an answer */ }
  }
  return seasons;
}

interface AniListSeasonNode { id: number; idMal: number | null; type: string; format: string | null; title: { english: string | null; romaji: string | null }; startDate: { year: number | null; month: number | null; day: number | null }; relations?: { edges?: Array<{ relationType: string; node: AniListSeasonNode }> } }
/** Explicit AniList prequel/sequel links only; never guess a season by title. */
async function getAniListSeasons(malId: number): Promise<FranchiseNode[]> {
  const fields = `id idMal type format title{english romaji} startDate{year month day} relations{edges{relationType node{id idMal type format title{english romaji} startDate{year month day}}}}`;
  const visited = new Set<number>();
  const found = new Map<number, AniListSeasonNode>();
  const pending = new Set<number>();
  let tvRoot = false;
  const deadline = Date.now() + 25000;
  async function request(query: string, variables: object) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Math.max(1, Math.min(8000, deadline - Date.now())));
    try {
      const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: {'Content-Type':'application/json', Accept:'application/json'}, body: JSON.stringify({query, variables}), signal: controller.signal });
      if (!r.ok) throw new Error('AniList request failed');
      const body = await r.json();
      if (body.errors || !body.data) throw new Error('Invalid AniList response');
      return body.data;
    } finally { window.clearTimeout(timeout); }
  }
  const root: AniListSeasonNode = (await request(`query($mal:Int){Media(idMal:$mal,type:ANIME){${fields}}}`, {mal:malId})).Media;
  if (!root || root.idMal !== malId || !Number.isSafeInteger(root.id)) throw new Error('Invalid AniList media');
  tvRoot = root.format === 'TV' || root.format === 'TV_SHORT';
  function visit(media: AniListSeasonNode) {
    visited.add(media.id); pending.delete(media.id);
    if (media.idMal && media.type === 'ANIME') found.set(media.idMal, media);
    for (const edge of media.relations?.edges || []) {
      const node = edge.node;
      if (!['PREQUEL','SEQUEL'].includes(edge.relationType) || node?.type !== 'ANIME' || !Number.isSafeInteger(node.id) || (tvRoot && node.format === 'OVA')) continue;
      if (node.idMal) found.set(node.idMal, node);
      if (!visited.has(node.id)) pending.add(node.id);
    }
  }
  visit(root);
  while (pending.size) {
    if (visited.size >= 30 || Date.now() >= deadline) throw new Error('Season data incomplete');
    const ids = Array.from(pending).slice(0, Math.min(30 - visited.size, 30));
    const data = await request(`query($ids:[Int]){Page(page:1,perPage:30){media(id_in:$ids,type:ANIME){${fields}}}}`, {ids});
    const nodes: AniListSeasonNode[] = data.Page?.media;
    if (!Array.isArray(nodes) || nodes.length !== ids.length || nodes.some(node => !ids.includes(node.id))) throw new Error('Season data incomplete');
    for (const node of nodes) visit(node);
  }
  return Array.from(found.values()).map(node => {
    const year = node.startDate?.year || null;
    const date = year ? Date.UTC(year,(node.startDate?.month || 1)-1,node.startDate?.day || 1)/1000 : null;
    return { id:node.idMal!, name:node.title?.english || node.title?.romaji || `#${node.idMal}`, year, date, kind:node.format || 'ANIME' };
  }).sort((a,b)=>(a.date || 0)-(b.date || 0)||a.id-b.id);
}
export type { FranchiseNode };
