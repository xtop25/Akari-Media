import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { loadSettings, tx } from '@/hooks/useSettings';

interface Props { animeId: number; episode: number; videoUrl: string; source: string; onPrev?: () => void; onNext?: () => void }
export function Player({ animeId, episode, videoUrl, source, onPrev, onNext }: Props) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState('');
  const [pinned, setPinned] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  const { restoreProgress, saveProgress } = usePlayerProgress({ animeId, episode, translation: source, videoElement: video });
  const ref = useCallback((element: HTMLVideoElement | null) => setVideo(element), []);
  useEffect(() => {
    if (!video) return;
    setError(''); video.volume = Math.max(0, Math.min(1, loadSettings().volume));
    const onLoaded = () => restoreProgress();
    const onError = () => setError(tx('Не удалось воспроизвести видео. Проверьте ссылку, формат и доступность источника.', 'Unable to play this video. Check the URL, format and source availability.'));
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    if (/\.m3u8(?:$|[?#])/i.test(videoUrl) && Hls.isSupported()) {
      const hls = new Hls(); hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setError(tx('Не удалось загрузить HLS-поток. Проверьте доступность и CORS источника.', 'Unable to load the HLS stream. Check source availability and CORS.')); });
      hls.loadSource(videoUrl); hls.attachMedia(video);
    } else { video.src = videoUrl; video.load(); }
    return () => { saveProgress(); video.removeEventListener('loadedmetadata', onLoaded); video.removeEventListener('error', onError); hlsRef.current?.destroy(); hlsRef.current = null; video.removeAttribute('src'); video.load(); };
  }, [video, videoUrl, restoreProgress, saveProgress]);
  useEffect(() => {
    if (!video) return;
    const keys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName) || e.target.isContentEditable)) return;
      if (e.key === ' ') { e.preventDefault(); if (video.paused) void video.play().catch(() => {}); else video.pause(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); }
      else if (e.key.toLowerCase() === 'm') video.muted = !video.muted;
      else if (e.key.toLowerCase() === 'f') { if (document.fullscreenElement) void document.exitFullscreen(); else void video.requestFullscreen(); }
    };
    window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys);
  }, [video]);
  const togglePin = async () => { try { await getCurrentWindow().setAlwaysOnTop(!pinned); setPinned(!pinned); } catch { setError(tx('Не удалось изменить закрепление окна.', 'Could not change the always-on-top setting.')); } };
  return <div><div className="relative bg-black aspect-video player-screen"><video ref={ref} controls playsInline className="w-full h-full" />{error && <p role="alert" className="absolute top-3 left-3 right-3 p-3 bg-red-950 text-red-100 rounded">{error}</p>}</div>
    <div className="flex flex-wrap gap-2 mt-3"><button onClick={onPrev} disabled={!onPrev} className="px-3 py-2 bg-zinc-800 rounded disabled:opacity-40">{tx('← Предыдущая серия', '← Previous episode')}</button><button onClick={onNext} disabled={!onNext} className="px-3 py-2 bg-zinc-800 rounded disabled:opacity-40">{tx('Следующая серия →', 'Next episode →')}</button>{isTauri() && <button onClick={togglePin} className="px-3 py-2 bg-zinc-800 rounded">{pinned ? tx('Открепить окно', 'Unpin window') : tx('Поверх окон', 'Always on top')}</button>}{video && document.pictureInPictureEnabled && <button className="px-3 py-2 bg-zinc-800 rounded" onClick={() => { if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {}); else void video.requestPictureInPicture().catch(() => setError(tx('Режим «картинка в картинке» недоступен.', 'Picture-in-picture is unavailable.'))); }}>{tx('Картинка в картинке', 'Picture in picture')}</button>}</div>
  </div>;
}
