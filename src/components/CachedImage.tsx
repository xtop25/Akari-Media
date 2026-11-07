import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

const imageCache = new Map<string, string>();
const MAX_CACHE = 100;

export async function loadImage(url: string): Promise<string> {
  if (imageCache.has(url)) return imageCache.get(url)!;

  const base64 = await invoke('fetch_image', { url });
  const ext = (url.split('.').pop() || 'jpg').toLowerCase();
  const mime: Record<string, string> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png' };
  const dataUri = `data:image/${mime[ext] || 'jpeg'};base64,${base64}`;

  if (imageCache.size >= MAX_CACHE) {
    const first = imageCache.keys().next().value;
    if (first) imageCache.delete(first);
  }
  imageCache.set(url, dataUri);
  return dataUri;
}

interface CachedImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function CachedImage({ src, alt, className }: CachedImageProps) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!src || loaded.current) return;
    loaded.current = true;

    loadImage(src)
      .then(setDataUri)
      .catch(() => { setHasError(true); });
  }, [src]);

  if (dataUri) return <img src={dataUri} alt={alt || ''} className={className} />;
  if (hasError) return <div className={`${className || ''} flex items-center justify-center bg-zinc-800`} />;
  return <div className={`${className || ''} flex items-center justify-center bg-zinc-900`} />;
}