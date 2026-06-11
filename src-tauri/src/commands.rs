use crate::database;
use crate::ffmpeg;
use crate::gpu_detect;
use crate::model_downloader;
use crate::translate;
use crate::whisper;
use serde::{Deserialize, Serialize};
use tauri::command;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct HistoryRecord {
  pub input_file: String,
  pub output_dir: String,
  pub language: String,
  pub precision_mode: bool,
  pub extract_audio: bool,
  pub extract_subtitle: bool,
  pub translate_subtitle: bool,
  pub status: String,
  pub created_at: String,
  pub output_files: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SystemInfo {
  pub gpu_available: bool,
  pub gpu_name: String,
  pub cpu_cores: usize,
  pub thread_pool_size: usize,
}

#[derive(Serialize, Deserialize)]
pub struct TaskProgress {
  pub progress: f32,
  pub status: String,
  pub eta: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct TranscriptionResult {
  pub success: bool,
  pub content: String,
  pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct TranslationResult {
  pub success: bool,
  pub content: String,
  pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DownloadProgress {
  pub progress: f32,
  pub speed_mbs: f64,
  pub status: String,
}

#[command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
  gpu_detect::detect_system_info().await
}

#[command]
pub async fn extract_audio(input_path: String, output_path: String) -> Result<String, String> {
  ffmpeg::extract_audio(&input_path, &output_path).await
}

#[command]
pub async fn transcribe_audio(
  audio_path: String,
  language: String,
  precision_mode: bool,
) -> Result<TranscriptionResult, String> {
  whisper::transcribe(&audio_path, &language, precision_mode).await
}

#[command]
pub async fn translate_subtitle(
  content: String,
  src_lang: String,
  target_lang: String,
  model: String,
) -> Result<TranslationResult, String> {
  translate::translate(&content, &src_lang, &target_lang, &model).await
}

#[command]
pub async fn download_model(model_name: String, app_handle: tauri::AppHandle) -> Result<(), String> {
  let window = app_handle.get_webview_window("main");
  model_downloader::download_model(&model_name, window).await
}

#[command]
pub async fn list_models() -> Result<Vec<String>, String> {
  model_downloader::list_models().await
}

#[command]
pub async fn delete_model(model_name: String) -> Result<(), String> {
  model_downloader::delete_model(&model_name).await
}

#[command]
pub async fn get_default_whisper_model() -> Result<String, String> {
  model_downloader::get_default_whisper_model().await
}

#[command]
pub async fn set_default_whisper_model(model_name: String) -> Result<(), String> {
  model_downloader::set_default_whisper_model(&model_name).await
}

#[command]
pub async fn get_default_translation_model() -> Result<String, String> {
  model_downloader::get_default_translation_model().await
}

#[command]
pub async fn set_default_translation_model(model_name: String) -> Result<(), String> {
  model_downloader::set_default_translation_model(&model_name).await
}

#[command]
pub async fn open_file_location(file_path: String) -> Result<(), String> {
  use std::process::Command;
  #[cfg(target_os = "windows")]
  {
    let path = std::path::Path::new(&file_path);
    let parent = path.parent().ok_or_else(|| "Failed to get parent directory".to_string())?;
    Command::new("explorer.exe")
      .arg(parent)
      .spawn()
      .map_err(|e| format!("Failed to open explorer: {}", e))?;
  }
  #[cfg(target_os = "macos")]
  {
    let path = std::path::Path::new(&file_path);
    let parent = path.parent().ok_or_else(|| "Failed to get parent directory".to_string())?;
    Command::new("open")
      .arg(parent)
      .spawn()
      .map_err(|e| format!("Failed to open finder: {}", e))?;
  }
  #[cfg(target_os = "linux")]
  {
    let path = std::path::Path::new(&file_path);
    let parent = path.parent().ok_or_else(|| "Failed to get parent directory".to_string())?;
    Command::new("xdg-open")
      .arg(parent)
      .spawn()
      .map_err(|e| format!("Failed to open file manager: {}", e))?;
  }
  Ok(())
}

#[command]
pub async fn add_history_record(record: HistoryRecord) -> Result<i64, String> {
  let db_record = database::HistoryRecord {
    id: 0,
    input_file: record.input_file,
    output_dir: record.output_dir,
    language: record.language,
    precision_mode: record.precision_mode,
    extract_audio: record.extract_audio,
    extract_subtitle: record.extract_subtitle,
    translate_subtitle: record.translate_subtitle,
    status: record.status,
    created_at: record.created_at,
    output_files: record.output_files,
  };
  database::add_history_record(&db_record).map_err(|e| e.to_string())
}

#[command]
pub async fn get_history_records() -> Result<Vec<database::HistoryRecord>, String> {
  database::get_history_records().map_err(|e| e.to_string())
}

#[command]
pub async fn update_history_record(id: i64, status: String, output_files: Option<String>) -> Result<(), String> {
  database::update_history_record(id, &status, output_files).map_err(|e| e.to_string())
}

#[command]
pub async fn delete_history_record(id: i64) -> Result<(), String> {
  database::delete_history_record(id).map_err(|e| e.to_string())
}

#[command]
pub async fn clear_history() -> Result<(), String> {
  database::clear_history().map_err(|e| e.to_string())
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
  use std::fs::write;
  write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
  use std::fs::read_to_string;
  read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}