// ============================================
// СТРАНИЦА ИСТОРИИ ПРОСМОТРОВ
// ============================================
// Показывает все аниме с сохраненным прогрессом

import { useState, useEffect } from 'react';
import { History, Trash2, Play, Clock } from 'lucide-react';
import { PlayerProgress } from '@/types';
import { getProgressPercentage } from '@/hooks/usePlayerProgress';
import { useNavigate } from 'react-router-dom';
import { CachedImage } from '@/components/CachedImage';
import { getAnimeDetails, convertShikimoriToAnime } from '@/api/shikimori';
import { t, tx, getLanguage } from '@/hooks/useSettings';

interface HistoryItem {
  animeId: number;
  title: string;
  poster: string;
  progress: PlayerProgress;
  lastWatched: Date;
}

export function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();

  // ============================================
  // ЗАГРУЗКА ИСТОРИИ ИЗ LOCALSTORAGE
  // ============================================
  useEffect(() => {
    loadHistory();
  }, []);

  function loadHistory() {
    try {
      const progressData = localStorage.getItem('akari_player_progress');
      if (!progressData) {
        setHistory([]);
        return;
      }

      const allProgress: Record<string, PlayerProgress> = JSON.parse(progressData);

      // Группируем по animeId и берем последний прогресс
      const groupedByAnime: { [animeId: number]: PlayerProgress } = {};

      Object.values(allProgress).forEach((progress) => {
        const existing = groupedByAnime[progress.animeId];
        if (!existing || progress.lastUpdated > existing.lastUpdated) {
          groupedByAnime[progress.animeId] = progress;
        }
      });

      // Конвертируем в HistoryItem[]
      // ВНИМАНИЕ: Здесь нужно либо сохранять метаданные аниме вместе с прогрессом,
      // либо запрашивать их через API. Пока используем моки.
      const historyItems: HistoryItem[] = Object.values(groupedByAnime)
        .map((progress) => ({
          animeId: progress.animeId,
          title: `Anime #${progress.animeId}`, // TODO: Fetch real title via API
          poster: '',
          progress,
          lastWatched: new Date(progress.lastUpdated),
        }))
        .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime());

      setHistory(historyItems);
      Promise.all(historyItems.map(async item => {
        try { const anime = convertShikimoriToAnime(await getAnimeDetails(item.animeId)); return { ...item, title: anime.title, poster: anime.poster }; }
        catch { return item; }
      })).then(items => setHistory(current => current.map(item => items.find(updated => updated.animeId === item.animeId) || item)));
    } catch (error) {
      console.error('[HistoryView] Ошибка загрузки истории:', error);
      setHistory([]);
    }
  }

  const handleContinueWatching = (item: HistoryItem) => {
    navigate(`/watch/${item.animeId}`);
  };

  const handleDeleteItem = (animeId: number) => {
    try {
      const progressData = localStorage.getItem('akari_player_progress');
      if (!progressData) return;

      const allProgress: Record<string, PlayerProgress> = JSON.parse(progressData);

      // Удаляем все записи для этого аниме
      const filtered = Object.fromEntries(
        Object.entries(allProgress).filter(([_, p]) => p.animeId !== animeId)
      );

      localStorage.setItem('akari_player_progress', JSON.stringify(filtered));
      loadHistory(); // Перезагружаем список
    } catch (error) {
      console.error('[HistoryView] Ошибка удаления:', error);
    }
  };

  const handleClearAll = () => {
    if (confirm(tx('Очистить всю историю просмотров?', 'Clear all watch history?'))) {
      localStorage.removeItem('akari_player_progress');
      setHistory([]);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('history.just_now');
    if (diffMins < 60) return `${diffMins} ${t('history.min_ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('history.hours_ago')}`;
    if (diffDays < 7) return `${diffDays} ${t('history.days_ago')}`;

    return date.toLocaleDateString(getLanguage() === 'ru' ? 'ru-RU' : 'en-US');
  };

  return (
    <div className="min-h-screen bg-akari-dark text-white p-8">
      {/* ЗАГОЛОВОК */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <History className="text-akari-purple" size={32} />
              <h1 className="text-4xl font-bold">
                {t('history.title')}
              </h1>
            </div>
            <p className="text-zinc-400">{t('history.tagline')}</p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              {t('history.clear')}
            </button>
          )}
        </div>
      </div>

      {/* СПИСОК */}
      {history.length === 0 ? (
        <div className="text-center py-20">
          <History size={48} className="text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('history.empty')}</h2>
          <p className="text-zinc-400">{t('history.empty_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const progressPercent = getProgressPercentage(item.progress);

            return (
              <div
                key={item.animeId}
                className="bg-zinc-900 rounded-lg p-4 hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex gap-4">
                  {/* ПОСТЕР */}
                  <div className="relative">
                    <CachedImage
                      animeId={item.animeId}
                      src={item.poster}
                      alt={item.title}
                      className="w-24 h-36 object-cover rounded-lg"
                    />

                    {/* ИНДИКАТОР ПРОГРЕССА НА ПОСТЕРЕ */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-akari-purple transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* ИНФОРМАЦИЯ */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-akari-purple transition-colors">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-3 text-sm text-zinc-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(item.lastWatched)}
                          </span>
                        </div>

                        {/* ПРОГРЕСС */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-zinc-400">{t('history.episode')} {item.progress.episode}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-akari-purple font-semibold">
                              {formatTime(item.progress.currentTime)} / {formatTime(item.progress.duration)}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{progressPercent.toFixed(0)}%</span>
                          </div>

                          {/* ПРОГРЕСС БАР */}
                          <div className="w-full max-w-md h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-akari-purple to-akari-blue transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* КНОПКИ ДЕЙСТВИЙ */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleContinueWatching(item)}
                          className="px-4 py-2 bg-akari-purple hover:bg-akari-purple/80 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Play size={16} fill="white" />
                          {t('history.continue')}
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.animeId)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title={t('history.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
