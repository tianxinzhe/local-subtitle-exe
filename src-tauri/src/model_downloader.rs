use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use tauri::{Emitter, WebviewWindow};

#[derive(Serialize, Deserialize)]
struct ModelConfig {
  default_whisper_model: String,
  default_translation_model: String,
}

const MODEL_DIR: &str = "./models";
const CONFIG_FILE: &str = "./models/config.json";

pub async fn download_model(model_name: &str, window: Option<WebviewWindow>) -> Result<(), String> {
  let model_urls: std::collections::HashMap<&str, (&str, &str)> = [
    ("whisper-tiny", ("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin", ".bin")),
    ("whisper-base", ("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin", ".bin")),
    ("whisper-small", ("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin", ".bin")),
    ("whisper-medium", ("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin", ".bin")),
    ("whisper-large", ("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin", ".bin")),
    ("onnx-marianmt-zh-en", ("https://huggingface.co/skeskinen/opus-mt-zh-en-onnx/resolve/main/model.onnx", ".onnx")),
    ("onnx-nllb-200", ("https://huggingface.co/microsoft/nllb-200-distilled-600M-onnx/resolve/main/model.onnx", ".onnx")),
  ]
  .into();

  let (url, ext) = model_urls.get(model_name).ok_or_else(|| format!("Unknown model: {}", model_name))?;
  
  fs::create_dir_all(MODEL_DIR).map_err(|e| format!("Failed to create model directory: {}", e))?;
  
  let client = Client::new();
  let response = client.get(*url).send().await.map_err(|e| format!("Failed to fetch: {}", e))?;
  
  let total_size = response.content_length().unwrap_or(0);
  let mut downloaded = 0;
  
  let file_path = format!("{}/{}{}", MODEL_DIR, model_name, ext);
  let mut file = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
  let mut stream = response.bytes_stream();
  
  while let Some(chunk) = stream.next().await {
    let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;
    downloaded += chunk.len();

    let progress = if total_size > 0 {
      (downloaded as f64 / total_size as f64) * 100.0
    } else {
      0.0
    };

    if let Some(w) = &window {
      let _ = w.emit("model_download_progress", serde_json::json!({
        "model_name": model_name,
        "progress": progress,
        "downloaded": downloaded,
        "total": total_size,
      }));
    }

    file.write_all(&chunk).map_err(|e| format!("Failed to write to file: {}", e))?;
  }

  if let Some(w) = &window {
    let _ = w.emit("model_download_progress", serde_json::json!({
      "model_name": model_name,
      "progress": 100.0,
      "downloaded": downloaded,
      "total": downloaded,
    }));
  }

  Ok(())
}

pub async fn list_models() -> Result<Vec<String>, String> {
  let model_dir = Path::new(MODEL_DIR);
  
  if !model_dir.exists() {
    return Ok(Vec::new());
  }

  let mut models = Vec::new();
  
  match fs::read_dir(model_dir) {
    Ok(entries) => {
      for entry in entries.flatten() {
        if let Some(file_name) = entry.file_name().to_str() {
          if file_name.ends_with(".bin") {
            if let Some(model_name) = file_name.strip_suffix(".bin") {
              if model_name != "config" {
                models.push(model_name.to_string());
              }
            }
          } else if file_name.ends_with(".onnx") {
            if let Some(model_name) = file_name.strip_suffix(".onnx") {
              models.push(model_name.to_string());
            }
          }
        }
      }
    }
    Err(e) => return Err(format!("Failed to read model directory: {}", e)),
  }
  
  Ok(models)
}

pub async fn delete_model(model_name: &str) -> Result<(), String> {
  let bin_path = format!("{}/{}.bin", MODEL_DIR, model_name);
  let onnx_path = format!("{}/{}.onnx", MODEL_DIR, model_name);
  
  if Path::new(&bin_path).exists() {
    fs::remove_file(&bin_path).map_err(|e| format!("Failed to delete model: {}", e))?;
  } else if Path::new(&onnx_path).exists() {
    fs::remove_file(&onnx_path).map_err(|e| format!("Failed to delete model: {}", e))?;
  }
  
  let config = load_config().await;
  if config.default_whisper_model == model_name {
    let _ = set_default_whisper_model("").await;
  }
  if config.default_translation_model == model_name {
    let _ = set_default_translation_model("").await;
  }
  
  Ok(())
}

async fn load_config() -> ModelConfig {
  let config_path = Path::new(CONFIG_FILE);
  
  if config_path.exists() {
    match fs::read_to_string(config_path) {
      Ok(content) => match serde_json::from_str(&content) {
        Ok(config) => return config,
        Err(_) => {}
      },
      Err(_) => {}
    }
  }
  
  ModelConfig {
    default_whisper_model: "".to_string(),
    default_translation_model: "".to_string(),
  }
}

async fn save_config(config: &ModelConfig) -> Result<(), String> {
  fs::create_dir_all(MODEL_DIR).map_err(|e| format!("Failed to create model directory: {}", e))?;
  
  let content = serde_json::to_string_pretty(config)
    .map_err(|e| format!("Failed to serialize config: {}", e))?;
  
  fs::write(CONFIG_FILE, content)
    .map_err(|e| format!("Failed to write config: {}", e))?;
  
  Ok(())
}

pub async fn get_default_whisper_model() -> Result<String, String> {
  let config = load_config().await;
  Ok(config.default_whisper_model)
}

pub async fn set_default_whisper_model(model_name: &str) -> Result<(), String> {
  let mut config = load_config().await;
  config.default_whisper_model = model_name.to_string();
  save_config(&config).await
}

pub async fn get_default_translation_model() -> Result<String, String> {
  let config = load_config().await;
  Ok(config.default_translation_model)
}

pub async fn set_default_translation_model(model_name: &str) -> Result<(), String> {
  let mut config = load_config().await;
  config.default_translation_model = model_name.to_string();
  save_config(&config).await
}