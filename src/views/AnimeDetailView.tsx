import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '@/components/Player';
import { CachedImage } from '@/components/CachedImage';
import { Anime, Translation } from '@/types';
import { getAnimeDetails, convertShikimoriToAnime } from '@/api/shikimori';
import { t } from '@/hooks/useSettings';

const MOCK_TRANSLATIONS: Translation[] = [
  { id: 'anilibria', title: 'AniLibria (Dub)', type: 'voice' },
  { id: 'animevost', title: 'AnimeVost (Dub)', type: 'voice' },
  { id: 'sofier', title: 'Sofier (Sub)', type: 'sub' },
];

export function AnimeDetailView() {
  const params = useParams();
  const navigate = useNavigate();
  const animeId = Number(params['id'] || 22746);

  const [anime, setAnime] = useState<Anime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [currentTranslation, setCurrentTranslation] = useState(MOCK_TRANSLATIONS[0]);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);

  // Fallback for when API is down
  const fallbackAnime: Anime = {
    id: animeId,
    title: `Anime #${animeId}`,
    poster: `https://shikimori.one/system/animes/original/${animeId}.jpg`,
    rating: undefined,
    year: undefined,
    episodes: 12,
    status: undefined,
    genres: [],
    description: 'No description available.',
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAnimeDetails(animeId);
        setAnime(convertShikimoriToAnime(data));
      } catch {
        console.log('[AnimeDetail] API unavailable, using fallback');
        setAnime(fallbackAnime);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [animeId]);

  const handleToggleMiniPlayer = () => setIsMiniPlayer(!isMiniPlayer);
  const handleTranslationChange = (trans: Translation) => setCurrentTranslation(trans);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-akari-purple" size={48} />
      </div>
    );
  }

  const epCount = anime?.episodes || 12;
  const episodeList = Array.from({ length: epCount }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1}`,
  }));

  return (
    <div className="min-h-screen bg-akari-dark text-white">
      {/* Back */}
      <div className="p-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      {/* Player */}
      <div className="max-w-6xl mx-auto px-4">
        <Player
          animeId={anime?.id || animeId}
          episode={selectedEpisode}
          videoUrl={`https://example.com/anime/${anime?.id || animeId}/ep${selectedEpisode}.m3u8`}
          translations={MOCK_TRANSLATIONS}
          currentTranslation={currentTranslation}
          onTranslationChange={handleTranslationChange}
          onNextEpisode={() => setSelectedEpisode(Math.min(selectedEpisode + 1, epCount))}
          onPrevEpisode={() => setSelectedEpisode(Math.max(selectedEpisode - 1, 1))}
          isMiniPlayer={false}
          onToggleMiniPlayer={handleToggleMiniPlayer}
        />
      </div>

      {/* Info */}
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">{anime?.title || fallbackAnime.title}</h1>
        {anime?.titleEnglish && <p className="text-zinc-500 text-sm mb-4">{anime.titleEnglish}</p>}

        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-6">
          {anime?.rating && <span>⭐ {anime.rating.toFixed(1)}</span>}
          {anime?.year && <span>• {anime.year}</span>}
          {anime?.episodes && <span>• {anime.episodes} {anime.episodes === 1 ? 'episode' : 'episodes'}</span>}
          {anime?.status === 'ongoing' && <span className="text-akari-purple">• Airing</span>}
        </div>

        {anime?.description && <p className="text-zinc-300 max-w-4xl leading-relaxed">{anime.description}</p>}

        {anime?.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {anime.genres.map((g) => (
              <span key={g} className="px-3 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-full">{g}</span>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold mt-8 mb-4">{t('player.episodes')}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {episodeList.map((ep) => (
            <button
              key={ep.number}
              onClick={() => setSelectedEpisode(ep.number)}
              className={`p-3 rounded-lg text-sm transition-all duration-300 ${
                selectedEpisode === ep.number
                  ? 'bg-akari-purple text-white ring-2 ring-akari-blue'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="font-bold">{ep.number}</div>
              <div className="text-xs opacity-70 mt-1">{ep.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}