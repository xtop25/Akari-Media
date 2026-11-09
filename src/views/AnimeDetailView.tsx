import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Film, Bookmark, Link2 } from 'lucide-react';
import { StreamingSources } from '@/components/StreamingSources';
import { CachedImage } from '@/components/CachedImage';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '@/components/Player';
import { Anime } from '@/types';
import { getAnimeDetails, convertShikimoriToAnime, getSeasons, FranchiseNode } from '@/api/shikimori';
import { findEpisodes, LibriaEpisode } from '@/api/anilibria-v1';
import { getAnimeProgress } from '@/hooks/usePlayerProgress';
import { loadSettings, tx, getLanguage } from '@/hooks/useSettings';
import { readFavorites, toggleFavorite } from '@/hooks/favorites';

export function AnimeDetailView() {
  const { id } = useParams();
  const animeId = Number(id);
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [seasons, setSeasons] = useState<FranchiseNode[]>([]);
  const [episodePage, setEpisodePage] = useState(0);
  const [episodes, setEpisodes] = useState<LibriaEpisode[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [quality, setQuality] = useState(loadSettings().defaultQuality);

  useEffect(() => {
    let active = true;
    setAnime(null); setSeasons([]); setEpisodePage(0); setEpisodes([]); setSelected(null); setError(''); setVideoError(''); setManualUrl(''); setUrlInput(''); setLoading(true);
    if (!Number.isSafeInteger(animeId) || animeId <= 0) { setError(tx('Неверный идентификатор аниме', 'Invalid anime ID')); setLoading(false); return; }
    (async () => {
      try {
        const details = await getAnimeDetails(animeId);
        if (!active) return;
        const a = convertShikimoriToAnime(details);
        void getSeasons(animeId).then(items => { if (active) setSeasons(items); }).catch(() => { if (active) setSeasons([]); });
        setAnime(a); setFavorite(readFavorites().some(item => item.id === a.id)); setLoading(false); setVideoLoading(true);
        try {
          const result = await findEpisodes(animeId, [a.titleEnglish || '', a.title]);
          const list = result.episodes;
          if (!active) return;
          setEpisodes(list);
          const last = loadSettings().rememberLastEpisode ? getAnimeProgress(animeId) : null;
          const start = list.find(e => e.ordinal === last?.episode)?.ordinal ?? list[0]?.ordinal ?? null;
          setSelected(start);
          setEpisodePage(Math.max(0, Math.floor(list.findIndex(e => e.ordinal === start) / 50)));
          if (!list.length) setVideoError(result.reason === 'blocked' ? tx('AniLibria сообщает, что этот релиз ограничен по региону или правам.', 'AniLibria reports that this release is restricted by region or rights.') : result.reason === 'no_episodes' ? tx('Релиз есть в AniLibria, но доступных серий пока нет.', 'The release is listed on AniLibria, but has no playable episodes yet.') : tx('Этот тайтл не найден в AniLibria. Проверьте ссылки на сервисы ниже.', 'This title was not found on AniLibria. Check the services below.'));
        } catch { if (active) setVideoError(tx('Не удалось загрузить видео из AniLibria. Можно указать свою прямую ссылку.', 'Could not load video from AniLibria. You can enter your own direct link.')); }
        finally { if (active) setVideoLoading(false); }
      } catch { if (active) { setError(tx('Не удалось загрузить информацию об аниме. Проверьте интернет и повторите попытку.', 'Could not load anime details. Check your connection and try again.')); setLoading(false); } }
    })();
    return () => { active = false; };
  }, [animeId]);

  const episode = episodes.find(e => e.ordinal === selected);
  const videoUrl = manualUrl || (episode && (quality === 'fhd' ? episode.hls_1080 || episode.hls_720 || episode.hls_480 : quality === 'sd' ? episode.hls_480 || episode.hls_720 || episode.hls_1080 : episode.hls_720 || episode.hls_480 || episode.hls_1080)) || '';
  const index = episodes.findIndex(e => e.ordinal === selected);
  const selectEpisode = (i: number) => { if (episodes[i]) { setManualUrl(''); setSelected(episodes[i].ordinal); setEpisodePage(Math.floor(i / 50)); } };
  const pageEpisodes = episodes.slice(episodePage * 50, (episodePage + 1) * 50);
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
      <section className="watch-player-section"><div className="player-heading"><div><h2>{tx('Встроенный плеер', 'Built-in player')}</h2><p>{tx('Источник: AniLibria', 'Source: AniLibria')}{episodes.length ? ` · ${episodes.length} ${tx('серий', 'episodes')}` : ''}</p></div><span className={videoUrl ? 'player-status available' : 'player-status'}>{videoLoading ? tx('Поиск', 'Searching') : videoUrl ? tx('Серии найдены', 'Episodes found') : tx('Нет видео', 'No video')}</span></div>
        {videoUrl ? <div className="player-frame"><Player key={`${animeId}-${selected}-${manualUrl ? 'manual' : 'libria'}`} animeId={animeId} episode={selected ?? 1} videoUrl={videoUrl} source={manualUrl ? 'manual' : 'anilibria'} onPrev={index > 0 && !manualUrl ? () => selectEpisode(index-1) : undefined} onNext={index >= 0 && index < episodes.length-1 && !manualUrl ? () => selectEpisode(index+1) : undefined} /></div> : <div className="video-empty"><span className="video-empty-icon">{videoLoading ? <Loader2 className="animate-spin" size={22}/> : <Film size={22}/>}</span><div><strong>{videoLoading ? tx('Ищем видео', 'Finding video') : tx('Видео во встроенном плеере не найдено', 'No video found in the built-in player')}</strong><p>{videoLoading ? tx('Проверяем AniLibria…', 'Checking AniLibria…') : videoError || tx('Попробуйте выбрать другой сезон.', 'Try another season.')}</p></div></div>}
        {videoError && videoUrl && <p role="alert" className="sources-error">{videoError}</p>}
        <details className="manual-link"><summary><Link2 size={16}/>{tx('Открыть свою ссылку на видео', 'Open your own video link')}</summary><div className="manual-controls"><label>{tx('Прямая ссылка на MP4 или M3U8', 'Direct MP4 or M3U8 link')}<input aria-label={tx('Ссылка на видео', 'Video URL')} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://…" /></label><button onClick={useUrl}>{tx('Открыть', 'Open')}</button>{manualUrl && <button onClick={() => { setManualUrl(''); setUrlInput(''); }}>{tx('Вернуться к AniLibria', 'Return to AniLibria')}</button>}</div><p>{tx('Только прямые ссылки на видео, доступные вам; в браузере источник должен разрешать CORS.', 'Use direct links to videos available to you; browser streams must allow CORS.')}</p></details>
      </section>
      {!!episodes.length && <section className="episode-panel content-panel"><div className="season-heading"><div><h2>{tx('Доступные серии', 'Available episodes')}</h2><p>{tx('Источник: AniLibria', 'Source: AniLibria')} · {episodes.length} {tx('доступно', 'available')}{anime.episodes ? ` · ${tx('в каталоге Shikimori', 'in Shikimori')}: ${anime.episodes}` : ''}</p></div><label className="text-sm text-zinc-400">{tx('Качество', 'Quality')} <select value={quality} onChange={e => setQuality(e.target.value as 'sd'|'hd'|'fhd')} className="bg-zinc-800 p-2 rounded text-white"><option value="sd">480p</option><option value="hd">720p</option><option value="fhd">1080p</option></select></label></div>
        {anime.episodes && anime.episodes > episodes.length ? <p className="availability-note">{tx('Источник предоставляет не все серии этого тайтла. Посмотрите ссылки на другие сервисы ниже.', 'This source does not provide all episodes. See other services below.')}</p> : null}
        {episodes.length > 50 && <label className="range-label">{tx('Диапазон серий', 'Episode range')} <select value={episodePage} onChange={e => setEpisodePage(Number(e.target.value))}>{Array.from({length:Math.ceil(episodes.length/50)},(_,i) => <option value={i} key={i}>{episodes[i*50].ordinal}–{episodes[Math.min((i+1)*50, episodes.length)-1].ordinal}</option>)}</select></label>}
        <div className="episode-grid">{pageEpisodes.map(e => <button key={e.id} onClick={() => selectEpisode(episodes.findIndex(item => item.id === e.id))} className={`episode-button ${selected === e.ordinal && !manualUrl ? 'selected' : ''}`}>{tx('Серия', 'Episode')} {e.ordinal}</button>)}</div>
      </section>}
      <StreamingSources animeId={animeId}/>
      {seasons.length > 1 && <section className="season-panel content-panel"><div className="season-heading"><div><h2>{tx('Сезоны и продолжения', 'Seasons and sequels')}</h2><p>{tx('Связанные части основной истории', 'Connected parts of the main story')}</p></div><span>{seasons.length}</span></div><div className="season-list">{seasons.map((season, i) => <button key={season.id} onClick={() => { if (season.id !== animeId) navigate(`/watch/${season.id}`); }} className={`season-item ${season.id === animeId ? 'selected' : ''}`} aria-current={season.id === animeId ? 'true' : undefined}><span className="season-index">{String(i+1).padStart(2,'0')}</span><span className="season-name">{season.name}<small>{season.year || '—'} · {season.kind}</small></span><span className="season-arrow">{season.id === animeId ? '●' : '→'}</span></button>)}</div></section>}
      {anime.description && <section className="anime-description content-panel"><h2>{tx('Об аниме', 'About this anime')}</h2><p className="text-zinc-300 whitespace-pre-line">{anime.description.replace(/\[\/?[a-z]+(?:=[^\]]+)?\]/gi, '')}</p></section>}
    </>}
  </div>;
}
