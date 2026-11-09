// ============================================
// СТРАНИЦА КАЛЕНДАРЯ ОНГОИНГОВ
// ============================================
// Расписание выхода новых серий по дням недели

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CachedImage } from '@/components/CachedImage';
import { Anime } from '@/types';
import { getCalendar, convertShikimoriToAnime, ShikimoriCalendarItem } from '@/api/shikimori';
import { t, tx, getLanguage } from '@/hooks/useSettings';

const WEEKDAYS_RU = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

interface CalendarDay {
  day: string;
  animes: Array<{
    anime: Anime;
    nextEpisode: number;
    nextEpisodeAt: string;
  }>;
}

export function CalendarView() {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();

  const WEEKDAYS = getLanguage() === 'ru' ? WEEKDAYS_RU : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // ============================================
  // ЗАГРУЗКА КАЛЕНДАРЯ
  // ============================================
  useEffect(() => {
    async function loadCalendar() {
      setIsLoading(true);

      try {
        const data = await getCalendar();
        
        // Группируем по дням недели
        const grouped: { [key: number]: ShikimoriCalendarItem[] } = {};
        
        data.forEach((item) => {
          if (!item.next_episode_at) return;
          
          const date = new Date(item.next_episode_at);
          const dayOfWeek = date.getDay(); // 0 = воскресенье
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Преобразуем: 0-6 где 0 = понедельник
          
          if (!grouped[adjustedDay]) {
            grouped[adjustedDay] = [];
          }
          
          grouped[adjustedDay].push(item);
        });

        // Конвертируем в CalendarDay[]
        const calendarData: CalendarDay[] = WEEKDAYS.map((day, index) => ({
          day,
          animes: (grouped[index] || []).map((item) => ({
            anime: convertShikimoriToAnime(item.anime),
            nextEpisode: item.next_episode,
            nextEpisodeAt: item.next_episode_at,
          })),
        }));

        setCalendar(calendarData);
        
        // Автоматически выбираем текущий день
        const today = new Date().getDay();
        const adjustedToday = today === 0 ? 6 : today - 1;
        setSelectedDay(adjustedToday);
      } catch (err) {
        console.error('[CalendarView] Ошибка загрузки:', err);
        setCalendar(WEEKDAYS.map(day => ({ day, animes: [] })));
        setIsOffline(true);
        // Выбираем текущий день по умолчанию
        const today = new Date().getDay();
        setSelectedDay(today === 0 ? 6 : today - 1);
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendar();
  }, []);

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/watch/${anime.id}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(getLanguage() === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-akari-purple" size={48} />
      </div>
    );
  }

  const selectedDayData = selectedDay !== null ? calendar[selectedDay] : null;

  return (
    <div className="min-h-screen bg-akari-dark text-white p-8">
      {/* ЗАГОЛОВОК */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="text-akari-purple" size={32} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
            {t('calendar.title')}
          </h1>
        </div>
        <p className="text-zinc-400">{t('calendar.tagline')}</p>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="mb-6 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle size={16} className="text-yellow-500" />
          <span className="text-zinc-300">{t('calendar.offline')}</span>
        </div>
      )}

      {/* ДНИ НЕДЕЛИ */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {calendar.map((day, index) => {
          const isToday = index === new Date().getDay() - 1 || (index === 6 && new Date().getDay() === 0);
          const isSelected = selectedDay === index;

          return (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-akari-purple text-white scale-105'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              } ${isToday ? 'ring-2 ring-akari-blue' : ''}`}
            >
              <div className="flex flex-col items-center">
                <span>{day.day}</span>
                <span className="text-xs opacity-70 mt-1">
                  {day.animes.length} {tx('тайтлов', day.animes.length === 1 ? 'title' : 'titles')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* АНИМЕ ВЫБРАННОГО ДНЯ */}
      {selectedDayData && (
        <div>
          {selectedDayData.animes.length === 0 ? (
            <div className="text-center py-20">
              <CalendarIcon size={48} className="text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">{t('calendar.no_episodes')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedDayData.animes.map(({ anime, nextEpisode, nextEpisodeAt }) => (
                <div
                  key={anime.id}
                  className="bg-zinc-900 rounded-lg p-4 hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => handleAnimeClick(anime)}
                >
                  <div className="flex gap-4">
                    {/* ПОСТЕР */}
                    <CachedImage
                      src={anime.poster}
          animeId={anime.id}
                      alt={anime.title}
                      className="w-24 h-36 object-cover rounded-lg"
                    />

                    {/* ИНФОРМАЦИЯ */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 hover:text-akari-purple transition-colors">
                        {anime.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                        {anime.rating && <span>⭐ {anime.rating.toFixed(1)}</span>}
                        {anime.year && (
                          <>
                            <span>•</span>
                            <span>{anime.year}</span>
                          </>
                        )}
                        {anime.episodes && (
                          <>
                            <span>•</span>
                            <span>{anime.episodes} {tx('сер.', 'eps.')}</span>
                          </>
                        )}
                      </div>

                      {/* СЛЕДУЮЩАЯ СЕРИЯ */}
                      <div className="flex items-center gap-2 text-akari-purple font-semibold">
                        <Clock size={16} />
                        <span>{t('calendar.episode')} {nextEpisode} {t('calendar.at')} {formatTime(nextEpisodeAt)}</span>
                      </div>

                      {/* ЖАНРЫ */}
                      {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {anime.genres.slice(0, 4).map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-full"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
