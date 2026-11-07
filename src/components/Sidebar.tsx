import React from 'react';
import { Home, Grid, Calendar, History, Bookmark, Settings, Search } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { t, loadSettings } from '@/hooks/useSettings';

const NAV_ITEMS = [
  { icon: Home, labelKey: 'nav.home', path: '/' },
  { icon: Grid, labelKey: 'nav.catalog', path: '/catalog' },
  { icon: Calendar, labelKey: 'nav.calendar', path: '/calendar' },
  { icon: History, labelKey: 'nav.history', path: '/history' },
  { icon: Bookmark, labelKey: 'nav.favorites', path: '/favorites' },
  { icon: Settings, labelKey: 'nav.settings', path: '/settings', divider: true },
];

const settings = loadSettings();

interface SidebarProps {
  isCollapsed: boolean;
  onSearch?: (query: string) => void;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`h-full bg-zinc-950 border-r border-zinc-800 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* LOGO */}
      <div className="h-16 flex items-center justify-center border-b border-zinc-800 shrink-0">
        {!isCollapsed ? (
          <h1 className="text-xl font-bold bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
            {t('app.name')}
          </h1>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-akari-purple to-akari-blue rounded-lg" />
        )}
      </div>

      {/* SEARCH */}
      {!isCollapsed && (
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-akari-purple transition-colors"
            />
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="p-4 space-y-1 mt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-akari-purple/20 text-akari-purple border-l-2 border-akari-purple'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon size={18} />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM VERSION */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-center text-zinc-600 border-t border-zinc-800">
          {t('app.name')} v0.1.0
        </div>
      )}
    </aside>
  );
}