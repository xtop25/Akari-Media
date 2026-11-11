import { useEffect, useState } from 'react';
import { ExternalLink, Globe, AlertCircle } from 'lucide-react';
import { getStreamingCatalog, openStreamingUrl, StreamingCatalog } from '@/api/streaming';
import { tx } from '@/hooks/useSettings';

export function StreamingSources({ animeId }: { animeId: number }) {
  const [catalog, setCatalog] = useState<StreamingCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [openError, setOpenError] = useState(false);
  useEffect(() => { let active = true; setCatalog(null); setFailed(false); setOpenError(false);
    getStreamingCatalog(animeId).then(x => { if (active) setCatalog(x); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [animeId]);
  const open = (url: string) => { setOpenError(false); void openStreamingUrl(url).catch(() => setOpenError(true)); };
  return <section className="sources-panel" aria-labelledby="sources-heading">
    <div className="panel-header"><div><div className="section-kicker">{tx('ДРУГИЕ СПОСОБЫ СМОТРЕТЬ', 'MORE WAYS TO WATCH')}</div><h2 id="sources-heading">{tx('Смотреть на сервисах', 'Watch on streaming services')}</h2><p>{tx('Откроется сайт сервиса. Доступность, язык и подписка зависят от региона.', 'Opens the service website. Availability, language and subscription depend on your region.')}</p></div><Globe size={21} aria-hidden="true" /></div>
    {!catalog && !failed && <p className="sources-message">{tx('Ищем сервисы…', 'Finding services…')}</p>}
    {failed && <p className="sources-message"><AlertCircle size={16}/>{tx('Не удалось загрузить ссылки AniList. Проверьте интернет и откройте страницу заново.', 'Could not load AniList links. Check your connection and reopen the page.')}</p>}
    {catalog && !catalog.providers.length && <p className="sources-message">{tx('AniList не сообщает ссылки для этого тайтла.', 'AniList has no streaming links for this title.')}</p>}
    {catalog && catalog.providers.length > 0 && <div className="provider-list">{catalog.providers.map((p, i) => <button className="provider-button" key={`${p.url}-${i}`} onClick={() => open(p.url)}><span>{p.site}</span><ExternalLink size={15}/></button>)}</div>}
    {openError && <p role="alert" className="sources-error">{tx('Не удалось открыть сайт. Проверьте браузер по умолчанию.', 'Could not open the website. Check your default browser.')}</p>}
    <p className="source-credit">{tx('Ссылки: AniList. Доступность зависит от сервиса и региона.', 'Links: AniList. Availability depends on the service and region.')}</p>
  </section>;
}
