// ============================================
// KODIK API ИНТЕГРАЦИЯ (HLS ВИДЕОПОТОКИ)
// ============================================
// Документация: https://kodik.cc/

const KODIK_TOKEN = import.meta.env.VITE_KODIK_TOKEN || 'demo_token';
const KODIK_BASE_URL = 'https://kodikapi.com';

export interface KodikTranslation {
  id: number;
  title: string;
  type: string;
}

export interface KodikEpisode {
  [key: string]: string; // Номер серии -> ссылка
}

export interface KodikResult {
  id: string;
  type: string;
  title: string;
  title_orig: string;
  year: number;
  shikimori_id: string;
  quality: string;
  camrip: boolean;
  translation: KodikTranslation;
  episodes: KodikEpisode;
  episodes_count: number;
  link: string; // iframe URL
  player_link: string; // Прямая ссылка на плеер
}

export interface KodikResponse {
  time: string;
  total: number;
  results: KodikResult[];
}

// ============================================
// ПОИСК ПО SHIKIMORI ID
// ============================================
export async function getVideoByShikimoriId(shikimoriId: number): Promise<KodikResult[]> {
  try {
    const response = await fetch(
      `${KODIK_BASE_URL}/search?token=${KODIK_TOKEN}&shikimori_id=${shikimoriId}&with_episodes=true&with_material_data=true`
    );
    
    if (!response.ok) {
      throw new Error(`Kodik API error: ${response.status}`);
    }
    
    const data: KodikResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('[Kodik API] Ошибка поиска:', error);
    throw error;
  }
}

// ============================================
// ИЗВЛЕЧЕНИЕ HLS ССЫЛКИ ИЗ ПЛЕЕРА
// ============================================
// ВНИМАНИЕ: Kodik использует iframe, для получения прямой HLS ссылки 
// нужно парсить страницу плеера или использовать их API
export async function getDirectHLSUrl(playerLink: string): Promise<string> {
  try {
    // Kodik защищает прямые ссылки, поэтому используем iframe
    // В реальном приложении нужно либо:
    // 1. Встроить iframe в плеер
    // 2. Использовать proxy через Tauri backend
    // 3. Извлечь ссылку через парсинг (может нарушать ToS)
    
    console.warn('[Kodik API] Прямые HLS ссылки требуют дополнительной обработки');
    return playerLink; // Возвращаем ссылку на плеер
  } catch (error) {
    console.error('[Kodik API] Ошибка получения HLS:', error);
    throw error;
  }
}

// ============================================
// КОНВЕРТАЦИЯ В ЛОКАЛЬНЫЙ ФОРМАТ
// ============================================
import { Translation, Episode } from '@/types';

export function convertKodikToTranslations(results: KodikResult[]): Translation[] {
  return results.map((result) => ({
    id: result.translation.id.toString(),
    title: result.translation.title,
    type: result.translation.type === 'voice' ? 'voice' : 'sub',
  }));
}

export function convertKodikToEpisodes(episodes: KodikEpisode): Episode[] {
  return Object.entries(episodes).map(([number, link]) => ({
    number: parseInt(number, 10),
    title: `Серия ${number}`,
    url: link
  }));
}

export function getEpisodeLink(result: KodikResult, episodeNumber: number): string {
  // Формируем ссылку на конкретную серию
  const baseLink = result.link;
  return `${baseLink}?episode=${episodeNumber}`;
}
