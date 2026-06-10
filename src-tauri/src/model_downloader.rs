use futures_util::StreamExt;
use reqwest::Client;
use std::fs::File;
use std::io::Write;

pub async fn download_model(model_name: &str) -> Result<(), String> {
  let model_urls: std::collections::HashMap<&str, &str> = [
    ("whisper-small", "https://example.com/models/ggml-small.bin"),
    ("whisper-base", "https://example.com/models/ggml-base.bin"),
    ("marianmt-zh-en", "https://example.com/models/marianmt-zh-en.zip"),
    ("nllb-200", "https://example.com/models/nllb-200.zip"),
  ]
  .into();

  let url = model_urls.get(model_name).ok_or_else(|| format!("Unknown model: {}", model_name))?;
  
  let client = Client::new();
  let response = client.get(*url).send().await.map_err(|e| format!("Failed to fetch: {}", e))?;
  
  let total_size = response.content_length().unwrap_or(0);
  let mut downloaded = 0;
  
  let mut file = File::create(format!("./models/{}", model_name)).map_err(|e| format!("Failed to create file: {}", e))?;
  let mut stream = response.bytes_stream();
  
  while let Some(chunk) = stream.next().await {
    let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;
    downloaded += chunk.len();

    let _progress = if total_size > 0 {
      (downloaded as f64 / total_size as f64) * 100.0
    } else {
      0.0
    };

    file.write_all(&chunk).map_err(|e| format!("Failed to write to file: {}", e))?;
  }

  Ok(())
}