import { useState, useEffect } from 'react';
import { CalendarDays, Clock, Loader2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CachedImage } from '@/components/CachedImage';
import { Anime } from '@/types';
import { getCalendar, convertShikimoriToAnime } from '@/api/shikimori';
import { t, tx, getLanguage } from '@/hooks/useSettings';

interface CalendarEntry { anime: Anime; nextEpisode: number; nextEpisodeAt: string }
export function CalendarView() {
  const [days, setDays] = useState<CalendarEntry[][]>(Array.from({length:7}, () => []));
  const [loading, setLoading] = useState(true); const [offline, setOffline] = useState(false);
  const [selected, setSelected] = useState((new Date().getDay()+6)%7); const navigate = useNavigate();
  const weekdays = getLanguage() === 'ru' ? ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'] : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const short = getLanguage() === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  useEffect(() => { let active = true; getCalendar().then(items => { const grouped: CalendarEntry[][] = Array.from({length:7}, () => []); for (const item of items) { const date = new Date(item.next_episode_at); if (!item.next_episode_at || isNaN(date.getTime())) continue; grouped[(date.getDay()+6)%7].push({ anime: convertShikimoriToAnime(item.anime), nextEpisode: item.next_episode, nextEpisodeAt: item.next_episode_at }); } grouped.forEach(g => g.sort((a,b) => new Date(a.nextEpisodeAt).getTime()-new Date(b.nextEpisodeAt).getTime())); if(active)setDays(grouped); }).catch(() => {if(active)setOffline(true)}).finally(() => {if(active)setLoading(false)}); return () => {active=false}; }, []);
  const today = (new Date().getDay()+6)%7;
  return <div className="calendar-page page-enter"><header className="calendar-header"><div><div className="section-kicker">AKARI MEDIA / {tx('РАСПИСАНИЕ', 'SCHEDULE')}</div><h1>{t('calendar.title')}</h1><p>{tx('Новые серии по дням недели', 'New episodes by day of the week')}</p></div><div className="calendar-icon"><CalendarDays size={23}/></div></header>
    {loading ? <div className="calendar-loading"><Loader2 className="animate-spin" size={25}/> {tx('Загружаем расписание…', 'Loading schedule…')}</div> : <>
      {offline && <div className="calendar-notice"><AlertCircle size={18}/>{t('calendar.offline')}</div>}
      <div className="week-tabs" role="tablist" aria-label={tx('День недели', 'Day of week')}>{weekdays.map((day,i) => <button key={day} role="tab" aria-selected={selected===i} className={`week-tab ${selected===i?'active':''}`} onClick={() => setSelected(i)}><span className="week-full">{day}</span><span className="week-short">{short[i]}</span><small>{i===today ? tx('Сегодня', 'Today') : `${days[i].length} ${tx('тайтлов', 'titles')}`}</small></button>)}</div>
      <div className="calendar-section-heading"><div><h2>{weekdays[selected]}</h2><p>{days[selected].length} {tx('тайтлов в расписании', 'titles on the schedule')}</p></div><span>{tx('Время на вашем устройстве', 'Times shown in your local time')}</span></div>
      {!days[selected].length ? <div className="calendar-empty"><CalendarDays size={25}/><p>{t('calendar.no_episodes')}</p></div> : <div className="calendar-grid">{days[selected].map(({anime,nextEpisode,nextEpisodeAt}) => <button key={`${anime.id}-${nextEpisodeAt}`} className="calendar-card" onClick={() => navigate(`/watch/${anime.id}`)}><CachedImage src={anime.poster} animeId={anime.id} alt="" className="calendar-poster"/><span className="calendar-card-content"><span className="calendar-time"><Clock size={14}/>{new Date(nextEpisodeAt).toLocaleDateString(getLanguage()==='ru'?'ru-RU':'en-US',{day:'numeric',month:'short'})} · {new Date(nextEpisodeAt).toLocaleTimeString(getLanguage()==='ru'?'ru-RU':'en-US',{hour:'2-digit',minute:'2-digit'})} <span>·</span> {tx('Серия','Episode')} {nextEpisode}</span><strong>{getLanguage() === 'en' ? anime.titleEnglish || anime.title : anime.title}</strong><span className="calendar-card-meta">{anime.rating ? `★ ${anime.rating.toFixed(1)}  ·  ` : ''}{anime.year || ''}{anime.episodes ? `  ·  ${anime.episodes} ${tx('сер.','eps.')}` : ''}</span></span><ArrowUpRight className="calendar-arrow" size={17}/></button>)}</div>}
    </>}
  </div>;
}
