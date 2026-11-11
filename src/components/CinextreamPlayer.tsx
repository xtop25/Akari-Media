import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { tx } from '@/hooks/useSettings';

type Audio = 'sub' | 'dub';
const PROVIDER = 'https://cinextream.cc';

/** An isolated third-party player. Episode metadata is not a playback guarantee. */
export function CinextreamPlayer({ animeId, episodeCount }: { animeId: number; episodeCount?: number }) {
  const [audio, setAudio] = useState<Audio>('sub');
  const [episode, setEpisode] = useState(1);
  const [input, setInput] = useState('1');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const frame = useRef<HTMLIFrameElement>(null);
  const count = Number.isSafeInteger(episodeCount) && (episodeCount || 0) > 0 ? Math.min(episodeCount!, 10000) : 0;
  const src = `${PROVIDER}/api/embed/anime/mal/${audio}/${animeId}/${episode}`;
  useEffect(() => {
    if (!open) return;
    setStatus('loading');
    const timer = window.setTimeout(() => setStatus(current => current === 'loading' ? 'failed' : current), 25000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== PROVIDER || event.source !== frame.current?.contentWindow || !event.data || typeof event.data !== 'object') return;
      if (event.data.event === 'player_ready' || (event.data.type === 'video_state' && event.data.action === 'play')) setStatus('ready');
      if (event.data.event === 'player_error' && event.data.reason === 'all_servers_failed') setStatus('failed');
    };
    window.addEventListener('message', receive);
    return () => { window.clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [open, src]);
  function selectEpisode(n: number) { setEpisode(n); setInput(String(n)); setPage(Math.floor((n - 1) / 50)); }
  function go() { const n = Number(input); if (Number.isSafeInteger(n) && n > 0 && n <= 10000) selectEpisode(n); }
  return <div className="embed-source">
    <div className="embed-notice"><AlertCircle size={18}/><span>{tx('Сторонний источник: права на видео не проверены. Доступность и язык зависят от сервиса и региона; возможна реклама.', 'Third-party source: video rights have not been verified. Availability and audio depend on the service and region; ads may appear.')}</span></div>
    <div className="embed-toolbar"><div className="embed-audio" role="group" aria-label={tx('Аудио', 'Audio')}><span>{tx('Аудио', 'Audio')}</span><button className={audio === 'sub' ? 'active' : ''} aria-pressed={audio === 'sub'} onClick={() => setAudio('sub')}>{tx('Японский · субтитры', 'Japanese · subtitles')}</button><button className={audio === 'dub' ? 'active' : ''} aria-pressed={audio === 'dub'} onClick={() => setAudio('dub')}>{tx('Английский дубляж', 'English dub')}</button></div><button className="embed-open" onClick={() => setOpen(!open)}>{open ? tx('Закрыть плеер', 'Close player') : tx('Открыть плеер', 'Open player')}</button></div>
    {open && <><div className="embed-frame"><iframe ref={frame} key={src} src={src} title={`Cinextream · ${tx('Серия', 'Episode')} ${episode}`} sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      {status === 'loading' && <p className="embed-help" role="status">{tx('Загружаем сторонний плеер…', 'Loading third-party player…')}</p>}
      {status === 'failed' && <p className="sources-error" role="alert">{tx('Плеер не ответил или видео недоступно. Попробуйте другую серию, озвучку или источник.', 'The player did not respond or the video is unavailable. Try another episode, audio option or source.')}</p>}
    </>}
    <p className="embed-help">{tx('Номера серий взяты из каталога и не подтверждают наличие видео. Источник может не иметь дубляж для выбранной серии.', 'Episode numbers come from the catalog and do not confirm video availability. The source may not have a dub for this episode.')}</p>
    <div className="embed-select"><label>{tx('Номер серии', 'Episode number')}<input type="number" min="1" max="10000" step="1" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(); }}/></label><button onClick={go}>{tx('Выбрать', 'Select')}</button>{count > 50 && <label>{tx('Диапазон серий', 'Episode range')}<select aria-label={tx('Диапазон серий Cinextream', 'Cinextream episode range')} value={Math.min(page, Math.ceil(count / 50)-1)} onChange={e => setPage(Number(e.target.value))}>{Array.from({length: Math.ceil(count / 50)}, (_, i) => <option key={i} value={i}>{i*50+1}–{Math.min((i+1)*50,count)}</option>)}</select></label>}</div>
    {count > 0 && <div className="episode-grid">{Array.from({length: Math.min(50, count - Math.min(page, Math.ceil(count / 50)-1) * 50)}, (_, i) => Math.min(page, Math.ceil(count / 50)-1)*50+i+1).map(n => <button key={n} className={`episode-button ${n === episode ? 'selected' : ''}`} onClick={() => selectEpisode(n)}>{tx('Серия', 'Episode')} {n}</button>)}</div>}
    <p className="embed-help">Cinextream <ExternalLink size={12} aria-hidden="true"/> · {tx('плеер предоставлен сторонним сервисом', 'player provided by a third-party service')}</p>
  </div>;
}
