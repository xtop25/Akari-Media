import { useState } from 'react';
import { Languages, MonitorPlay, Save } from 'lucide-react';
import { AppSettings, loadSettings, saveSettings, setLanguage, t, tx } from '@/hooks/useSettings';

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setSettings(s => ({ ...s, [key]: value }));
  const save = () => { saveSettings(settings); setLanguage(settings.language); window.location.reload(); };
  return <div className="settings-page page-enter">
    <header className="settings-heading"><div className="eyebrow">AKARI MEDIA / {tx('НАСТРОЙКИ','PREFERENCES')}</div><h1>{t('settings.title')}</h1><p>{tx('Настройте приложение под себя.', 'Make your experience feel like yours.')}</p></header>
    <section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><Languages size={20}/></span><div><h2>{tx('Язык интерфейса','Interface language')}</h2><p>{tx('Выберите язык приложения.', 'Choose the language used across the app.')}</p></div></div>
      <label className="settings-field">{t('settings.language')}<select value={settings.language} onChange={e => update('language', e.target.value as 'ru'|'en')}><option value="en">English</option><option value="ru">Русский</option></select></label>
    </section>
    <section className="settings-card"><div className="settings-card-heading"><span className="settings-icon"><MonitorPlay size={20}/></span><div><h2>{tx('Просмотр','Playback')}</h2><p>{tx('Настройки собственного плеера и выбор серии.', 'Controls for your own video player and episode selection.')}</p></div></div>
      <label className="settings-field settings-volume"><span>{t('settings.volume')} <strong>{Math.round(settings.volume * 100)}%</strong></span><input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e => update('volume', Number(e.target.value))} /></label>
      <p className="settings-note">{tx('Громкость сторонних плееров настраивается в самих плеерах.', 'Third-party players control their own volume.')}</p>
      <label className="settings-check"><input type="checkbox" checked={settings.rememberLastEpisode} onChange={e => update('rememberLastEpisode', e.target.checked)} /><span><strong>{t('settings.remember_episode')}</strong><small>{t('settings.remember_episode_desc')}</small></span></label>
    </section>
    <div className="settings-actions"><button className="settings-save" onClick={save}><Save size={17}/>{tx('Сохранить', 'Save')}</button><p>{tx('Изменения применяются после сохранения.', 'Changes take effect after saving.')}</p></div>
  </div>;
}
