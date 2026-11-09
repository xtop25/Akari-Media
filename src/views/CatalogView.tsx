// ============================================
// СТРАНИЦА КАТАЛОГА С ПОИСКОМ И ФИЛЬТРАМИ
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimeCard } from '@/components/AnimeCard';
import { Anime } from '@/types';
import { 
  searchAnime, 
  getAnimeWithFilters, 
  convertShikimoriToAnime,
  AnimeFilters 
} from '@/api/shikimori';
import { t, tx } from '@/hooks/useSettings';

const KINDS = [
  { value: 'tv', label: 'catalog.tv' },
  { value: 'movie', label: 'catalog.movie' },
  { value: 'ova', label: 'catalog.ova' },
  { value: 'ona', label: 'catalog.ona' },
];

const STATUSES = [
  { value: 'ongoing', label: 'catalog.airing' },
  { value: 'released', label: 'catalog.released' },
  { value: 'anons', label: 'catalog.upcoming' },
];

export function CatalogView() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestVersion = useRef(0);
  const navigate = useNavigate();
  
  // Filters
  const [filters, setFilters] = useState<AnimeFilters>({
    order: 'popularity',
  });

  // ============================================
  // ПОИСК И ФИЛЬТРАЦИЯ
  // ============================================
  useEffect(() => {
    let active = true;
    requestVersion.current++; setPage(1); setHasMore(false); setLoadingMore(false);
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = searchQuery.trim()
          ? await searchAnime(searchQuery.trim(), 24, filters)
          : await getAnimeWithFilters(filters, 1, 24);
        if (active) { setAnimes(results.map(convertShikimoriToAnime)); setHasMore(results.length === 24); setIsOffline(false); }
      } catch (error) {
        console.error('[CatalogView] Ошибка загрузки:', error);
        if (active) { setAnimes([]); setIsOffline(true); }
      } finally { if (active) setIsLoading(false); }
    }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery, filters]);

  const loadMore = async () => {
    if (loadingMore || isLoading || !hasMore) return;
    const version = requestVersion.current; const next = page + 1; setLoadingMore(true);
    try {
      const results = searchQuery.trim() ? await searchAnime(searchQuery.trim(), 24, filters, next) : await getAnimeWithFilters(filters, next, 24);
      if (requestVersion.current !== version) return;
      setAnimes(previous => { const ids = new Set(previous.map(a => a.id)); return [...previous, ...results.map(convertShikimoriToAnime).filter(a => !ids.has(a.id))]; });
      setPage(next); setHasMore(results.length === 24); setIsOffline(false);
    } catch { if (requestVersion.current === version) setIsOffline(true); }
    finally { if (requestVersion.current === version) setLoadingMore(false); }
  };

  const handleFilterChange = (key: keyof AnimeFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key !== 'order' && value === prev[key] ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({ order: 'popularity' });
    setSearchQuery('');
  };

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/watch/${anime.id}`);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => key !== 'order' && filters[key as keyof AnimeFilters]
  ).length;

  return (
    <div className="min-h-screen bg-akari-dark text-white p-8">
      {/* ЗАГОЛОВОК И ПОИСК */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
          {t('catalog.title')}
        </h1>

        <div className="flex items-center gap-4">
          {/* СТРОКА ПОИСКА */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder={t('catalog.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg 
                       focus:outline-none focus:border-akari-purple transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* КНОПКА ФИЛЬТРОВ */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-akari-purple text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Filter size={20} />
{t('catalog.filters')}
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* БАННЕР ОФЛАЙН */}
      {isOffline && (
        <div className="mb-6 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3 text-sm">
          <Loader2 size={16} className="text-yellow-500 animate-pulse" />
          <span className="text-zinc-300">{t('catalog.offline')}</span>
        </div>
      )}

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      {showFilters && (
        <div className="mb-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{t('catalog.filters')}</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {t('catalog.clear_filters')}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* ТИП */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-zinc-400">{t('catalog.type')}</h4>
              <div className="flex flex-wrap gap-2">
                {KINDS.map((kind) => (
                  <button
                    key={kind.value}
                    onClick={() => handleFilterChange('kind', kind.value)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filters.kind === kind.value
                        ? 'bg-akari-purple text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {kind.value === 'tv' ? tx('Сериал','TV series') : kind.value === 'movie' ? tx('Фильм','Movie') : kind.value.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* СТАТУС */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-zinc-400">{t('catalog.status')}</h4>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleFilterChange('status', status.value)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filters.status === status.value
                        ? 'bg-akari-purple text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {status.value === 'ongoing' ? tx('Выходит','Airing') : status.value === 'released' ? tx('Завершено','Finished') : tx('Анонс','Upcoming')}
                  </button>
                ))}
              </div>
            </div>

            {/* СОРТИРОВКА */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-zinc-400">{t('catalog.sort')}</h4>
              <select
                value={filters.order || 'popularity'}
                onChange={(e) => handleFilterChange('order', e.target.value)}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-akari-purple"
              >
<option value="popularity">{t('catalog.sort_popularity')}</option>
              <option value="ranked">{t('catalog.sort_rating')}</option>
              <option value="name">{t('catalog.sort_name')}</option>
              <option value="aired_on">{t('catalog.sort_date')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ИНДИКАТОР ЗАГРУЗКИ */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-akari-purple" size={48} />
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ */}
      {!isLoading && animes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-400">{tx('Показано', 'Showing')}: {animes.length}</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} onClick={() => handleAnimeClick(anime)} />
            ))}
          </div>
          {hasMore && <div className="catalog-more"><button onClick={loadMore} disabled={loadingMore}>{loadingMore ? tx('Загружаем…', 'Loading…') : tx('Показать ещё', 'Show more')}</button></div>}
        </div>
      )}

      {/* НЕТ РЕЗУЛЬТАТОВ */}
      {!isLoading && animes.length === 0 && (searchQuery || activeFiltersCount > 0) && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">{t('catalog.no_results')}</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-6 py-2 bg-akari-purple hover:bg-akari-purple/80 rounded-lg transition-colors"
          >
            {t('catalog.reset')} {t('catalog.filters')}
          </button>
        </div>
      )}
    </div>
  );
}
