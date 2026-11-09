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
// Только HTTPS-ссылки известных видеосервисов, без логинов и нестандартных портов.
#[tauri::command]
fn open_streaming_url(url: String) -> Result<(), String> {
    let parsed = reqwest::Url::parse(&url).map_err(|e| e.to_string())?;
    let hosts = ["crunchyroll.com", "netflix.com", "hulu.com", "hidive.com", "youtube.com", "youtu.be", "amazon.com", "amazon.co.uk", "primevideo.com", "tubitv.com", "bilibili.tv", "iq.com", "wetv.vip", "adultswim.com", "crackle.com", "hoopladigital.com", "disneyplus.com", "animelab.com", "funimation.com", "retrocrush.tv"];
    let host = parsed.host_str().unwrap_or("");
    if parsed.scheme() != "https" || parsed.port().is_some() || !parsed.username().is_empty() || parsed.password().is_some() || !hosts.iter().any(|h| host == *h || host.ends_with(&format!(".{}", h))) {
        return Err("Недопустимый адрес видеосервиса".into());
    }
    #[cfg(target_os = "windows")]
    { std::process::Command::new("explorer.exe").arg(parsed.as_str()).spawn().map_err(|e| e.to_string())?; Ok(()) }
    #[cfg(not(target_os = "windows"))]
    { Err("Открытие ссылок поддерживается в Windows".into()) }
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_url, open_streaming_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
