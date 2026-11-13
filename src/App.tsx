import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { HomeView } from '@/views/HomeView';
import { CatalogView } from '@/views/CatalogView';
import { CalendarView } from '@/views/CalendarView';
import { HistoryView } from '@/views/HistoryView';
import { SettingsView } from '@/views/SettingsView';
import { AnimeDetailView } from '@/views/AnimeDetailView';
import { LibraryView } from '@/views/LibraryView';
import { useNavigate } from 'react-router-dom';
import { Anime } from '@/types';
import { AnimeCard } from '@/components/AnimeCard';
import { readFavorites } from '@/hooks/favorites';
import { t } from '@/hooks/useSettings';

function App() {
  const [isSidebarCollapsed] = useState(false);

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden bg-akari-dark text-white">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/catalog" element={<CatalogView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/favorites" element={<FavoritesView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/watch/:id" element={<AnimeDetailView />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

function FavoritesView() {
  const [items] = useState<Anime[]>(() => readFavorites());
  const navigate = useNavigate();
  return <div className="p-8"><h1 className="text-4xl font-bold mb-8">{t('favorites.title')}</h1>{items.length === 0 ? <p className="text-zinc-400">{t('favorites.empty_desc')}</p> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{items.map(anime => <AnimeCard key={anime.id} anime={anime} onClick={() => navigate(`/watch/${anime.id}`)} />)}</div>}</div>;
}

export default App;
