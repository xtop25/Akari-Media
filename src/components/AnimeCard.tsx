import { Play, Star } from 'lucide-react';
import { Anime } from '@/types';
import { getAnimeProgress, getProgressPercentage } from '@/hooks/usePlayerProgress';
import { CachedImage } from '@/components/CachedImage';
import { t, tx, getLanguage } from '@/hooks/useSettings';

interface AnimeCardProps { anime: Anime; onClick: () => void }
export function AnimeCard({ anime, onClick }: AnimeCardProps) {
  const progress = getAnimeProgress(anime.id);
  const title = getLanguage() === 'en' ? anime.titleEnglish || anime.title : anime.title;
  const status = anime.status === 'ongoing' ? tx('Выходит', 'Airing') : anime.status === 'anons' ? tx('Скоро', 'Upcoming') : tx('Завершено', 'Finished');
  return <button type="button" onClick={onClick} className="anime-card group" aria-label={`${title} — ${t('home.watch')}`}>
    <div className="card-poster">
      <CachedImage src={anime.poster} animeId={anime.id} alt={title} className="card-image" />
      <div className="card-shade" />
      {anime.rating ? <span className="card-score"><Star size={12} fill="currentColor" /> {anime.rating.toFixed(1)}</span> : null}
      {anime.status && anime.status !== 'released' && <span className="card-status">{status}</span>}
      <span className="card-play" aria-hidden="true"><Play size={20} fill="currentColor" /></span>
      {progress && <span className="card-progress"><span style={{width: `${getProgressPercentage(progress)}%`}} /></span>}
    </div>
    <div className="card-body"><h3 className="card-title">{title}</h3><div className="card-meta"><span>{anime.year || '—'}</span>{!!anime.episodes && <span>{anime.episodes} {tx('сер.', anime.episodes === 1 ? 'ep.' : 'eps.')}</span>}</div>
      {progress && <div className="card-continue"><Play size={11} fill="currentColor" /> {t('home.continue')}: {t('home.episode')} {progress.episode}</div>}
    </div>
  </button>;
}
