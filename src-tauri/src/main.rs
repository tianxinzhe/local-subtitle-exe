// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod whisper;
mod translate;
mod onnx_translate;
mod ffmpeg;
mod gpu_detect;
mod model_downloader;
mod database;

fn main() {
  tauri::Builder::default()
    .setup(|_app| {
      let _ = database::init_db();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_system_info,
      commands::extract_audio,
      commands::transcribe_audio,
      commands::translate_subtitle,
      commands::download_model,
      commands::list_models,
      commands::delete_model,
      commands::get_default_whisper_model,
      commands::set_default_whisper_model,
      commands::get_default_translation_model,
      commands::set_default_translation_model,
      commands::open_file_location,
      commands::add_history_record,
      commands::get_history_records,
      commands::update_history_record,
      commands::delete_history_record,
      commands::clear_history,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}