use super::commands::TranscriptionResult;
use std::fs;
use std::path::Path;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext};

fn find_model_file() -> Option<String> {
  let possible_paths = [
    "./models/ggml-tiny.en.bin",
    "./models/ggml-tiny.bin",
    "./models/ggml-base.en.bin",
    "./models/ggml-base.bin",
    "./models/ggml-small.en.bin",
    "./models/ggml-small.bin",
    "./models/ggml-medium.en.bin",
    "./models/ggml-medium.bin",
    "./models/ggml-large-v3.bin",
    "./models/whisper-tiny.bin",
    "./models/whisper-tiny.en.bin",
    "./models/whisper-base.bin",
    "./models/whisper-base.en.bin",
    "./models/whisper-small.bin",
    "./models/whisper-small.en.bin",
    "./models/whisper-medium.bin",
    "./models/whisper-large.bin",
    "./models/model.bin",
    "./ggml-tiny.en.bin",
    "./ggml-base.en.bin",
    "./ggml-small.en.bin",
    "./whisper-base.bin",
    "./whisper-small.bin",
    "./model.bin",
  ];

  if let Ok(exe_path) = tauri::utils::platform::current_exe() {
    if let Some(exe_dir) = exe_path.parent() {
      for path in &possible_paths {
        let full_path = exe_dir.join(path);
        if full_path.exists() {
          return Some(full_path.to_string_lossy().to_string());
        }
      }
    }
  }

  for path in possible_paths.iter() {
    if Path::new(path).exists() {
      return Some(path.to_string());
    }
  }

  None
}

pub async fn transcribe(audio_path: &str, language: &str, precision_mode: bool) -> Result<TranscriptionResult, String> {
  let model_path = find_model_file();

  if model_path.is_none() {
    return Ok(TranscriptionResult {
      success: false,
      content: String::new(),
      error: Some("❌ 模型文件未找到。请先下载 Whisper 模型。\n\n支持的模型：\n- ggml-small.en.bin (推荐)\n- ggml-base.en.bin\n- ggml-small.bin\n- ggml-base.bin\n\n请将模型放在 models 目录中。".to_string()),
    });
  }

  let model_path = model_path.unwrap();

  let context = WhisperContext::new(&model_path).map_err(|e| {
    format!("❌ 初始化 Whisper 失败: {}\n\n可能原因：\n- 模型文件损坏\n- 缺少 CUDA 运行时（GPU 模式）\n- 系统内存不足", e)
  })?;

  let audio_data = fs::read(audio_path).map_err(|e| format!("无法读取音频文件: {}", e))?;

  let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: if precision_mode { 5 } else { 1 } });

  if !language.is_empty() {
    params.set_language(Some(language));
  }

  params.set_print_progress(false);
  params.set_print_timestamps(false);
  params.set_print_special(false);

  context.full(params, &audio_data).map_err(|e| format!("Whisper 转录失败: {}", e))?;

  let num_segments = context.full_n_segments();
  let mut result = String::new();

  for i in 0..num_segments {
    let text = context.full_get_segment_text(i).map_err(|e| format!("获取字幕文本失败: {}", e))?;
    let start = context.full_get_segment_t0(i);
    let end = context.full_get_segment_t1(i);

    let start_ms = start * 10;
    let end_ms = end * 10;

    let start_str = format!(
      "{:02}:{:02}:{:02}.{:03}",
      start_ms / 3600000,
      (start_ms % 3600000) / 60000,
      (start_ms % 60000) / 1000,
      start_ms % 1000
    );

    let end_str = format!(
      "{:02}:{:02}:{:02}.{:03}",
      end_ms / 3600000,
      (end_ms % 3600000) / 60000,
      (end_ms % 60000) / 1000,
      end_ms % 1000
    );

    result.push_str(&format!("{} --> {}\n{}\n\n", start_str, end_str, text));
  }

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

pub async fn transcribe_with_translation(audio_path: &str, source_lang: &str, _target_lang: &str, precision_mode: bool) -> Result<TranscriptionResult, String> {
  let model_path = find_model_file();

  if model_path.is_none() {
    return Ok(TranscriptionResult {
      success: false,
      content: String::new(),
      error: Some("Model file not found. Please download the Whisper model first.\nSupported models: ggml-small.en.bin, ggml-base.en.bin, ggml-small.bin, ggml-base.bin".to_string()),
    });
  }

  let model_path = model_path.unwrap();

  let context = WhisperContext::new(&model_path).map_err(|e| format!("Failed to initialize Whisper: {}", e))?;

  let audio_data = fs::read(audio_path).map_err(|e| format!("Failed to read audio file: {}", e))?;

  let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: if precision_mode { 5 } else { 1 } });

  if !source_lang.is_empty() {
    params.set_language(Some(source_lang));
  }

  params.set_translate(true);
  params.set_print_progress(false);
  params.set_print_timestamps(false);
  params.set_print_special(false);

  context.full(params, &audio_data).map_err(|e| format!("Whisper translation failed: {}", e))?;

  let num_segments = context.full_n_segments();
  let mut result = String::new();

  for i in 0..num_segments {
    let text = context.full_get_segment_text(i).map_err(|e| format!("Failed to get segment text: {}", e))?;
    let start = context.full_get_segment_t0(i);
    let end = context.full_get_segment_t1(i);

    let start_ms = start * 10;
    let end_ms = end * 10;

    let start_str = format!(
      "{:02}:{:02}:{:02}.{:03}",
      start_ms / 3600000,
      (start_ms % 3600000) / 60000,
      (start_ms % 60000) / 1000,
      start_ms % 1000
    );

    let end_str = format!(
      "{:02}:{:02}:{:02}.{:03}",
      end_ms / 3600000,
      (end_ms % 3600000) / 60000,
      (end_ms % 60000) / 1000,
      end_ms % 1000
    );

    result.push_str(&format!("{} --> {}\n{}\n\n", start_str, end_str, text));
  }

  Ok(TranscriptionResult {
    success: true,
    content: result,
    error: None,
  })
}