// ============================================
// API ПРОКСИ-КЛИЕНТ
// ============================================
// Пытается выполнить запрос через Tauri Rust backend,
// при ошибке падает на прямой fetch, затем на мок-данные

import { invoke } from '@tauri-apps/api/core';

const USER_AGENT = 'AkariMedia/0.1.0 (com.akarimedia.app)';

export async function apiGet<T>(url: string): Promise<T> {
  const errors: string[] = [];

  // 1. Пытаемся через Tauri invoke (Rust reqwest)
  try {
    const body = await invoke('fetch_url', { url: url });
    return JSON.parse(body) as T;
  } catch (e) {
    errors.push(`Tauri invoke: ${e}`);
    console.log('[WARN] [Proxy] Tauri invoke failed, trying direct fetch');
  }

  // 2. Прямой fetch с заголовками
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json() as T;
  } catch (e) {
    errors.push(`Direct fetch: ${e}`);
  }

  // 3. Всё упало — кидаем ошибку со всеми деталями
  throw new Error(`API недоступен. ${errors.join(' | ')}`);
}