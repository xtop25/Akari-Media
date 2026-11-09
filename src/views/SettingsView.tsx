import { useState } from 'react';
import { AppSettings, loadSettings, saveSettings, setLanguage, t, tx } from '@/hooks/useSettings';

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setSettings(s => ({ ...s, [key]: value }));
  const save = () => { saveSettings(settings); setLanguage(settings.language); window.location.reload(); };
  return <div className="p-8 max-w-2xl"><h1 className="text-4xl font-bold mb-8">{t('settings.title')}</h1><div className="space-y-6">
    <label className="block">{t('settings.language')}<select value={settings.language} onChange={e => update('language', e.target.value as 'ru'|'en')} className="block w-full p-2 mt-2 bg-zinc-900 rounded"><option value="ru">Русский</option><option value="en">English</option></select></label>
    <label className="block">{t('settings.default_quality')}<select value={settings.defaultQuality} onChange={e => update('defaultQuality', e.target.value as 'sd'|'hd'|'fhd')} className="block w-full p-2 mt-2 bg-zinc-900 rounded"><option value="sd">480p</option><option value="hd">720p</option><option value="fhd">1080p</option></select></label>
    <label className="block">{t('settings.volume')}: {Math.round(settings.volume * 100)}%<input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e => update('volume', Number(e.target.value))} className="block w-full mt-2" /></label>
    <label className="flex gap-3"><input type="checkbox" checked={settings.rememberLastEpisode} onChange={e => update('rememberLastEpisode', e.target.checked)} /> {t('settings.remember_episode')}</label>
    <button className="px-6 py-3 bg-akari-purple rounded" onClick={save}>{tx('Сохранить', 'Save')}</button>
    <p className="text-zinc-400 text-sm">{tx('Изменения применяются после сохранения.', 'Changes take effect after saving.')}</p>
  </div></div>;
}
