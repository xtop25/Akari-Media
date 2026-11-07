// ============================================
// APP SETTINGS & LOCALIZATION
// ============================================

export type AppLanguage = 'en' | 'ru';

export interface AppSettings {
  language: AppLanguage;
  autoSkipOpening: boolean;
  autoSkipEnding: boolean;
  defaultQuality: 'sd' | 'hd' | 'fhd';
  volume: number;
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  rememberLastEpisode: boolean;
  showEpisodeDescriptions: boolean;
}

const STORAGE_KEY = 'akari_settings';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  autoSkipOpening: true,
  autoSkipEnding: false,
  defaultQuality: 'hd',
  volume: 0.8,
  alwaysOnTop: false,
  minimizeToTray: true,
  rememberLastEpisode: true,
  showEpisodeDescriptions: false,
};

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {} // eslint-disable-line no-empty
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getSettings(): AppSettings {
  return loadSettings();
}

// ============================================
// LOCALIZATION STRINGS
// ============================================

type Strings = Record<string, Record<string, string>>;

const STRINGS: Strings = {
  en: {
    'app.name': 'Akari Media',
    'app.tagline': 'Ultra-light media player for ad-free anime, movies & series',
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.calendar': 'Schedule',
    'nav.history': 'History',
    'nav.favorites': 'Favorites',
    'nav.settings': 'Settings',
    'home.trending': 'Trending Now',
    'home.ongoing': 'Currently Airing',
    'home.watch': 'Watch',
    'home.most_popular': 'Most Popular',
    'home.continue': 'Continue',
    'home.episode': 'Ep.',
    'catalog.title': 'Anime Catalog',
    'catalog.search': 'Search by name...',
    'catalog.filters': 'Filters',
    'catalog.sort': 'Sort by',
    'catalog.sort_popularity': 'Popularity',
    'catalog.sort_rating': 'Rating',
    'catalog.sort_name': 'Name',
    'catalog.sort_date': 'Release Date',
    'catalog.type': 'Type',
    'catalog.status': 'Status',
    'catalog.found': 'Found',
    'catalog.reset': 'Reset',
    'catalog.clear_filters': 'Clear all',
    'catalog.no_results': 'No results found',
    'catalog.offline': 'API unavailable. Showing demo data.',
    'calendar.title': 'Schedule',
    'calendar.tagline': 'Weekly anime airing schedule',
    'calendar.episode': 'Episode',
    'calendar.at': 'at',
    'calendar.offline': 'API unavailable. Showing demo data.',
    'calendar.no_episodes': 'No episodes airing today',
    'history.title': 'Watch History',
    'history.tagline': 'All anime with saved progress',
    'history.empty': 'History is empty',
    'history.empty_desc': 'Watched anime will appear here',
    'history.continue': 'Continue Watching',
    'history.delete': 'Delete',
    'history.clear': 'Clear All',
    'history.just_now': 'Just now',
    'history.min_ago': 'min ago',
    'history.hours_ago': 'h ago',
    'history.days_ago': 'd ago',
    'history.episode': 'Episode',
    'history.no_data': 'Could not load anime',
    'favorites.title': 'Favorites',
    'favorites.tagline': 'Your saved anime collection',
    'favorites.empty': 'No favorites yet',
    'favorites.empty_desc': 'Add anime to favorites while browsing the catalog',
    'favorites.coming_soon': 'Coming soon',
    'settings.title': 'Settings',
    'settings.tagline': 'Customize your experience',
    'settings.playback': 'Playback',
    'settings.auto_skip_opening': 'Auto-skip Opening',
    'settings.auto_skip_opening_desc': 'Automatically skip the opening sequence',
    'settings.auto_skip_ending': 'Auto-skip Ending',
    'settings.auto_skip_ending_desc': 'Automatically skip the ending credits',
    'settings.default_quality': 'Default Quality',
    'settings.remember_episode': 'Remember Last Episode',
    'settings.remember_episode_desc': 'Auto-resume from where you left off',
    'settings.show_descriptions': 'Show Episode Descriptions',
    'settings.interface': 'Interface',
    'settings.language': 'Language',
    'settings.window': 'Window',
    'settings.always_on_top': 'Always on Top',
    'settings.always_on_top_desc': 'Keep player on top of all windows',
    'settings.minimize_tray': 'Minimize to System Tray',
    'settings.minimize_tray_desc': 'Minimize to tray instead of taskbar',
    'settings.volume': 'Default Volume',
    'settings.saved': 'Settings saved',
    'settings.offline_banner': 'API unavailable. Showing demo data.',
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.mute': 'Mute',
    'player.fullscreen': 'Fullscreen',
    'player.mini_player': 'Mini Player',
    'player.pin': 'Pin on Top',
    'player.unpin': 'Unpin',
    'player.skip_back': 'Skip Back',
    'player.skip_forward': 'Skip Forward',
    'player.next_episode': 'Next Episode',
    'player.prev_episode': 'Previous Episode',
    'player.buffering': 'Loading...',
    'player.episode': 'Episode',
    'player.episodes': 'Episodes',
    'error.loading': 'Failed to load data',
    'error.offline': 'API unavailable. Showing demo data.',
    'error.network': 'Network error. Check your connection.',
    'common.reload': 'Reload',
    'common.loading': 'Loading...',
  },
  ru: {
    'app.name': 'Akari Media',
    'app.tagline': 'Ультралегкий медиаплеер для просмотра аниме без рекламы',
    'nav.home': 'Главная',
    'nav.catalog': 'Каталог',
    'nav.calendar': 'Расписание',
    'nav.history': 'История',
    'nav.favorites': 'Избранное',
    'nav.settings': 'Настройки',
    'home.trending': 'Популярное',
    'home.ongoing': 'Сейчас выходит',
    'home.watch': 'Смотреть',
    'home.most_popular': 'Самое популярное',
    'home.continue': 'Продолжить',
    'home.episode': 'Сер.',
    'catalog.title': 'Каталог аниме',
    'catalog.search': 'Поиск по названию...',
    'catalog.filters': 'Фильтры',
    'catalog.sort': 'Сортировка',
    'catalog.sort_popularity': 'По популярности',
    'catalog.sort_rating': 'По рейтингу',
    'catalog.sort_name': 'По названию',
    'catalog.sort_date': 'По дате',
    'catalog.type': 'Тип',
    'catalog.status': 'Статус',
    'catalog.found': 'Найдено',
    'catalog.reset': 'Сбросить',
    'catalog.clear_filters': 'Очистить все',
    'catalog.no_results': 'Ничего не найдено',
    'catalog.offline': 'API недоступен. Показаны демо-данные.',
    'calendar.title': 'Календарь',
    'calendar.tagline': 'Расписание выхода серий по дням недели',
    'calendar.episode': 'Серия',
    'calendar.at': 'в',
    'calendar.offline': 'API недоступен. Показаны демо-данные.',
    'calendar.no_episodes': 'Нет новых серий в этот день',
    'history.title': 'История просмотров',
    'history.tagline': 'Все аниме с сохранённым прогрессом',
    'history.empty': 'История пуста',
    'history.empty_desc': 'Просмотренные аниме появятся здесь',
    'history.continue': 'Продолжить просмотр',
    'history.delete': 'Удалить',
    'history.clear': 'Очистить всё',
    'history.just_now': 'Только что',
    'history.min_ago': 'мин назад',
    'history.hours_ago': 'ч назад',
    'history.days_ago': 'д назад',
    'history.episode': 'Серия',
    'history.no_data': 'Не удалось загрузить аниме',
    'favorites.title': 'Избранное',
    'favorites.tagline': 'Сохранённые аниме',
    'favorites.empty': 'Пока ничего нет',
    'favorites.empty_desc': 'Добавляйте аниме в избранное из каталога',
    'favorites.coming_soon': 'Скоро будет',
    'settings.title': 'Настройки',
    'settings.tagline': 'Настройте приложение под себя',
    'settings.playback': 'Воспроизведение',
    'settings.auto_skip_opening': 'Авто-пропуск опенинга',
    'settings.auto_skip_opening_desc': 'Автоматически пропускать вступительную заставку',
    'settings.auto_skip_ending': 'Авто-пропуск эндинга',
    'settings.auto_skip_ending_desc': 'Автоматически пропускать финальные титры',
    'settings.default_quality': 'Качество по умолчанию',
    'settings.remember_episode': 'Запоминать последнюю серию',
    'settings.remember_episode_desc': 'Автоматически продолжать с того же места',
    'settings.show_descriptions': 'Показывать описания серий',
    'settings.interface': 'Интерфейс',
    'settings.language': 'Язык',
    'settings.window': 'Окно',
    'settings.always_on_top': 'Поверх всех окон',
    'settings.always_on_top_desc': 'Закрепить плеер поверх других окон',
    'settings.minimize_tray': 'Сворачивать в трей',
    'settings.minimize_tray_desc': 'Сворачивать в системный трей вместо панели задач',
    'settings.volume': 'Громкость по умолчанию',
    'settings.saved': 'Настройки сохранены',
    'settings.offline_banner': 'API недоступен. Показаны демо-данные.',
    'player.play': 'Воспроизвести',
    'player.pause': 'Пауза',
    'player.mute': 'Без звука',
    'player.fullscreen': 'На весь экран',
    'player.mini_player': 'Мини-плеер',
    'player.pin': 'Закрепить',
    'player.unpin': 'Открепить',
    'player.skip_back': 'Назад',
    'player.skip_forward': 'Вперед',
    'player.next_episode': 'Следующая серия',
    'player.prev_episode': 'Предыдущая серия',
    'player.buffering': 'Загрузка...',
    'player.episode': 'Серия',
    'player.episodes': 'Серии',
    'error.loading': 'Ошибка загрузки',
    'error.offline': 'API недоступен. Показаны демо-данные.',
    'error.network': 'Сетевая ошибка. Проверьте подключение.',
    'common.reload': 'Обновить',
    'common.loading': 'Загрузка...',
  },
};

let currentLanguage: AppLanguage = 'en';

export function setLanguage(lang: AppLanguage): void {
  currentLanguage = lang;
}

export function getLanguage(): AppLanguage {
  return currentLanguage;
}

export function t(key: string): string {
  const lang = STRINGS[currentLanguage];
  if (!lang) return key;
  return lang[key] || STRINGS['en'][key] || key;
}

export function initLocalization(): void {
  const settings = loadSettings();
  currentLanguage = settings.language;
}

// Initialize on import
initLocalization();