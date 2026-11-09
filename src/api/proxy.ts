import { invoke, isTauri } from '@tauri-apps/api/core';

// В десктопной версии запросы выполняет Rust, в браузере используется CORS API.
export async function apiGet<T>(url: string): Promise<T> {
  if (isTauri()) {
    const body = await invoke<string>('fetch_url', { url });
    return JSON.parse(body) as T;
  }
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
