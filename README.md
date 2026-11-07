# 🎬 Akari Media

Ультралегкое десктопное приложение (медиаплеер) для комфортного просмотра аниме, фильмов и сериалов без рекламы.

## 🚀 Стек технологий

- **Tauri v2** — Легковесный фреймворк для десктопных приложений
- **React 18** — UI библиотека
- **TypeScript** — Типизированный JavaScript
- **Vite** — Быстрый сборщик
- **Tailwind CSS** — Utility-first CSS фреймворк
- **HLS.js** — Поддержка HLS видеопотоков (.m3u8)
- **Lucide Icons** — Красивые иконки
- **React Router** — Маршрутизация

## ✨ Ключевые функции

### 🎯 Mini-Player / Always-on-Top
- Переключение в компактный режим Picture-in-Picture
- Окно закрепляется поверх всех окон Windows (не сворачивается при Alt+Tab)
- Горячие клавиши: `Ctrl+P` для быстрого вызова

### 💾 Автосохранение прогресса
- Каждые 5 секунд во время воспроизведения
- Сохранение при паузе и закрытии
- Автоматическое предложение продолжить с сохраненного момента

### 🎨 UI/UX
- Премиальный темный аниме-стиль
- Плавные анимации и переходы
- Кастомный скроллбар
- Backdrop blur эффекты
- Неоновые акценты (фиолетовый/голубой)

### 🎬 Видеоплеер
- Поддержка HLS потоков (.m3u8)
- Переключение озвучек и качества
- Кастомный UI управления
- Горячие клавиши (пробел, стрелки, F, M, P)
- Индикатор буферизации

## 📦 Установка и запуск

### Требования
- Node.js 18+
- Rust (для Tauri)
- npm или pnpm

### Шаги установки

1. **Установите зависимости:**
```bash
npm install
```

2. **Запуск в режиме разработки:**
```bash
npm run tauri dev
```

3. **Сборка production версии:**
```bash
npm run tauri build
```

Готовое приложение будет в `src-tauri/target/release/`.

## 🎮 Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Пробел` | Play/Pause |
| `←` | Перемотка назад на 10 сек |
| `→` | Перемотка вперед на 10 сек |
| `↑` | Увеличить громкость |
| `↓` | Уменьшить громкость |
| `F` | Полноэкранный режим |
| `M` | Включить/выключить звук |
| `Ctrl+P` | Мини-плеер режим |

## 📁 Структура проекта

```
akari-media/
├── src/
│   ├── components/
│   │   ├── Player.tsx          # Видеоплеер с HLS.js
│   │   ├── AnimeCard.tsx       # Карточка аниме
│   │   └── Sidebar.tsx         # Боковая навигация
│   ├── views/
│   │   └── HomeView.tsx        # Главная страница
│   ├── hooks/
│   │   └── usePlayerProgress.ts # Хук автосохранения прогресса
│   ├── types/
│   │   └── index.ts            # TypeScript типы
│   ├── App.tsx                 # Главный компонент
│   ├── main.tsx                # Точка входа
│   └── index.css               # Глобальные стили
├── src-tauri/                  # Tauri backend
│   ├── src/
│   │   └── main.rs             # Rust код
│   ├── Cargo.toml              # Rust зависимости
│   └── tauri.conf.json         # Конфигурация Tauri
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔌 Интеграция API

### TODO: Добавить реальные API
Замените mock данные на реальные запросы:

1. **Shikimori API** (аниме метаданные):
```typescript
// src/api/shikimori.ts
const SHIKIMORI_BASE = 'https://shikimori.one/api';

export async function getTrending() {
  const response = await fetch(`${SHIKIMORI_BASE}/animes?order=popularity&limit=12`);
  return response.json();
}
```

2. **Kodik API** (видеопотоки):
```typescript
// src/api/kodik.ts
const KODIK_TOKEN = 'your_token_here';

export async function getVideoUrl(shikimoriId: number) {
  const response = await fetch(
    `https://kodikapi.com/search?token=${KODIK_TOKEN}&shikimori_id=${shikimoriId}`
  );
  return response.json();
}
```

3. **TMDB API** (фильмы/сериалы):
```typescript
// src/api/tmdb.ts
const TMDB_KEY = 'your_api_key';

export async function getTrendingMovies() {
  const response = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`
  );
  return response.json();
}
```

## 🎨 Кастомизация темы

Цвета в `tailwind.config.js`:
```js
colors: {
  'akari': {
    'purple': '#a855f7',  // Основной акцент
    'blue': '#06b6d4',    // Дополнительный акцент
    'dark': '#09090b',    // Основной фон
    'darker': '#18181b',  // Темнее фон
  }
}
```

## 📝 Лицензия

MIT License

## 🤝 Вклад

Pull requests приветствуются!

---

**Akari Media** — Смотри аниме с комфортом ✨
