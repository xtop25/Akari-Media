import { Anime } from '@/types';
const KEY = 'akari_favorites';
export function readFavorites(): Anime[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function toggleFavorite(anime: Anime): boolean {
  const favorites = readFavorites();
  const exists = favorites.some(item => item.id === anime.id);
  localStorage.setItem(KEY, JSON.stringify(exists ? favorites.filter(item => item.id !== anime.id) : [...favorites, anime]));
  return !exists;
}
