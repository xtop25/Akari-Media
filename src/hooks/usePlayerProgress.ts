// ============================================
// ХУК ДЛЯ АВТОСОХРАНЕНИЯ ПРОГРЕССА ПРОСМОТРА
// ============================================
// Сохраняет таймкод каждые 5 секунд, при паузе и закрытии
// Автоматически восстанавливает позицию при повторном открытии

import { useEffect, useRef, useCallback } from 'react';
import { PlayerProgress } from '@/types';

const STORAGE_KEY = 'akari_player_progress';
const AUTO_SAVE_INTERVAL = 5000; // 5 секунд

interface UsePlayerProgressParams {
  animeId: number;
  episode: number;
  translation: string;
  videoElement: HTMLVideoElement | null;
}

export function usePlayerProgress({
  animeId,
  episode,
  translation,
  videoElement,
}: UsePlayerProgressParams) {
  const intervalRef = useRef<number | null>(null);
  const lastSavedTime = useRef<number>(0);

  // ============================================
  // СОХРАНЕНИЕ ПРОГРЕССА
  // ============================================
  const saveProgress = useCallback(() => {
    if (!videoElement || !Number.isFinite(videoElement.duration) || videoElement.duration <= 0 || !Number.isFinite(videoElement.currentTime)) return;

    const currentTime = videoElement.currentTime;
    const duration = videoElement.duration;

    // Не сохраняем если разница менее 1 секунды (избегаем лишних записей)
    if (Math.abs(currentTime - lastSavedTime.current) < 1) return;

    const progress: PlayerProgress = {
      animeId,
      episode,
      translation,
      currentTime,
      duration,
      lastUpdated: Date.now(),
    };

    // Получаем все сохраненные прогрессы
    const allProgress = getAllProgress();
    
    // Создаем ключ для текущего видео
    const key = `${animeId}_${episode}_${translation}`;
    allProgress[key] = progress;

    // Сохраняем в localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    lastSavedTime.current = currentTime;

    console.log(`[usePlayerProgress] Прогресс сохранен: ${formatTime(currentTime)} / ${formatTime(duration)}`);
  }, [animeId, episode, translation, videoElement]);

  // ============================================
  // ЗАГРУЗКА ПРОГРЕССА
  // ============================================
  const loadProgress = useCallback((): PlayerProgress | null => {
    const allProgress = getAllProgress();
    const key = `${animeId}_${episode}_${translation}`;
    return allProgress[key] || null;
  }, [animeId, episode, translation]);

  // ============================================
  // ВОССТАНОВЛЕНИЕ ПОЗИЦИИ
  // ============================================
  const restoreProgress = useCallback(() => {
    if (!videoElement) return false;

    const progress = loadProgress();
    if (!progress) return false;

    // Восстанавливаем только если разница больше 10 секунд и не досмотрено до конца
    const shouldRestore = 
      progress.currentTime > 10 && 
      progress.currentTime < progress.duration - 30;

    if (shouldRestore) {
      videoElement.currentTime = progress.currentTime;
      console.log(`[usePlayerProgress] Позиция восстановлена: ${formatTime(progress.currentTime)}`);
      return true;
    }

    return false;
  }, [videoElement, loadProgress]);

  // ============================================
  // ПОЛУЧЕНИЕ ПРОГРЕССА ДЛЯ КОНКРЕТНОГО ВИДЕО
  // ============================================
  const getProgressForVideo = useCallback((
    targetAnimeId: number,
    targetEpisode: number,
    targetTranslation: string
  ): PlayerProgress | null => {
    const allProgress = getAllProgress();
    const key = `${targetAnimeId}_${targetEpisode}_${targetTranslation}`;
    return allProgress[key] || null;
  }, []);

  // ============================================
  // ПОЛУЧЕНИЕ ПОСЛЕДНЕГО ПРОСМОТРЕННОГО ЭПИЗОДА ДЛЯ АНИМЕ
  // ============================================
  const getLastWatchedEpisode = useCallback((targetAnimeId: number): PlayerProgress | null => {
    const allProgress = getAllProgress();
    
    const animeProgress = Object.values(allProgress)
      .filter((p: PlayerProgress) => p.animeId === targetAnimeId)
      .sort((a: PlayerProgress, b: PlayerProgress) => b.lastUpdated - a.lastUpdated);

    return animeProgress[0] || null;
  }, []);

  // ============================================
  // АВТОСОХРАНЕНИЕ ПРИ ВОСПРОИЗВЕДЕНИИ
  // ============================================
  useEffect(() => {
    if (!videoElement) return;

    const handlePlay = () => {
      // Запускаем автосохранение каждые 5 секунд
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        saveProgress();
      }, AUTO_SAVE_INTERVAL);
    };

    const handlePause = () => {
      // Сохраняем при паузе
      saveProgress();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleSeeked = () => {
      // Сохраняем при перемотке
      saveProgress();
    };

    window.addEventListener('pagehide', saveProgress);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('seeked', handleSeeked);
    videoElement.addEventListener('ended', handlePause);

    return () => {
      window.removeEventListener('pagehide', saveProgress);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('seeked', handleSeeked);
      videoElement.removeEventListener('ended', handlePause);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoElement, saveProgress]);

  // ============================================
  // СОХРАНЕНИЕ ПРИ РАЗМОНТИРОВАНИИ КОМПОНЕНТА
  // ============================================
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  return {
    saveProgress,
    loadProgress,
    restoreProgress,
    getProgressForVideo,
    getLastWatchedEpisode,
  };
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getAllProgress(): Record<string, PlayerProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================
// ЭКСПОРТ УТИЛИТ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ КОМПОНЕНТАХ
// ============================================

export function getAnimeProgress(animeId: number): PlayerProgress | null {
  const allProgress = getAllProgress();
  
  const animeProgress = Object.values(allProgress)
    .filter((p: PlayerProgress) => p.animeId === animeId)
    .sort((a: PlayerProgress, b: PlayerProgress) => b.lastUpdated - a.lastUpdated);

  return animeProgress[0] || null;
}

export function getProgressPercentage(progress: PlayerProgress | null): number {
  if (!progress || progress.duration === 0) return 0;
  return Math.min(100, (progress.currentTime / progress.duration) * 100);
}

export function clearAnimeProgress(animeId: number): void {
  const allProgress = getAllProgress();
  const filtered = Object.fromEntries(
    Object.entries(allProgress).filter(([_, p]) => p.animeId !== animeId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
