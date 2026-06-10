use crate::ffmpeg;
use crate::gpu_detect;
use crate::model_downloader;
use crate::translate;
use crate::whisper;
use serde::{Deserialize, Serialize};
use tauri::command;

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
) -> Result<TranslationResult, String> {
  translate::translate(&content, &src_lang, &target_lang).await
}

#[command]
pub async fn download_model(model_name: String) -> Result<(), String> {
  model_downloader::download_model(&model_name).await
}