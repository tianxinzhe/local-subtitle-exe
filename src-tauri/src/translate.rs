use super::commands::TranslationResult;
use super::onnx_translate;

pub async fn translate(content: &str, src_lang: &str, target_lang: &str, model: &str) -> Result<TranslationResult, String> {
  if src_lang == target_lang {
    return Ok(TranslationResult {
      success: true,
      content: content.to_string(),
      error: None,
    });
  }

  if model.starts_with("onnx-") {
    return onnx_translate::translate_with_onnx(content, src_lang, target_lang, model).await;
  }

  Ok(TranslationResult {
    success: false,
    content: "".to_string(),
    error: Some("不支持的翻译模型。请在设置页面下载 ONNX 翻译模型。".to_string()),
  })
}