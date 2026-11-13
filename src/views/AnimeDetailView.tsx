import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Bookmark, Link2 } from 'lucide-react';
import { StreamingSources } from '@/components/StreamingSources';
import { CinextreamPlayer } from '@/components/CinextreamPlayer';
import { YummyPlayer } from '@/components/YummyPlayer';
import { LibraryEditor } from '@/components/LibraryEditor';
import { CachedImage } from '@/components/CachedImage';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '@/components/Player';
import { Anime } from '@/types';
import { getAnimeDetails, convertShikimoriToAnime, getSeasons, FranchiseNode } from '@/api/shikimori';
import { tx, getLanguage } from '@/hooks/useSettings';
import { readFavorites, toggleFavorite } from '@/hooks/favorites';

export function AnimeDetailView() {
  const { id } = useParams();
  const animeId = Number(id);
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [seasons, setSeasons] = useState<FranchiseNode[]>([]);
  const [seasonStatus, setSeasonStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [seasonRetry, setSeasonRetry] = useState(0);
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [playerSource, setPlayerSource] = useState<'manual' | 'cinextream' | 'yummy'>(() => { try { const saved = localStorage.getItem('akari_video_source'); return saved === 'cinextream' || saved === 'manual' ? saved : 'yummy'; } catch { return 'yummy'; } });
  const chooseSource = (source:'manual' | 'cinextream' | 'yummy') => { setPlayerSource(source); try { localStorage.setItem('akari_video_source', source); } catch { /* source still changes for this session */ } };

  useEffect(() => {
    let active = true;
    setAnime(null); setSeasons([]); setError(''); setVideoError(''); setManualUrl(''); setUrlInput(''); setLoading(true);
    if (!Number.isSafeInteger(animeId) || animeId <= 0) { setError(tx('Неверный идентификатор аниме', 'Invalid anime ID')); setLoading(false); return; }
    (async () => {
      try {
        const details = await getAnimeDetails(animeId);
        if (!active) return;
        const a = convertShikimoriToAnime(details);
        setAnime(a); setFavorite(readFavorites().some(item => item.id === a.id)); setLoading(false);
      } catch { if (active) { setError(tx('Не удалось загрузить информацию об аниме. Проверьте интернет и повторите попытку.', 'Could not load anime details. Check your connection and try again.')); setLoading(false); } }
    })();
    return () => { active = false; };
  }, [animeId]);

  useEffect(() => {
    if (!Number.isSafeInteger(animeId) || animeId <= 0) return;
    let active = true; setSeasonStatus('loading'); setSeasons([]); setShowAllSeasons(false);
    getSeasons(animeId).then(items => { if (active) {setSeasons(items);setSeasonStatus('ready');} }).catch(() => {if (active) setSeasonStatus('error');});
    return () => { active = false; };
  }, [animeId, seasonRetry]);

  const useUrl = () => {
    try { const url = new URL(urlInput.trim()); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); setManualUrl(url.href); setVideoError(''); }
    catch { setVideoError(tx('Введите корректную прямую ссылку HTTP(S) на MP4 или M3U8.', 'Enter a valid direct HTTP(S) link to an MP4 or M3U8 file.')); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-akari-purple" size={48} /></div>;
  return <div className="watch-page page-enter">
    <button onClick={() => navigate(-1)} className="watch-back"><ArrowLeft size={18} /> {tx('Назад', 'Back')}</button>
    {error ? <div role="alert" className="watch-error">{error} <button onClick={() => location.reload()}>{tx('Повторить', 'Try again')}</button></div> : anime && <>
      <header className="watch-header">
        <CachedImage src={anime.poster} animeId={anime.id} alt="" className="watch-poster" />
        <div className="watch-title"><div className="section-kicker">AKARI MEDIA / {tx('АНИМЕ', 'ANIME')}</div><h1>{getLanguage() === 'en' ? anime.titleEnglish || anime.title : anime.title}</h1><div className="watch-meta">{anime.rating && <span>★ {anime.rating.toFixed(1)}</span>}{anime.year && <span>{anime.year}</span>}{anime.episodes && <span>{anime.episodes} {tx('серий', 'episodes')}</span>}</div></div>
        <button onClick={() => setFavorite(toggleFavorite(anime))} className={`watch-favorite ${favorite ? 'is-favorite' : ''}`}><Bookmark size={17} fill={favorite ? 'currentColor' : 'none'}/>{favorite ? tx('В избранном', 'Saved') : tx('В избранное', 'Add to favorites')}</button>
      </header>
      {seasons.length > 1 && <section className="season-panel content-panel"><div className="season-heading"><div><h2>{tx('Сезоны и продолжения', 'Seasons and sequels')}</h2><p>{tx('Связанные части основной истории', 'Connected parts of the main story')}</p></div><span>{seasons.length}</span></div><div className="season-list">{seasons.map((season, i) => (showAllSeasons || i < 3 || season.id === animeId) && <button key={season.id} onClick={() => { if (season.id !== animeId) navigate(`/watch/${season.id}`); }} className={`season-item ${season.id === animeId ? 'selected' : ''}`} aria-current={season.id === animeId ? 'true' : undefined}><span className="season-index">{String(i+1).padStart(2,'0')}</span><span className="season-name">{season.name}<small>{season.year || '—'} · {season.kind}</small></span><span className="season-arrow">{season.id === animeId ? '●' : '→'}</span></button>)}</div>{seasons.length > 3 && <button className="season-expand" aria-expanded={showAllSeasons} onClick={() => setShowAllSeasons(v => !v)}>{showAllSeasons ? tx('Свернуть', 'Show less') : `${tx('Показать все', 'Show all')} (${seasons.length})`}</button>}</section>}
      {seasonStatus === 'loading' && <div className="season-loading" role="status">{tx('Ищем сезоны…', 'Finding seasons…')}</div>}
      {seasonStatus === 'error' && <div className="season-error" role="status">{tx('Не удалось загрузить сезоны.', 'Could not load seasons.')} <button onClick={() => setSeasonRetry(x => x+1)}>{tx('Повторить', 'Retry')}</button></div>}
      <LibraryEditor key={anime.id} anime={anime}/>
      <section className="watch-player-section"><div className="watch-source-tabs" role="group" aria-label={tx('Источник видео', 'Video source')}><button className={playerSource === 'cinextream' ? 'active' : ''} aria-pressed={playerSource === 'cinextream'} onClick={() => chooseSource('cinextream')}>Cinextream <small>{tx('Японский / английский', 'Japanese / English')}</small></button><button className={playerSource === 'yummy' ? 'active' : ''} aria-pressed={playerSource === 'yummy'} onClick={() => chooseSource('yummy')}>YummyAnime <small>{tx('Русский · эксперимент', 'Russian · experimental')}</small></button><button className={playerSource === 'manual' ? 'active' : ''} aria-pressed={playerSource === 'manual'} onClick={() => chooseSource('manual')}>{tx('Своя ссылка', 'Your link')}</button></div>
        {playerSource === 'yummy' ? <YummyPlayer anime={anime} animeId={animeId} titles={[anime.title, anime.titleEnglish || '']}/> : playerSource === 'cinextream' ? <CinextreamPlayer animeId={animeId} episodeCount={anime.episodes}/> : <>
        {manualUrl && <div className="player-frame"><Player key={`${animeId}-${manualUrl}`} animeId={animeId} episode={1} videoUrl={manualUrl} source="manual" /></div>}
        {videoError && <p role="alert" className="sources-error">{videoError}</p>}
        <details className="manual-link" open><summary><Link2 size={16}/>{tx('Открыть свою ссылку на видео', 'Open your own video link')}</summary><div className="manual-controls"><label>{tx('Прямая ссылка на MP4 или M3U8', 'Direct MP4 or M3U8 link')}<input aria-label={tx('Ссылка на видео', 'Video URL')} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://…" /></label><button onClick={useUrl}>{tx('Открыть', 'Open')}</button>{manualUrl && <button onClick={() => { setManualUrl(''); setUrlInput(''); }}>{tx('Закрыть видео', 'Close video')}</button>}</div><p>{tx('Только прямые ссылки на видео, доступные вам; в браузере источник должен разрешать CORS.', 'Use direct links to videos available to you; browser streams must allow CORS.')}</p></details>
      </>}
      </section>
      <StreamingSources animeId={animeId}/>

      {anime.description && <section className="anime-description content-panel"><h2>{tx('Об аниме', 'About this anime')}</h2><p className="text-zinc-300 whitespace-pre-line">{anime.description.replace(/\[\/?[a-z]+(?:=[^\]]+)?\]/gi, '')}</p></section>}
    </>}
  </div>;
}
