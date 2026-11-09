import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '@/components/Player';
import { Anime } from '@/types';
import { getAnimeDetails, convertShikimoriToAnime } from '@/api/shikimori';
import { findEpisodes, LibriaEpisode } from '@/api/anilibria-v1';
import { getAnimeProgress } from '@/hooks/usePlayerProgress';
import { loadSettings, tx, getLanguage } from '@/hooks/useSettings';
import { readFavorites, toggleFavorite } from '@/hooks/favorites';

export function AnimeDetailView() {
  const { id } = useParams();
  const animeId = Number(id);
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
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
    setAnime(null); setEpisodes([]); setSelected(null); setError(''); setVideoError(''); setManualUrl(''); setUrlInput(''); setLoading(true);
    if (!Number.isSafeInteger(animeId) || animeId <= 0) { setError(tx('Неверный идентификатор аниме', 'Invalid anime ID')); setLoading(false); return; }
    (async () => {
      try {
        const details = await getAnimeDetails(animeId);
        if (!active) return;
        const a = convertShikimoriToAnime(details); setAnime(a); setFavorite(readFavorites().some(item => item.id === a.id)); setLoading(false); setVideoLoading(true);
        try {
          let list = await findEpisodes(animeId, a.titleEnglish || a.title);
          if (!list.length && a.titleEnglish && a.titleEnglish !== a.title) list = await findEpisodes(animeId, a.title);
          if (!active) return;
          setEpisodes(list);
          const last = loadSettings().rememberLastEpisode ? getAnimeProgress(animeId) : null;
          setSelected(list.find(e => e.ordinal === last?.episode)?.ordinal ?? list[0]?.ordinal ?? null);
          if (!list.length) setVideoError(tx('Видео для этого тайтла не найдено или недоступно в вашем регионе. Можно указать свою прямую ссылку.', 'Video not found or unavailable in your region. You can enter your own direct link.'));
        } catch { if (active) setVideoError(tx('Не удалось загрузить видео из AniLibria. Можно указать свою прямую ссылку.', 'Could not load video from AniLibria. You can enter your own direct link.')); }
        finally { if (active) setVideoLoading(false); }
      } catch { if (active) { setError(tx('Не удалось загрузить информацию об аниме. Проверьте интернет и повторите попытку.', 'Could not load anime details. Check your connection and try again.')); setLoading(false); } }
    })();
    return () => { active = false; };
  }, [animeId]);

  const episode = episodes.find(e => e.ordinal === selected);
  const videoUrl = manualUrl || (episode && (quality === 'fhd' ? episode.hls_1080 || episode.hls_720 || episode.hls_480 : quality === 'sd' ? episode.hls_480 || episode.hls_720 || episode.hls_1080 : episode.hls_720 || episode.hls_480 || episode.hls_1080)) || '';
  const index = episodes.findIndex(e => e.ordinal === selected);
  const useUrl = () => {
    try { const url = new URL(urlInput.trim()); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); setManualUrl(url.href); setVideoError(''); }
    catch { setVideoError(tx('Введите корректную прямую ссылку HTTP(S) на MP4 или M3U8.', 'Enter a valid direct HTTP(S) link to an MP4 or M3U8 file.')); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-akari-purple" size={48} /></div>;
  return <div className="min-h-screen bg-akari-dark text-white">
    <div className="p-4"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white"><ArrowLeft size={20} /> {tx('Назад', 'Back')}</button></div>
    {error ? <div role="alert" className="p-8">{error} <button className="text-akari-purple" onClick={() => location.reload()}>{tx('Повторить', 'Try again')}</button></div> : anime && <>
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-5 page-enter"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="eyebrow">AKARI MEDIA · {tx('ПРОСМОТР', 'WATCHING')}</div><h1 className="text-3xl font-bold">{getLanguage() === 'en' ? anime.titleEnglish || anime.title : anime.title}</h1><div className="flex gap-4 text-sm text-zinc-400 mt-2">{anime.rating && <span>★ {anime.rating.toFixed(1)}</span>}{anime.year && <span>{anime.year}</span>}{anime.episodes && <span>{tx('Серий', 'Episodes')}: {anime.episodes}</span>}</div></div><button onClick={() => setFavorite(toggleFavorite(anime))} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">{favorite ? tx('★ Удалить из избранного', '★ Remove from favorites') : tx('☆ В избранное', '☆ Add to favorites')}</button></div></div>
      <div className="max-w-6xl mx-auto px-4">
        {videoUrl ? <Player key={`${animeId}-${selected}-${manualUrl ? 'manual' : 'libria'}`} animeId={animeId} episode={selected ?? 1} videoUrl={videoUrl} source={manualUrl ? 'manual' : 'anilibria'} onPrev={index > 0 && !manualUrl ? () => setSelected(episodes[index-1].ordinal) : undefined} onNext={index >= 0 && index < episodes.length-1 && !manualUrl ? () => setSelected(episodes[index+1].ordinal) : undefined} /> : <div className="aspect-video bg-black flex items-center justify-center p-6 text-center text-zinc-400">{videoLoading ? tx('Поиск видео…', 'Finding video…') : videoError || tx('Видео недоступно', 'Video unavailable')}</div>}
        {videoError && videoUrl && <p role="alert" className="text-amber-400 mt-2">{videoError}</p>}
        <div className="mt-4 flex flex-wrap items-end gap-2"><label className="flex-1 min-w-64 text-sm text-zinc-400">{tx('Своя прямая ссылка на видео (MP4 / M3U8)', 'Direct video URL (MP4 / M3U8)')}<input aria-label={tx('Ссылка на видео', 'Video URL')} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://…" className="block mt-1 w-full p-2 bg-zinc-900 rounded border border-zinc-700 text-white" /></label><button onClick={useUrl} className="px-4 py-2 bg-akari-purple rounded">{tx('Открыть', 'Open')}</button>{manualUrl && <button onClick={() => { setManualUrl(''); setUrlInput(''); }} className="px-4 py-2 bg-zinc-800 rounded">{tx('Вернуться к AniLibria', 'Return to AniLibria')}</button>}</div>
        <p className="text-xs text-zinc-500 mt-2">{tx('Только прямые ссылки на видео, доступные вам. Доступность и реклама зависят от источника. В браузере поток должен разрешать CORS.', 'Use direct links to videos available to you. Availability and ads depend on the source. Streams must allow CORS in a browser.')}</p>
      </div>
      <div className="max-w-6xl mx-auto p-8">
        {anime.description && <p className="text-zinc-300 whitespace-pre-line">{anime.description.replace(/\[\/?[a-z]+(?:=[^\]]+)?\]/gi, '')}</p>}
        {!!episodes.length && <><div className="flex justify-between items-center mt-8 mb-4"><h2 className="text-xl font-bold">{tx('Серии AniLibria', 'AniLibria episodes')}</h2><label className="text-sm text-zinc-400">{tx('Качество', 'Quality')} <select value={quality} onChange={e => setQuality(e.target.value as 'sd'|'hd'|'fhd')} className="bg-zinc-800 p-2 rounded text-white"><option value="sd">480p</option><option value="hd">720p</option><option value="fhd">1080p</option></select></label></div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">{episodes.map(e => <button key={e.id} onClick={() => {setManualUrl(''); setSelected(e.ordinal);}} className={`p-3 rounded-lg text-sm ${selected === e.ordinal && !manualUrl ? 'bg-akari-purple' : 'bg-zinc-900 hover:bg-zinc-800'}`}>{tx('Серия', 'Episode')} {e.ordinal}</button>)}</div></>}
      </div>
    </>}
  </div>;
}
