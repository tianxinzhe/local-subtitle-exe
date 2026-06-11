use super::commands::TranslationResult;
use std::path::Path;
use tokio::process::Command;

const MODEL_DIR: &str = "./models";

pub async fn translate(content: &str, src_lang: &str, target_lang: &str, model: &str) -> Result<TranslationResult, String> {
  if src_lang == target_lang {
    return Ok(TranslationResult {
      success: true,
      content: content.to_string(),
      error: None,
    });
  }

  let model_path = get_model_path(model, src_lang, target_lang).await;
  
  if model_path.is_none() {
    return Ok(TranslationResult {
      success: false,
      content: "".to_string(),
      error: Some(format!("翻译模型未安装，请先在设置页面下载 '{}' 模型", model)),
    });
  }

  let model_path = model_path.unwrap();

  let temp_file = format!("./temp_subtitle_{}.txt", rand::random::<u64>());
  std::fs::write(&temp_file, content).map_err(|e| format!("Failed to write temp file: {}", e))?;

  let translated = match model {
    "marianmt-zh-en" => translate_with_whisper(&temp_file, src_lang, model_path).await,
    "nllb-200" => translate_with_whisper(&temp_file, src_lang, model_path).await,
    _ => translate_with_whisper(&temp_file, src_lang, model_path).await,
  };

  let _ = std::fs::remove_file(&temp_file);

  match translated {
    Ok(result) => Ok(TranslationResult {
      success: true,
      content: result,
      error: None,
    }),
    Err(e) => Ok(TranslationResult {
      success: false,
      content: "".to_string(),
      error: Some(e),
    }),
  }
}

async fn get_model_path(model_name: &str, src_lang: &str, target_lang: &str) -> Option<String> {
  let model_files = vec![
    format!("{}/ggml-small.en.bin", MODEL_DIR),
    format!("{}/ggml-base.en.bin", MODEL_DIR),
    format!("{}/ggml-small.bin", MODEL_DIR),
    format!("{}/ggml-base.bin", MODEL_DIR),
  ];

  for path in model_files {
    if Path::new(&path).exists() {
      return Some(path);
    }
  }

  None
}

async fn translate_with_whisper(input_file: &str, language: &str, model_path: String) -> Result<String, String> {
  let mut cmd = Command::new("./bin/whisper");
  cmd.arg("-m").arg(&model_path);
  cmd.arg("-f").arg(input_file);
  cmd.arg("-l").arg(language);
  cmd.arg("--translate");
  cmd.arg("-o").arg("-");
  cmd.arg("--beam-size").arg("0");

  let output = cmd.output().await.map_err(|e| format!("Failed to execute whisper: {}", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("Whisper translation failed: {}", stderr));
  }

  let result = String::from_utf8_lossy(&output.stdout).to_string();
  Ok(result)
}