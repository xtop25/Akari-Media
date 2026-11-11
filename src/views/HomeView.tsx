import { useState, useEffect, ReactNode } from 'react';
import { TrendingUp, Tv, AlertCircle, Play, ArrowRight, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimeCard } from '@/components/AnimeCard';
import { CachedImage } from '@/components/CachedImage';
import { Anime } from '@/types';
import { getTrendingAnime, getOngoingAnime, convertShikimoriToAnime } from '@/api/shikimori';
import { t, tx, getLanguage } from '@/hooks/useSettings';

export function HomeView() {
  const [trending, setTrending] = useState<Anime[]>([]); const [ongoing, setOngoing] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const navigate = useNavigate();
  useEffect(() => { let active = true; Promise.all([getTrendingAnime(24), getOngoingAnime(24)]).then(([a,b]) => {if(active) {setTrending(a.map(convertShikimoriToAnime));setOngoing(b.map(convertShikimoriToAnime));}}).catch(() => {if(active)setError(true)}).finally(() => {if(active)setLoading(false)}); return () => {active=false}; }, []);
  if (loading) return <div className="screen-loading"><div className="loading-orbit"/><span>{t('common.loading')}</span></div>;
  if (error || (!trending.length && !ongoing.length)) return <div className="screen-loading"><AlertCircle size={36}/><p>{t('error.network')}</p><button className="primary-button" onClick={() => location.reload()}>{t('common.reload')}</button></div>;
  const featured = trending[0] || ongoing[0];
  const title = getLanguage() === 'en' ? featured.titleEnglish || featured.title : featured.title;
  const open = (a: Anime) => navigate(`/watch/${a.id}`);
  return <div className="home-page page-enter">
    <header className="home-header"><div><div className="eyebrow">{tx('Обзор', 'Discover')}</div><h1>{tx('Открой что-то новое', 'Discover something new')}</h1><p>{tx('Аниме, которое стоит посмотреть', 'Find something worth watching')}</p></div><button className="text-link" onClick={() => navigate('/catalog')}>{tx('Весь каталог','Explore catalog')} <ArrowRight size={17}/></button></header>
    <div className="hero"><div className="hero-content"><div className="hero-kicker">{t('home.most_popular')}</div><h2>{title}</h2><div className="hero-meta">{featured.rating && <span>★ {featured.rating.toFixed(1)}</span>}{featured.year && <span>{featured.year}</span>}{featured.episodes && <span>{featured.episodes} {tx('сер.', 'eps.')}</span>}</div><div className="hero-actions"><button className="primary-button" onClick={() => open(featured)}><Play size={17} fill="currentColor" /> {t('home.watch')}</button><button className="surprise-button" onClick={() => { const pool = trending.length ? trending : ongoing; open(pool[Math.floor(Math.random() * pool.length)]); }}><Shuffle size={16}/>{tx('Случайное аниме','Surprise me')}</button></div></div><div className="hero-art"><CachedImage src={featured.poster} animeId={featured.id} alt="" className="hero-image" /></div></div>
    <Section title={t('home.ongoing')} subtitle={tx('Новые серии','New episodes')} icon={<Tv size={19}/>}><AnimeGrid animes={ongoing} onAnimeClick={open}/></Section>
    <Section title={t('home.trending')} subtitle={tx('Популярное у зрителей','Popular with viewers')} icon={<TrendingUp size={19}/>}><AnimeGrid animes={trending} onAnimeClick={open}/></Section>
  </div>;
}
function Section({title,subtitle,icon,children}:{title:string;subtitle:string;icon:ReactNode;children:ReactNode}) {return <section className="home-section"><div className="section-heading"><div className="section-icon">{icon}</div><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section>}
function AnimeGrid({animes,onAnimeClick}:{animes:Anime[];onAnimeClick:(a:Anime)=>void}) {return <div className="anime-grid">{animes.map(a => <AnimeCard key={a.id} anime={a} onClick={() => onAnimeClick(a)} />)}</div>}
