import { Anime } from '@/types';
const KEY='akari_recent_selections';
export interface RecentSelection { anime:Anime; episode:number; group:string; updatedAt:number }
export function readRecentSelections():RecentSelection[]{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(x))return [];return x.filter(v=>v&&v.anime&&Number.isSafeInteger(v.anime.id)&&v.anime.id>0&&typeof v.anime.title==='string'&&typeof v.anime.poster==='string'&&typeof v.group==='string'&&Number.isFinite(v.episode)&&v.episode>0&&Number.isFinite(v.updatedAt)).slice(0,20)}catch{return []}}
export function recordRecentSelection(anime:Anime,episode:number,group:string){try{const small:Anime={id:anime.id,title:anime.title,titleEnglish:anime.titleEnglish,poster:anime.poster,year:anime.year,episodes:anime.episodes};const entries=readRecentSelections().filter(x=>x.anime.id!==anime.id);localStorage.setItem(KEY,JSON.stringify([{anime:small,episode,group,updatedAt:Date.now()},...entries].slice(0,20)))}catch{/* Selection still works without local storage. */}}
export function clearRecentSelections(){localStorage.removeItem(KEY)}
