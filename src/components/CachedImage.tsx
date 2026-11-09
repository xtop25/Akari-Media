import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getAlternativePoster } from '@/api/posters';
import { t } from '@/hooks/useSettings';

interface CachedImageProps { src: string; animeId?: number; alt?: string; className?: string }
export function CachedImage({ src, animeId, alt = '', className = '' }: CachedImageProps) {
  const validSrc = src && !/\/assets\/globals\/missing_|\/missing\.jpg/i.test(src) ? src : '';
  const [current, setCurrent] = useState(validSrc);
  const [fallback, setFallback] = useState(!validSrc);
  useEffect(() => { setCurrent(validSrc); setFallback(!validSrc); }, [validSrc, animeId]);
  useEffect(() => {
    if (!fallback || !animeId) return;
    let active = true;
    getAlternativePoster(animeId).then(url => { if (active && url) setCurrent(url); });
    return () => { active = false; };
  }, [fallback, animeId]);
  if (!current) return <div className={`${className} poster-placeholder`} role="img" aria-label={`${alt}: ${t('poster.unavailable')}`}><ImageOff size={26} aria-hidden="true" /><span>{t('poster.unavailable')}</span></div>;
  return <img src={current} alt={alt} className={className} loading="lazy" onError={() => { setCurrent(''); if (!fallback) setFallback(true); }} />;
}
