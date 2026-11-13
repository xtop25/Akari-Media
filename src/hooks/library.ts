import { Anime } from '@/types';
export type LibraryStatus = 'planned' | 'watching' | 'completed' | 'paused' | 'dropped';
export interface LibraryEntry { anime: Anime; status: LibraryStatus; rating: number | null; note: string; updatedAt: number }
export const LIBRARY_KEY = 'akari_library_v1';
const statuses: LibraryStatus[] = ['planned','watching','completed','paused','dropped'];
function validAnime(x: any): x is Anime {
  return !!x && typeof x === 'object' && Number.isSafeInteger(x.id) && x.id > 0 && typeof x.title === 'string' && x.title.length > 0 && x.title.length <= 500 && typeof x.poster === 'string' && x.poster.length <= 2000 && (x.titleEnglish === undefined || typeof x.titleEnglish === 'string' && x.titleEnglish.length <= 500);
}
function validate(value: unknown): LibraryEntry[] {
  if (!Array.isArray(value) || value.length > 5000) throw new Error('Invalid library');
  const ids = new Set<number>();
  return value.map((x: any) => {
    if (!x || !validAnime(x.anime) || !statuses.includes(x.status) || !(x.rating === null || Number.isInteger(x.rating) && x.rating >= 1 && x.rating <= 10) || typeof x.note !== 'string' || x.note.length > 2000 || !Number.isFinite(x.updatedAt) || x.updatedAt < 0 || ids.has(x.anime.id)) throw new Error('Invalid library entry');
    ids.add(x.anime.id);
    const anime: Anime = {id:x.anime.id,title:x.anime.title,poster:x.anime.poster};
    if (typeof x.anime.titleEnglish === 'string') anime.titleEnglish = x.anime.titleEnglish;
    if (typeof x.anime.year === 'number' && Number.isFinite(x.anime.year)) anime.year = x.anime.year;
    if (typeof x.anime.episodes === 'number' && Number.isFinite(x.anime.episodes) && x.anime.episodes >= 0) anime.episodes = x.anime.episodes;
    if (typeof x.anime.rating === 'number' && Number.isFinite(x.anime.rating)) anime.rating = x.anime.rating;
    if (['ongoing','released','anons'].includes(x.anime.status)) anime.status = x.anime.status;
    return {anime,status:x.status,rating:x.rating,note:x.note,updatedAt:x.updatedAt};
  });
}
function readLibraryStrict(): LibraryEntry[] { return validate(JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]')); }
export function readLibrary(): LibraryEntry[] { try {return readLibraryStrict();} catch {return [];} }
export function saveLibraryEntry(entry: LibraryEntry): void { const current=readLibraryStrict().filter(x=>x.anime.id!==entry.anime.id); localStorage.setItem(LIBRARY_KEY,JSON.stringify(validate([entry,...current]))); }
export function removeLibraryEntry(id:number): void { localStorage.setItem(LIBRARY_KEY,JSON.stringify(readLibraryStrict().filter(x=>x.anime.id!==id))); }
export function exportLibrary(): string { return JSON.stringify({format:'akari-library',version:1,entries:readLibraryStrict()},null,2); }
export function importLibrary(text:string): number { if(text.length>2_000_000) throw new Error('File too large');const obj=JSON.parse(text); if(!obj || obj.format!=='akari-library' || obj.version!==1) throw new Error('Invalid backup'); const entries=validate(obj.entries); localStorage.setItem(LIBRARY_KEY,JSON.stringify(entries)); return entries.length; }
export function statusLabel(s:LibraryStatus, ru:boolean): string { return ({planned:ru?'В планах':'Plan to watch',watching:ru?'Смотрю':'Watching',completed:ru?'Посмотрел':'Completed',paused:ru?'На паузе':'On hold',dropped:ru?'Брошено':'Dropped'})[s]; }
export const libraryStatuses = statuses;
