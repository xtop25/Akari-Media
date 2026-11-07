# 🚀 СЛЕДУЮЩИЕ ШАГИ

## 1️⃣ Установка зависимостей

```bash
npm install
```

## 2️⃣ Запуск в режиме разработки

```bash
npm run tauri dev
```

**ВАЖНО:** При первом запуске Tauri скачает и скомпилирует Rust зависимости (это займет 5-10 минут).

## 3️⃣ Интеграция API

Замените mock данные на реальные API запросы:

### Shikimori API (аниме)
Создайте `src/api/shikimori.ts`:
```typescript
const BASE_URL = 'https://shikimori.one/api';

export async function searchAnime(query: string) {
  const response = await fetch(`${BASE_URL}/animes?search=${query}&limit=20`);
  return response.json();
}

export async function getTrending() {
  const response = await fetch(`${BASE_URL}/animes?order=popularity&limit=24`);
  return response.json();
}

export async function getOngoing() {
  const response = await fetch(`${BASE_URL}/animes?status=ongoing&order=popularity&limit=24`);
  return response.json();
}
```

### Kodik API (видеопотоки)
Создайте `src/api/kodik.ts`:
```typescript
const KODIK_TOKEN = 'your_kodik_api_token'; // Получите на https://kodik.cc/

export async function getVideoSources(shikimoriId: number) {
  const response = await fetch(
    `https://kodikapi.com/search?token=${KODIK_TOKEN}&shikimori_id=${shikimoriId}&with_episodes=true`
  );
  const data = await response.json();
  
  // Извлекаем HLS ссылки для каждой озвучки
  return data.results.map((result: any) => ({
    translationId: result.translation.id,
    translationTitle: result.translation.title,
    episodes: result.episodes,
    link: result.link, // iframe ссылка
  }));
}
```

### AniLibria API (альтернатива)
```typescript
export async function getAniLibriaRelease(code: string) {
  const response = await fetch(`https://api.anilibria.tv/v3/title?code=${code}`);
  return response.json();
}
```

## 4️⃣ Обновите HomeView.tsx

Замените MOCK_TRENDING на реальные данные:

```typescript
import { getTrending, getOngoing } from '@/api/shikimori';

useEffect(() => {
  async function loadData() {
    setIsLoading(true);
    try {
      const [trendingData, ongoingData] = await Promise.all([
        getTrending(),
        getOngoing(),
      ]);
      setTrending(trendingData);
      setOngoing(ongoingData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  }
  loadData();
}, []);
```

## 5️⃣ Настройка CSP в tauri.conf.json

Для работы с внешними API обновите CSP политику:

```json
"security": {
  "csp": "default-src 'self'; connect-src 'self' https://shikimori.one https://kodikapi.com https://api.anilibria.tv; media-src 'self' https: http: blob: data:; img-src 'self' https: http: data:; style-src 'self' 'unsafe-inline'"
}
```

## 6️⃣ Генерация иконок

Создайте PNG иконку 1024x1024 и выполните:

```bash
npm install -g @tauri-apps/cli
tauri icon path/to/icon.png
```

Это создаст все необходимые размеры в `src-tauri/icons/`.

## 7️⃣ Сборка production версии

```bash
npm run tauri build
```

Готовое приложение будет в `src-tauri/target/release/`.

## 8️⃣ Дополнительные функции для реализации

### Календарь онгоингов
- Создайте `src/views/CalendarView.tsx`
- Используйте Shikimori API: `/api/calendar`
- Покажите расписание выхода новых серий

### История просмотров
- Создайте `src/views/HistoryView.tsx`
- Используйте хук `getAnimeProgress()` из `usePlayerProgress.ts`
- Покажите список просмотренных аниме с прогрессом

### Избранное
- Создайте localStorage хранилище для избранного
- Добавьте кнопку "Добавить в избранное" на карточки

### Поиск
- Добавьте строку поиска в Sidebar
- Используйте Shikimori API: `/api/animes?search=query`

## ⚠️ Известные проблемы

### Ошибка CORS
Если получаете CORS ошибки, используйте Tauri backend для прокси запросов:

1. Добавьте в `src-tauri/src/main.rs`:
```rust
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

2. Используйте в React:
```typescript
import { invoke } from '@tauri-apps/api/core';

const data = await invoke('fetch_url', { url: 'https://api.example.com' });
```

## 📚 Полезные ссылки

- [Tauri Docs](https://tauri.app/)
- [Shikimori API](https://shikimori.one/api/doc)
- [Kodik API](https://kodik.cc/)
- [HLS.js Docs](https://github.com/video-dev/hls.js/)
- [React Router Docs](https://reactrouter.com/)

---

**Удачи в разработке Akari Media!** 🎬✨
