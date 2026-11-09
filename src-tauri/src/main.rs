#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Duration;

// Только необходимые публичные API: не предоставляем WebView произвольный сетевой прокси.
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let parsed = reqwest::Url::parse(&url).map_err(|e| e.to_string())?;
    if parsed.scheme() != "https" || !matches!(parsed.host_str(), Some("shikimori.io" | "anilibria.top")) || parsed.port().is_some() || !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("Недопустимый адрес API".into());
    }
    let client = reqwest::Client::builder()
        .user_agent("AkariMedia/0.1.0 (com.akarimedia.app)")
        .timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::none())
        .build().map_err(|e| e.to_string())?;
    let response = client.get(parsed).send().await.map_err(|e| e.to_string())?
        .error_for_status().map_err(|e| e.to_string())?;
    response.text().await.map_err(|e| e.to_string())
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
