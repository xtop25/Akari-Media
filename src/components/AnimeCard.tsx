// ============================================
// КАРТОЧКА АНИМЕ С ИНДИКАТОРОМ ПРОГРЕССА
// ============================================

import React from 'react';
import { Play, Clock } from 'lucide-react';
import { Anime, PlayerProgress } from '@/types';
import { getAnimeProgress, getProgressPercentage } from '@/hooks/usePlayerProgress';
import { CachedImage } from '@/components/CachedImage';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

export function AnimeCard({ anime, onClick }: AnimeCardProps) {
  // Получаем прогресс просмотра из localStorage
  const progress = getAnimeProgress(anime.id);
  const progressPercent = getProgressPercentage(progress);

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900 rounded-xl overflow-hidden cursor-pointer 
                 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-akari-purple/20
                 animate-fade-in"
    >
      {/* POSTER */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <CachedImage
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* ОВЕРЛЕЙ С ГРАДИЕНТОМ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* КНОПКА PLAY ПРИ ХОВЕРЕ */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-4 bg-akari-purple/90 rounded-full backdrop-blur-sm">
            <Play size={32} fill="white" />
          </div>
        </div>

        {/* STATUS TAG */}
        {anime.status && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-md backdrop-blur-md ${
              anime.status === 'ongoing' 
                ? 'bg-akari-purple/80 text-white' 
                : 'bg-zinc-800/80 text-zinc-300'
            }`}>
              {anime.status === 'ongoing' ? 'Airing' : 'Released'}
            </span>
          </div>
        )}

        {/* РЕЙТИНГ */}
        {anime.rating && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-bold bg-yellow-500/90 text-black rounded-md backdrop-blur-md">
              ⭐ {anime.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* ПРОГРЕСС БАР */}
        {progress && progressPercent > 5 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80">
            <div
              className="h-full bg-akari-purple transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* ИНФОРМАЦИЯ */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-akari-purple transition-colors">
          {anime.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{anime.year}</span>
{anime.episodes && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {anime.episodes} {anime.episodes === 1 ? 'ep.' : 'eps.'}
          </span>
        )}
        </div>

        {/* ЖАНРЫ */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

{/* CONTINUE WATCHING INDICATOR */}
      {progress && (
        <div className="mt-2 flex items-center gap-2 text-xs text-akari-purple">
          <Play size={12} fill="currentColor" />
          <span>Continue: Ep. {progress.episode}</span>
        </div>
      )}
      </div>
    </div>
  );
}
