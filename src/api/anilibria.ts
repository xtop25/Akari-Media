// ============================================
// ANILIBRIA API ИНТЕГРАЦИЯ (HLS ВИДЕОПОТОКИ)
// ============================================
// Документация: https://github.com/anilibria/docs

const ANILIBRIA_BASE_URL = 'https://api.anilibria.tv/v3';

export interface AniLibriaTitle {
  id: number;
  code: string;
  names: {
    ru: string;
    en: string;
    alternative: string | null;
  };
  franchises: Array<{
    franchise: {
      id: string;
      name: string;
    };
  }>;
  announce: string | null;
  status: {
    string: string;
    code: number;
  };
  posters: {
    small: {
      url: string;
      raw_base64_file: string | null;
    };
    medium: {
      url: string;
      raw_base64_file: string | null;
    };
    original: {
      url: string;
      raw_base64_file: string | null;
    };
  };
  updated: number;
  last_change: number;
  type: {
    full_string: string;
    code: number;
    string: string;
    episodes: number | null;
    length: number | null;
  };
  genres: string[];
  team: {
    voice: string[];
    translator: string[];
    editing: string[];
    decor: string[];
    timing: string[];
  };
  season: {
    string: string;
    code: number;
    year: number;
    week_day: number;
  };
  description: string;
  in_favorites: number;
  blocked: {
    blocked: boolean;
    bakanim: boolean;
  };
  player: {
    alternative_player: string | null;
    host: string;
    episodes: {
      first: number;
      last: number;
      string: string;
    };
    list: {
      [episodeNumber: string]: {
        episode: number;
        name: string | null;
        uuid: string;
        created_timestamp: number;
        preview: string | null;
        skips: {
          opening: number[];
          ending: number[];
        };
        hls: {
          fhd: string | null;
          hd: string | null;
          sd: string | null;
        };
      };
    };
    rutube: {
      [episodeNumber: string]: {
        episode: number;
        url: string;
      };
    };
  };
  torrents: {
    episodes: {
      first: number;
      last: number;
      string: string;
    };
    list: Array<{
      torrent_id: number;
      episodes: {
        first: number;
        last: number;
        string: string;
      };
      quality: {
        string: string;
        type: string;
        resolution: string;
        encoder: string;
        lq_audio: boolean | null;
      };
      leechers: number;
      seeders: number;
      downloads: number;
      total_size: number;
      size_string: string;
      url: string;
      magnet: string;
      uploaded_timestamp: number;
      hash: string;
      metadata: any | null;
      raw_base64_file: string | null;
    }>;
  };
}

// ============================================
// ПОИСК ПО КОДУ
// ============================================
export async function getTitleByCode(code: string): Promise<AniLibriaTitle> {
  try {
    const response = await fetch(
      `${ANILIBRIA_BASE_URL}/title?code=${code}&playlist_type=array`
    );
    
    if (!response.ok) {
      throw new Error(`AniLibria API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AniLibria API] Ошибка получения тайтла:', error);
    throw error;
  }
}

// ============================================
// ПОИСК ПО НАЗВАНИЮ
// ============================================
export async function searchTitles(query: string, limit = 20): Promise<AniLibriaTitle[]> {
  try {
    const response = await fetch(
      `${ANILIBRIA_BASE_URL}/title/search?search=${encodeURIComponent(query)}&limit=${limit}&playlist_type=array`
    );
    
    if (!response.ok) {
      throw new Error(`AniLibria API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.list || [];
  } catch (error) {
    console.error('[AniLibria API] Ошибка поиска:', error);
    throw error;
  }
}

// ============================================
// ПОЛУЧЕНИЕ ОБНОВЛЕНИЙ
// ============================================
export async function getUpdates(limit = 20): Promise<AniLibriaTitle[]> {
  try {
    const response = await fetch(
      `${ANILIBRIA_BASE_URL}/title/updates?limit=${limit}&playlist_type=array`
    );
    
    if (!response.ok) {
      throw new Error(`AniLibria API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.list || [];
  } catch (error) {
    console.error('[AniLibria API] Ошибка получения обновлений:', error);
    throw error;
  }
}

// ============================================
// ПОЛУЧЕНИЕ HLS ССЫЛКИ ДЛЯ СЕРИИ
// ============================================
export function getEpisodeHLS(
  title: AniLibriaTitle,
  episodeNumber: number,
  quality: 'fhd' | 'hd' | 'sd' = 'hd'
): string | null {
  const episode = title.player.list[episodeNumber.toString()];
  
  if (!episode) {
    console.error(`[AniLibria API] Серия ${episodeNumber} не найдена`);
    return null;
  }

  const hlsUrl = episode.hls[quality] || episode.hls.hd || episode.hls.sd;
  
  if (!hlsUrl) {
    console.error(`[AniLibria API] HLS для серии ${episodeNumber} не найден`);
    return null;
  }

  // Добавляем хост если нужно
  return hlsUrl.startsWith('http') ? hlsUrl : `${title.player.host}${hlsUrl}`;
}

// ============================================
// КОНВЕРТАЦИЯ В ЛОКАЛЬНЫЙ ФОРМАТ
// ============================================
import { Anime, Episode, Translation } from '@/types';

export function convertAniLibriaToAnime(title: AniLibriaTitle): Anime {
  return {
    id: title.id,
    title: title.names.ru,
    titleEnglish: title.names.en,
    poster: `https://anilibria.tv${title.posters.original.url}`,
    rating: undefined, // AniLibria не предоставляет рейтинг
    year: title.season.year,
    episodes: title.type.episodes || undefined,
    status: title.status.code === 1 ? 'ongoing' : 'released',
    genres: title.genres,
    description: title.description,
  };
}

export function convertAniLibriaToEpisodes(title: AniLibriaTitle): Episode[] {
  return Object.values(title.player.list).map((episode) => ({
    number: episode.episode,
    title: episode.name || `Серия ${episode.episode}`,
    thumbnail: episode.preview ? `https://anilibria.tv${episode.preview}` : undefined,
  }));
}

export function convertAniLibriaToTranslations(): Translation[] {
  // AniLibria предоставляет только одну озвучку (свою)
  return [
    {
      id: 'anilibria',
      title: 'AniLibria',
      type: 'voice',
    },
  ];
}
