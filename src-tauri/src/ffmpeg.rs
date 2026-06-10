use tokio::process::Command;

pub async fn extract_audio(input_path: &str, output_path: &str) -> Result<String, String> {
  let output = Command::new("ffmpeg")
    .arg("-i")
    .arg(input_path)
    .arg("-vn")
    .arg("-ar")
    .arg("16000")
    .arg("-ac")
    .arg("1")
    .arg("-c:a")
    .arg("pcm_s16le")
    .arg(output_path)
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("ffmpeg failed: {}", stderr));
  }

  Ok(output_path.to_string())
}