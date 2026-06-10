use super::commands::TranscriptionResult;
use std::fs;
use tokio::process::Command;

pub async fn transcribe(audio_path: &str, language: &str, precision_mode: bool) -> Result<TranscriptionResult, String> {
  let model_path = "./models/ggml-small.en.bin";
  
  if !std::path::Path::new(model_path).exists() {
    return Ok(TranscriptionResult {
      success: false,
      content: String::new(),
      error: Some("Model file not found. Please download the model first.".to_string()),
    });
  }

  let mut cmd = Command::new("./bin/whisper");
  cmd.arg("-m").arg(model_path);
  cmd.arg("-f").arg(audio_path);
  cmd.arg("-l").arg(language);
  cmd.arg("-o").arg("-");
  
  if precision_mode {
    cmd.arg("--beam-size").arg("5");
    cmd.arg("--entropy-thold").arg("2.4");
    cmd.arg("--logprob-thold").arg("-1.0");
  } else {
    cmd.arg("--beam-size").arg("0");
  }

  let output = cmd.output().await.map_err(|e| format!("Failed to execute whisper: {}", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Ok(TranscriptionResult {
      success: false,
      content: String::new(),
      error: Some(format!("Whisper failed: {}", stderr)),
    });
  }

  let result = String::from_utf8_lossy(&output.stdout).to_string();
  
  let temp_path = audio_path.to_string();
  tokio::spawn(async move {
    let _ = fs::remove_file(&temp_path);
  });

  Ok(TranscriptionResult {
    success: true,
    content: result,
    error: None,
  })
}