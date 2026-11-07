// ============================================
// SHIKIMORI API ИНТЕГРАЦИЯ
// ============================================
// Документация: https://shikimori.one/api/doc
// ВНИМАНИЕ: Shikimori требует обязательный заголовок User-Agent

import { apiGet } from '@/api/proxy';

const BASE_URL = 'https://shikimori.one/api';

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

export async function searchAnime(query: string, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({ search: query, limit: limit.toString(), order: 'popularity' });
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

function fixPosterUrl(url: string, animeId: number): string {
  if (!url || url === '/system/animes/original/missing.jpg') {
    return `https://picsum.photos/seed/anime${animeId}/300/450`;
  }
  if (url.startsWith('http')) return url;
  return `https://shikimori.one${url}`;
}

export function convertShikimoriToAnime(shikimori: ShikimoriAnime): Anime {
  return {
    id: shikimori.id,
    title: shikimori.russian || shikimori.name,
    titleEnglish: shikimori.name,
    poster: fixPosterUrl(shikimori.image.original, shikimori.id),
    rating: parseFloat(shikimori.score) || undefined,
    year: shikimori.aired_on ? new Date(shikimori.aired_on).getFullYear() : undefined,
    episodes: shikimori.episodes || shikimori.episodes_aired,
    status: shikimori.status as 'ongoing' | 'released' | 'anons',
    genres: shikimori.genres?.map((g) => g.russian || g.name),
    description: shikimori.description,
  };
}