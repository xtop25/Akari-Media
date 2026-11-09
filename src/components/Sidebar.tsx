import { Home, Grid, Calendar, History, Bookmark, Settings, Sparkles } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { t, tx } from '@/hooks/useSettings';
const NAV_ITEMS = [
  { icon: Home, labelKey: 'nav.home', path: '/' }, { icon: Grid, labelKey: 'nav.catalog', path: '/catalog' },
  { icon: Calendar, labelKey: 'nav.calendar', path: '/calendar' }, { icon: History, labelKey: 'nav.history', path: '/history' },
  { icon: Bookmark, labelKey: 'nav.favorites', path: '/favorites' }, { icon: Settings, labelKey: 'nav.settings', path: '/settings' },
];
export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const location = useLocation();
  return <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
    <Link to="/" className="brand"><span className="brand-icon"><Sparkles size={20}/></span><span className="brand-text">AKARI <small>MEDIA</small></span></Link>
    <div className="sidebar-label">{tx('МЕНЮ','MENU')}</div>
    <nav className="sidebar-nav" aria-label={tx('Главное меню','Main menu')}>
      {NAV_ITEMS.map(({ icon: Icon, labelKey, path }) => <Link key={path} to={path} className={`nav-link ${location.pathname === path ? 'active' : ''}`}><Icon size={19} strokeWidth={1.8}/><span>{t(labelKey)}</span></Link>)}
    </nav>
    <div className="sidebar-footer"><div className="footer-dot" /> <span>{tx('Твой мир аниме', 'Your anime universe')}<small>AKARI MEDIA · 0.3</small></span></div>
  </aside>;
}
