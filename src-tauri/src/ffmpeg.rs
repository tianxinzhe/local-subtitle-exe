use std::path::Path;

pub async fn extract_audio(input_path: &str, output_dir: &str, format: &str, bitrate: u32) -> Result<String, String> {
  let input_path = Path::new(input_path);
  if !input_path.exists() {
    return Err(format!("输入文件不存在: {}", input_path.display()));
  }

  let file_name = input_path.file_stem()
    .map(|s| s.to_string_lossy().to_string())
    .unwrap_or_else(|| "output".to_string());

  let output_ext = match format {
    "mp3" => "mp3",
    _ => "wav",
  };

  let output_path = Path::new(output_dir).join(format!("{}.{}", file_name, output_ext));

  // Ensure ffmpeg binary is available
  ffmpeg_sidecar::download::auto_download().map_err(|e| format!("FFmpeg 下载失败: {}", e))?;

  let mut cmd = ffmpeg_sidecar::command::FfmpegCommand::new();
  cmd.arg("-i").arg(input_path.to_string_lossy().as_ref());

  match format {
    "mp3" => {
      cmd.arg("-vn");
      cmd.arg("-acodec").arg("libmp3lame");
      cmd.arg("-b:a").arg(format!("{}k", bitrate));
    }
    _ => {
      cmd.arg("-vn");
      cmd.arg("-acodec").arg("pcm_s16le");
    }
  }

  cmd.arg("-y");
  cmd.arg(output_path.to_string_lossy().as_ref());

  let output = cmd.spawn()
    .map_err(|e| format!("FFmpeg 启动失败: {}", e))?
    .iter()
    .map_err(|e| format!("FFmpeg 执行失败: {}", e))?;

  for event in output {
    if let ffmpeg_sidecar::event::FfmpegEvent::Error(e) = event {
      return Err(format!("FFmpeg 错误: {}", e));
    }
  }

  if !output_path.exists() {
    return Err("输出文件未生成".to_string());
  }

  Ok(output_path.to_string_lossy().to_string())
}

pub fn is_ffmpeg_available() -> bool {
  ffmpeg_sidecar::command::FfmpegCommand::new().arg("-version").spawn().is_ok()
}
