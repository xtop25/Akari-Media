// ============================================
// ТИПЫ ДЛЯ ВСЕГО ПРИЛОЖЕНИЯ
// ============================================

export interface Anime {
  id: number;
  title: string;
  titleEnglish?: string;
  poster: string;
  rating?: number;
  year?: number;
  episodes?: number;
  status?: 'ongoing' | 'released' | 'anons';
  genres?: string[];
  description?: string;
}

export interface Episode {
  number: number;
  title?: string;
  thumbnail?: string;
}

export interface Translation {
  id: string;
  title: string;
  type: 'voice' | 'sub';
}

export interface VideoSource {
  quality: string;
  url: string; // HLS .m3u8 ссылка
}

export interface PlayerProgress {
  animeId: number;
  episode: number;
  translation: string;
  currentTime: number; // Текущий таймкод в секундах
  duration: number;
  lastUpdated: number; // Timestamp
}

export interface HistoryItem extends Anime {
  progress?: PlayerProgress;
  watchedAt: number;
}
