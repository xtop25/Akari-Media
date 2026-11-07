import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Sidebar } from '@/components/Sidebar';
import { HomeView } from '@/views/HomeView';
import { CatalogView } from '@/views/CatalogView';
import { CalendarView } from '@/views/CalendarView';
import { HistoryView } from '@/views/HistoryView';
import { SettingsView } from '@/views/SettingsView';
import { AnimeDetailView } from '@/views/AnimeDetailView';
import { t } from '@/hooks/useSettings';

function App() {
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleMiniPlayer = async () => {
    const appWindow = getCurrentWindow();
    const newMiniState = !isMiniPlayer;

    try {
      if (newMiniState) {
        await appWindow.setSize({ width: 480, height: 270 });
        await appWindow.setAlwaysOnTop(true);
        setIsSidebarCollapsed(true);
        console.log('[App] Mini player activated');
      } else {
        await appWindow.setSize({ width: 1280, height: 720 });
        await appWindow.setAlwaysOnTop(false);
        setIsSidebarCollapsed(false);
        console.log('[App] Mini player deactivated');
      }

      setIsMiniPlayer(newMiniState);
    } catch (error) {
      console.error('[App] Error toggling mini player:', error);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-akari-dark text-white">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/catalog" element={<CatalogView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/favorites" element={<FavoritesView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/watch/:id" element={<AnimeDetailView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function FavoritesView() {
  return (
    <div className="min-h-screen bg-akari-dark text-white p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
          {t('favorites.title')}
        </h1>
        <p className="text-zinc-400 mt-2">{t('favorites.tagline')}</p>
        <div className="mt-8 p-8 bg-zinc-900 rounded-lg">
          <p className="text-zinc-500 text-lg">{t('favorites.empty')}</p>
          <p className="text-zinc-600 text-sm mt-2">{t('favorites.empty_desc')}</p>
          <p className="text-xs text-zinc-700 mt-4">{t('favorites.coming_soon')}</p>
        </div>
      </div>
    </div>
  );
}

export default App;