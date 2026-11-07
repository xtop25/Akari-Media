// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::blocking::Client;
use base64::engine::GeneralPurpose;

#[tauri::command]
fn fetch_url(url: String) -> Result<String, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "AkariMedia/0.1.0 (com.akarimedia.app)")
        .send()
        .map_err(|e| format!("Request failed: {e}"))?;
    let body = response.text().map_err(|e| format!("Body read failed: {e}"))?;
    Ok(body)
}

#[tauri::command]
fn fetch_image(url: String) -> Result<String, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "AkariMedia/0.1.0 (com.akarimedia.app)")
        .header("Referer", "https://shikimori.one/")
        .send()
        .map_err(|e| format!("Image request failed: {e}"))?;
    let bytes: Vec<u8> = response.bytes().map_err(|e| format!("Image bytes failed: {e}"))?;
    let encoded = GeneralPurpose::new("", base64::Config::new()).encode_to_string(&bytes);
    Ok(encoded)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler!(fetch_url, fetch_image))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}