import { useEffect, useState } from 'react';
import { ExternalLink, PlayCircle, Globe, AlertCircle } from 'lucide-react';
import { getStreamingCatalog, openStreamingUrl, StreamingCatalog } from '@/api/streaming';
import { tx } from '@/hooks/useSettings';

export function StreamingSources({ animeId }: { animeId: number }) {
  const [catalog, setCatalog] = useState<StreamingCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [page, setPage] = useState(0);
  const [site, setSite] = useState('');
  useEffect(() => { let active = true; setCatalog(null); setFailed(false); setOpenError(false); setPage(0); setSite('');
    getStreamingCatalog(animeId).then(x => { if (active) setCatalog(x); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [animeId]);
  const episodes = (catalog?.episodes || []).filter(e => !site || e.site === site);
  const sites = [...new Set((catalog?.episodes || []).map(e => e.site))];
  const open = (url: string) => { setOpenError(false); void openStreamingUrl(url).catch(() => setOpenError(true)); };
  return <section className="sources-panel" aria-labelledby="sources-heading">
    <div className="panel-header"><div><div className="section-kicker">{tx('ДРУГИЕ СПОСОБЫ СМОТРЕТЬ', 'MORE WAYS TO WATCH')}</div><h2 id="sources-heading">{tx('Смотреть на сервисах', 'Watch on streaming services')}</h2><p>{tx('Откроется сайт сервиса. Доступность, язык и подписка зависят от региона.', 'Opens the service website. Availability, language and subscription depend on your region.')}</p></div><Globe size={21} aria-hidden="true" /></div>
    {!catalog && !failed && <p className="sources-message">{tx('Ищем сервисы и серии…', 'Finding services and episodes…')}</p>}
    {failed && <p className="sources-message"><AlertCircle size={16}/>{tx('Не удалось загрузить ссылки AniList. Проверьте интернет и откройте страницу заново.', 'Could not load AniList links. Check your connection and reopen the page.')}</p>}
    {catalog && !catalog.providers.length && !catalog.episodes.length && <p className="sources-message">{tx('AniList не сообщает ссылки для этого тайтла.', 'AniList has no streaming links for this title.')}</p>}
    {catalog && catalog.providers.length > 0 && <div className="provider-list">{catalog.providers.map((p, i) => <button className="provider-button" key={`${p.url}-${i}`} onClick={() => open(p.url)}><span>{p.site}</span><ExternalLink size={15}/></button>)}</div>}
    {openError && <p role="alert" className="sources-error">{tx('Не удалось открыть сайт. Проверьте браузер по умолчанию.', 'Could not open the website. Check your default browser.')}</p>}
    {episodes.length > 0 && <div className="external-episodes"><div className="external-header"><div><h3>{tx('Серии на сервисах', 'Episodes on services')}</h3><span>{episodes.length} {tx('ссылок из AniList', 'links from AniList')}</span></div>{sites.length > 1 && <label>{tx('Сервис', 'Service')} <select value={site} onChange={e => {setSite(e.target.value); setPage(0)}}><option value="">{tx('Все', 'All')}</option>{sites.map(s => <option key={s}>{s}</option>)}</select></label>}</div>
      {episodes.length > 50 && <label className="range-label">{tx('Диапазон ссылок', 'Link range')} <select value={page} onChange={e => setPage(Number(e.target.value))}>{Array.from({ length: Math.ceil(episodes.length / 50) }, (_, i) => <option key={i} value={i}>{i * 50 + 1}–{Math.min((i + 1) * 50, episodes.length)}</option>)}</select></label>}
      <div className="external-grid">{episodes.slice(page*50,(page+1)*50).map((ep,i) => <button className="external-episode" onClick={() => open(ep.url)} key={`${ep.url}-${i}`} title={ep.title} aria-label={`${ep.title} · ${ep.site} (${tx('открыть на сайте', 'open on website')})`}><PlayCircle size={17}/><span>{ep.number ? `${tx('Серия', 'Episode')} ${ep.number}` : ep.title}<small>{ep.site}</small></span><ExternalLink size={14}/></button>)}</div>
    </div>}
    <p className="source-credit">{tx('Ссылки: AniList. Сервис может не предоставлять конкретную серию в вашем регионе.', 'Links: AniList. The service may not offer a particular episode in your region.')}</p>
  </section>;
}
