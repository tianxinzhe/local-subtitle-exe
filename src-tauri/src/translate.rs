use super::commands::TranslationResult;

pub async fn translate(content: &str, src_lang: &str, target_lang: &str) -> Result<TranslationResult, String> {
  let is_chinese_english = (src_lang == "zh" && target_lang == "en") || (src_lang == "en" && target_lang == "zh");
  
  let model_path = if is_chinese_english {
    "./models/marianmt-zh-en"
  } else {
    "./models/nllb-200"
  };

  if !std::path::Path::new(model_path).exists() {
    return Ok(TranslationResult {
      success: false,
      content: String::new(),
      error: Some("Translation model not found. Please download the model first.".to_string()),
    });
  }

  let lines: Vec<&str> = content.lines().collect();
  let batch_size = 64;
  let mut results = Vec::new();

  for chunk in lines.chunks(batch_size) {
    let translated = translate_batch(chunk, model_path, src_lang, target_lang).await?;
    results.extend(translated);
  }

  Ok(TranslationResult {
    success: true,
    content: results.join("\n"),
    error: None,
  })
}

async fn translate_batch(_lines: &[&str], _model_path: &str, _src_lang: &str, _target_lang: &str) -> Result<Vec<String>, String> {
  Ok(_lines.iter().map(|s| s.to_string()).collect())
}