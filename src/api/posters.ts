// Shikimori может отдавать собственную картинку «missing». AniList принимает MAL ID,
// совпадающий с ID аниме Shikimori. Объединяем запросы, чтобы не превысить лимиты API.
const cache = new Map<number, string | null>();
const pending = new Map<number, Array<(value: string | null) => void>>();
let timer: ReturnType<typeof setTimeout> | undefined;

async function flush() {
  timer = undefined;
  const ids = [...pending.keys()].slice(0, 50);
  const callbacks = new Map(ids.map(id => [id, pending.get(id)!]));
  ids.forEach(id => pending.delete(id));
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({query: 'query($ids:[Int]){Page(perPage:50){media(idMal_in:$ids,type:ANIME){idMal coverImage{extraLarge large}}}}', variables: {ids}}),
    });
    if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
    const json = await response.json();
    if (!Array.isArray(json?.data?.Page?.media)) throw new Error('Invalid AniList response');
    const images = new Map<number, string>(json.data.Page.media.map((m: {idMal: number; coverImage: {extraLarge?: string; large?: string}}) => [m.idMal, m.coverImage?.extraLarge || m.coverImage?.large || '']));
    ids.forEach(id => { const value = images.get(id) || null; cache.set(id, value); callbacks.get(id)?.forEach(fn => fn(value)); });
  } catch {
    // Не запоминаем сетевые ошибки: следующая навигация позволит попробовать снова.
    ids.forEach(id => callbacks.get(id)?.forEach(fn => fn(null)));
  }
  if (pending.size && !timer) timer = setTimeout(flush, 200);
}
export function getAlternativePoster(id: number): Promise<string | null> {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  return new Promise(resolve => {
    const list = pending.get(id) || []; list.push(resolve); pending.set(id, list);
    if (!timer) timer = setTimeout(flush, 100);
  });
}
