// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod whisper;
mod translate;
mod ffmpeg;
mod gpu_detect;
mod model_downloader;

fn main() {
  tauri::Builder::default()
    .setup(|_app| {
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_system_info,
      commands::extract_audio,
      commands::transcribe_audio,
      commands::translate_subtitle,
      commands::download_model,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}