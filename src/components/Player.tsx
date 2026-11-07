// ============================================
// ВИДЕОПЛЕЕР С HLS.JS И КАСТОМНЫМ UI
// ============================================
// Поддержка HLS потоков, переключение озвучек, качества
// Кнопка Mini-Player с закреплением поверх всех окон

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, Pin, PinOff, SkipBack, SkipForward 
} from 'lucide-react';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { Translation } from '@/types';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface PlayerProps {
  animeId: number;
  episode: number;
  videoUrl: string; // HLS .m3u8 ссылка
  translations: Translation[];
  currentTranslation: Translation;
  onTranslationChange: (translation: Translation) => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  isMiniPlayer: boolean;
  onToggleMiniPlayer: () => void;
}

export function Player({
  animeId,
  episode,
  videoUrl,
  translations,
  currentTranslation,
  onTranslationChange,
  onNextEpisode,
  onPrevEpisode,
  isMiniPlayer,
  onToggleMiniPlayer,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // ХУК АВТОСОХРАНЕНИЯ ПРОГРЕССА
  // ============================================
  const { restoreProgress } = usePlayerProgress({
    animeId,
    episode,
    translation: currentTranslation.id,
    videoElement: videoRef.current,
  });

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ HLS.JS
  // ============================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[Player] HLS манифест загружен');
        
        // Восстанавливаем прогресс после загрузки
        setTimeout(() => {
          const restored = restoreProgress();
          if (restored) {
            // Показываем уведомление о восстановлении
            console.log('[Player] Прогресс восстановлен');
          }
        }, 500);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[Player] Сетевая ошибка, попытка восстановления...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[Player] Медиа ошибка, попытка восстановления...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[Player] Критическая ошибка HLS:', data);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Нативная поддержка HLS (Safari)
      video.src = videoUrl;
    }
  }, [videoUrl, restoreProgress]);

  // ============================================
  // ОБРАБОТЧИКИ СОБЫТИЙ ВИДЕО
  // ============================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // ============================================
  // СКРЫТИЕ КОНТРОЛОВ ПРИ БЕЗДЕЙСТВИИ
  // ============================================
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying && !isMiniPlayer) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isMiniPlayer]);

  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  // ============================================
  // УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ
  // ============================================
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // ============================================
  // FULLSCREEN
  // ============================================
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // ============================================
  // ALWAYS ON TOP (TAURI API)
  // ============================================
  const toggleAlwaysOnTop = async () => {
    try {
      const appWindow = getCurrentWindow();
      const newState = !isAlwaysOnTop;
      await appWindow.setAlwaysOnTop(newState);
      setIsAlwaysOnTop(newState);
      console.log(`[Player] Always on top: ${newState}`);
    } catch (error) {
      console.error('[Player] Ошибка setAlwaysOnTop:', error);
    }
  };

  // ============================================
  // ГОРЯЧИЕ КЛАВИШИ
  // ============================================
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'p':
        case 'P':
          if (e.ctrlKey) {
            e.preventDefault();
            onToggleMiniPlayer();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume, isPlaying]);

  // ============================================
  // УТИЛИТЫ ФОРМАТИРОВАНИЯ
  // ============================================
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${isMiniPlayer ? 'h-full' : 'aspect-video'}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* ВИДЕО */}
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
      />

      {/* ИНДИКАТОР БУФЕРИЗАЦИИ */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-akari-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* КОНТРОЛЫ */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ПРОГРЕСС БАР */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                     [&::-webkit-slider-thumb]:bg-akari-purple [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 
                     transition-all"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* КНОПКИ УПРАВЛЕНИЯ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* PLAY/PAUSE */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* SKIP */}
            {!isMiniPlayer && (
              <>
                <button
                  onClick={onPrevEpisode}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  disabled={!onPrevEpisode}
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={onNextEpisode}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  disabled={!onNextEpisode}
                >
                  <SkipForward size={20} />
                </button>
              </>
            )}

            {/* VOLUME */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {!isMiniPlayer && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 h-1 bg-zinc-700 rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ОЗВУЧКА */}
            {!isMiniPlayer && translations.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {currentTranslation.title}
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 rounded-lg overflow-hidden shadow-xl">
                    {translations.map((trans) => (
                      <button
                        key={trans.id}
                        onClick={() => {
                          onTranslationChange(trans);
                          setShowSettings(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                          trans.id === currentTranslation.id ? 'bg-akari-purple/20' : ''
                        }`}
                      >
                        {trans.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALWAYS ON TOP */}
            <button
              onClick={toggleAlwaysOnTop}
              className={`p-2 rounded-lg transition-colors ${
                isAlwaysOnTop ? 'bg-akari-purple/20 text-akari-purple' : 'hover:bg-white/10'
              }`}
              title="Закрепить поверх всех окон"
            >
              {isAlwaysOnTop ? <Pin size={20} /> : <PinOff size={20} />}
            </button>

            {/* MINI PLAYER */}
            <button
              onClick={onToggleMiniPlayer}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Мини-плеер (Ctrl+P)"
            >
              <Minimize size={20} />
            </button>

            {/* FULLSCREEN */}
            {!isMiniPlayer && (
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
