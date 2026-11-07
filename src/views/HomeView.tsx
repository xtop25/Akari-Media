// ============================================
// ГЛАВНАЯ СТРАНИЦА (ДОМАШНИЙ ЭКРАН)
// ============================================
// Сетка карточек с трендами, онгоингами
// Индикаторы прогресса на просмотренных тайтлах

import React, { useState, useEffect } from 'react';
import { TrendingUp, Tv, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimeCard } from '@/components/AnimeCard';
import { CachedImage } from '@/components/CachedImage';
import { Anime } from '@/types';
import { getTrendingAnime, getOngoingAnime, convertShikimoriToAnime } from '@/api/shikimori';
import { t } from '@/hooks/useSettings';

export function HomeView() {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [ongoing, setOngoing] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();

  // ============================================
  // FALLBACK MOCK DATA
  // ============================================
  const fallbackTrending: Anime[] = [
    { id: 22589, title: 'Jujutsu Kaisen S3', poster: 'https://shikimori.one/system/animes/original/22589.jpg', rating: 8.9, year: 2024, episodes: 24, status: 'ongoing', genres: ['Action', 'Fantasy', 'Shonen'] },
    { id: 16498, title: 'Attack on Titan: Final Season', poster: 'https://shikimori.one/system/animes/original/16498.jpg', rating: 9.1, year: 2023, episodes: 12, status: 'released', genres: ['Action', 'Drama', 'Shonen'] },
    { id: 20589, title: 'Chainsaw Man', poster: 'https://shikimori.one/system/animes/original/20589.jpg', rating: 8.7, year: 2024, episodes: 12, status: 'ongoing', genres: ['Action', 'Horror', 'Shonen'] },
    { id: 21202, title: 'Demon Slayer: Swordsmith Village', poster: 'https://shikimori.one/system/animes/original/21202.jpg', rating: 8.6, year: 2023, episodes: 26, status: 'released', genres: ['Action', 'Fantasy', 'Shonen'] },
    { id: 22545, title: 'One Punch Man S3', poster: 'https://shikimori.one/system/animes/original/22545.jpg', rating: 8.8, year: 2024, episodes: 12, status: 'ongoing', genres: ['Action', 'Comedy', 'Seinen'] },
    { id: 22746, title: 'Solo Leveling', poster: 'https://shikimori.one/system/animes/original/22746.jpg', rating: 8.5, year: 2024, episodes: 12, status: 'ongoing', genres: ['Action', 'Fantasy', 'Adventure'] },
    { id: 20858, title: 'Mushoku Tensei S2', poster: 'https://shikimori.one/system/animes/original/20858.jpg', rating: 8.4, year: 2024, episodes: 12, status: 'ongoing', genres: ['Fantasy', 'Adventure', 'Drama'] },
    { id: 21079, title: 'Frieren: Beyond Journey\'s End', poster: 'https://shikimori.one/system/animes/original/21079.jpg', rating: 9.0, year: 2024, episodes: 28, status: 'released', genres: ['Fantasy', 'Adventure', 'Drama'] },
  ];

  const fallbackOngoing: Anime[] = fallbackTrending.filter(a => a.status === 'ongoing');

  // ============================================
  // ЗАГРУЗКА ДАННЫХ ИЗ SHIKIMORI API
  // ============================================
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [trendingData, ongoingData] = await Promise.all([
          getTrendingAnime(24),
          getOngoingAnime(24),
        ]);

        setTrending(trendingData.map(convertShikimoriToAnime));
        setOngoing(ongoingData.map(convertShikimoriToAnime));
      } catch (err) {
        console.error('[HomeView] API недоступен, показываю fallback:', err);
        setTrending(fallbackTrending);
        setOngoing(fallbackOngoing);
        setIsOffline(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/watch/${anime.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-akari-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (trending.length === 0 && ongoing.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Нет данных</h2>
          <p className="text-zinc-400">{error || 'Could not load anime'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-akari-purple hover:bg-akari-purple/80 rounded-lg transition-colors"
          >
            {t('common.reload')}
          </button>
        </div>
      </div>
    );
  }

  const featuredAnime = trending[0];

  return (
    <div className="min-h-screen bg-akari-dark text-white p-8 overflow-y-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
          {t('app.name')}
        </h1>
        <p className="text-zinc-400 mt-2">
          {t('app.tagline')}
        </p>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="mb-6 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle size={16} className="text-yellow-500" />
          <span className="text-zinc-300">{t('error.offline')}</span>
        </div>
      )}

      {/* FEATURED SECTION */}
      <div className="relative h-96 rounded-2xl overflow-hidden mb-12 group">
        <CachedImage
          src={featuredAnime.poster}
          alt={featuredAnime.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-akari-dark via-akari-dark/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-akari-purple" size={20} />
            <span className="text-sm text-zinc-400">{t('home.most_popular')}</span>
          </div>
          <h2 className="text-5xl font-bold mb-4">{featuredAnime.title}</h2>
          <p className="text-zinc-300 max-w-2xl mb-6 line-clamp-2">
            {featuredAnime.description || 'An exciting story about heroes\' adventures in a world of magic and action.'}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleAnimeClick(featuredAnime)}
              className="px-8 py-3 bg-akari-purple hover:bg-akari-purple/80 rounded-lg font-semibold 
                       transition-all duration-300 flex items-center gap-2 hover:scale-105"
            >
              <Tv size={20} />
              {t('home.watch')}
            </button>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              {featuredAnime.rating && <span>⭐ {featuredAnime.rating.toFixed(1)}</span>}
              {featuredAnime.rating && <span>•</span>}
              {featuredAnime.year && <span>{featuredAnime.year}</span>}
              {featuredAnime.year && featuredAnime.episodes && <span>•</span>}
              {featuredAnime.episodes && <span>{featuredAnime.episodes} {featuredAnime.episodes === 1 ? 'ep.' : 'eps.'}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ONGOING */}
      <Section title={t('home.ongoing')} icon={<Tv className="text-akari-purple" />}>
        <AnimeGrid animes={ongoing} onAnimeClick={handleAnimeClick} />
      </Section>

      {/* TRENDING */}
      <Section title={t('home.trending')} icon={<TrendingUp className="text-akari-blue" />}>
        <AnimeGrid animes={trending} onAnimeClick={handleAnimeClick} />
      </Section>
    </div>
  );
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// ============================================

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

interface AnimeGridProps {
  animes: Anime[];
  onAnimeClick: (anime: Anime) => void;
}

function AnimeGrid({ animes, onAnimeClick }: AnimeGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} onClick={() => onAnimeClick(anime)} />
      ))}
    </div>
  );
}
