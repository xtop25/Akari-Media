import React, { useState, useEffect } from 'react';
import { Settings, Check, X, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { loadSettings, saveSettings, AppSettings, AppLanguage, t, setLanguage } from '@/hooks/useSettings';

const QUALITY_OPTIONS = [
  { value: 'sd', label: 'SD (480p)' },
  { value: 'hd', label: 'HD (720p)' },
  { value: 'fhd', label: 'Full HD (1080p)' },
];

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setLanguage(settings.language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-akari-dark text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-akari-purple" size={32} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-akari-purple to-akari-blue bg-clip-text text-transparent">
              {t('settings.title')}
            </h1>
          </div>
          <p className="text-zinc-400">{t('settings.tagline')}</p>
        </div>

        {/* PLAYBACK SECTION */}
        <Section title={t('settings.playback')}>
          {/* Auto-skip Opening */}
          <ToggleRow
            label={t('settings.auto_skip_opening')}
            desc={t('settings.auto_skip_opening_desc')}
            value={settings.autoSkipOpening}
            onChange={(v) => update('autoSkipOpening', v)}
          />

          {/* Auto-skip Ending */}
          <ToggleRow
            label={t('settings.auto_skip_ending')}
            desc={t('settings.auto_skip_ending_desc')}
            value={settings.autoSkipEnding}
            onChange={(v) => update('autoSkipEnding', v)}
          />

          {/* Default Quality */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-zinc-300">
              {t('settings.default_quality')}
            </label>
            <select
              value={settings.defaultQuality}
              onChange={(e) => update('defaultQuality', e.target.value as 'sd' | 'hd' | 'fhd')}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-akari-purple"
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Remember Last Episode */}
          <ToggleRow
            label={t('settings.remember_episode')}
            desc={t('settings.remember_episode_desc')}
            value={settings.rememberLastEpisode}
            onChange={(v) => update('rememberLastEpisode', v)}
          />

          {/* Show Episode Descriptions */}
          <ToggleRow
            label={t('settings.show_descriptions')}
            value={settings.showEpisodeDescriptions}
            onChange={(v) => update('showEpisodeDescriptions', v)}
          />
        </Section>

        {/* INTERFACE SECTION */}
        <Section title={t('settings.interface')}>
          {/* Language */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-zinc-300">
              {t('settings.language')}
            </label>
            <select
              value={settings.language}
              onChange={(e) => update('language', e.target.value as AppLanguage)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-akari-purple"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          {/* Volume */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-zinc-300">
              {t('settings.volume')}: {Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => update('volume', Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        </Section>

        {/* WINDOW SECTION */}
        <Section title={t('settings.window')}>
          <ToggleRow
            label={t('settings.always_on_top')}
            desc={t('settings.always_on_top_desc')}
            value={settings.alwaysOnTop}
            onChange={(v) => update('alwaysOnTop', v)}
          />

          <ToggleRow
            label={t('settings.minimize_tray')}
            desc={t('settings.minimize_tray_desc')}
            value={settings.minimizeToTray}
            onChange={(v) => update('minimizeToTray', v)}
          />
        </Section>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          className="w-full mt-8 px-6 py-4 bg-akari-purple hover:bg-akari-purple/80 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-lg hover:scale-[1.02]"
        >
          {saved ? (
            <><Check size={20} className="text-green-400" /> {t('settings.saved')}</>
          ) : (
            <><Save size={20} /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// UI HELPERS
// ============================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
      <h2 className="font-semibold text-lg mb-4 text-zinc-300">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {desc && <div className="text-xs text-zinc-500 mt-1">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-all duration-300 ${
          value ? 'bg-akari-purple' : 'bg-zinc-700'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}