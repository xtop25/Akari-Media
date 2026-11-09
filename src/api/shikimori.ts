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
  const graph = await apiShikimori<FranchiseGraph>(`/animes/${id}/franchise`);
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
  return (graph.nodes || []).filter(n => visited.has(n.id)).sort((a,b) => (a.date || 0) - (b.date || 0) || a.id-b.id);
}
export type { FranchiseNode };
