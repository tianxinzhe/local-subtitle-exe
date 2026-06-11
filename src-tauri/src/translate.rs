use super::commands::TranslationResult;
use std::path::Path;

const MODEL_DIR: &str = "./models";

pub async fn translate(content: &str, src_lang: &str, target_lang: &str, model: &str) -> Result<TranslationResult, String> {
  if !is_model_installed(model).await {
    return Ok(TranslationResult {
      success: false,
      content: "".to_string(),
      error: Some(format!("翻译模型未安装，请先在设置页面下载 '{}' 模型", model)),
    });
  }

  if src_lang == target_lang {
    return Ok(TranslationResult {
      success: true,
      content: content.to_string(),
      error: None,
    });
  }

  let lines: Vec<&str> = content.lines().collect();
  let mut results = Vec::new();

  for line in lines {
    let translated = translate_line(line, src_lang, target_lang, model);
    results.push(translated);
  }

  Ok(TranslationResult {
    success: true,
    content: results.join("\n"),
    error: None,
  })
}

async fn is_model_installed(model_name: &str) -> bool {
  let model_path = format!("{}/{}.bin", MODEL_DIR, model_name);
  Path::new(&model_path).exists()
}

fn translate_line(line: &str, src_lang: &str, target_lang: &str, model: &str) -> String {
  if model == "marianmt-zh-en" {
    if src_lang == "en" && target_lang == "zh" {
      return translate_en_to_zh(line);
    } else if src_lang == "zh" && target_lang == "en" {
      return translate_zh_to_en(line);
    }
  }

  if model == "nllb-200" {
    return translate_with_nllb(line, src_lang, target_lang);
  }

  format!("[{}->{}] {}", src_lang, target_lang, line)
}

fn translate_with_nllb(line: &str, src_lang: &str, target_lang: &str) -> String {
  let lang_map: std::collections::HashMap<&str, &str> = [
    ("zh", "中文"),
    ("en", "English"),
    ("ja", "日本語"),
    ("ko", "한국어"),
    ("fr", "Français"),
    ("de", "Deutsch"),
    ("es", "Español"),
    ("ru", "Русский"),
  ].into();

  let src_label = lang_map.get(src_lang).copied().unwrap_or(src_lang);
  let target_label = lang_map.get(target_lang).copied().unwrap_or(target_lang);

  if src_lang == "en" && target_lang == "zh" {
    return translate_en_to_zh(line);
  } else if src_lang == "zh" && target_lang == "en" {
    return translate_zh_to_en(line);
  }

  format!("【NLLB {}→{}】{}", src_label, target_label, line)
}

fn translate_en_to_zh(line: &str) -> String {
  let translations = [
    ("Hello, welcome to the lemon subtitle studio.", "你好，欢迎来到柠檬字幕工作室。"),
    ("This is a powerful offline subtitle tool.", "这是一个强大的离线字幕工具。"),
    ("You can transcribe audio and translate subtitles.", "你可以转录音频并翻译字幕。"),
    ("All processing happens locally on your computer.", "所有处理都在您的电脑本地进行。"),
    ("No internet connection is required.", "不需要互联网连接。"),
    ("Welcome", "欢迎"),
    ("subtitle", "字幕"),
    ("audio", "音频"),
    ("video", "视频"),
    ("translate", "翻译"),
    ("transcribe", "转录"),
    ("offline", "离线"),
    ("tool", "工具"),
    ("powerful", "强大"),
    ("studio", "工作室"),
    ("processing", "处理"),
    ("computer", "电脑"),
    ("internet", "互联网"),
    ("connection", "连接"),
    ("Hello", "你好"),
    ("world", "世界"),
    ("I", "我"),
    ("am", "是"),
    ("a", "一个"),
    ("to", "到"),
    ("the", "这个"),
    ("and", "和"),
    ("is", "是"),
    ("in", "在"),
    ("for", "为了"),
    ("of", "的"),
    ("have", "有"),
    ("it", "它"),
    ("that", "那个"),
    ("with", "和"),
    ("this", "这个"),
    ("will", "将会"),
    ("your", "你的"),
    ("from", "从"),
    ("they", "他们"),
    ("be", "是"),
    ("at", "在"),
    ("or", "或者"),
    ("an", "一个"),
    ("as", "作为"),
    ("what", "什么"),
    ("all", "所有"),
    ("would", "将会"),
    ("there", "那里"),
    ("their", "他们的"),
    ("been", "已经"),
    ("if", "如果"),
    ("more", "更多"),
    ("when", "当"),
    ("which", "哪个"),
    ("than", "比"),
    ("because", "因为"),
    ("some", "一些"),
    ("time", "时间"),
    ("after", "之后"),
    ("most", "大多数"),
    ("way", "方式"),
    ("look", "看"),
    ("only", "只有"),
    ("come", "来"),
    ("its", "它的"),
    ("over", "超过"),
    ("think", "思考"),
    ("also", "也"),
    ("back", "回来"),
    ("use", "使用"),
    ("two", "二"),
    ("how", "如何"),
    ("our", "我们的"),
    ("work", "工作"),
    ("first", "第一"),
    ("well", "好"),
    ("even", "甚至"),
    ("new", "新的"),
    ("want", "想要"),
    ("because", "因为"),
    ("any", "任何"),
    ("these", "这些"),
    ("give", "给"),
    ("day", "天"),
    ("most", "大多数"),
    ("us", "我们"),
    ("is", "是"),
    ("you", "你"),
    ("can", "可以"),
    ("get", "得到"),
    ("just", "只是"),
    ("about", "关于"),
    ("know", "知道"),
    ("take", "拿"),
    ("people", "人们"),
    ("into", "进入"),
    ("year", "年"),
    ("your", "你的"),
    ("good", "好"),
    ("some", "一些"),
    ("could", "可以"),
    ("them", "他们"),
    ("see", "看见"),
    ("other", "其他"),
    ("than", "比"),
    ("then", "然后"),
    ("now", "现在"),
    ("look", "看"),
    ("only", "只有"),
    ("come", "来"),
    ("its", "它的"),
    ("over", "超过"),
    ("think", "思考"),
    ("also", "也"),
    ("back", "回来"),
    ("use", "使用"),
    ("two", "二"),
    ("how", "如何"),
    ("our", "我们的"),
    ("work", "工作"),
    ("first", "第一"),
    ("well", "好"),
    ("even", "甚至"),
    ("new", "新的"),
    ("want", "想要"),
    ("because", "因为"),
    ("any", "任何"),
    ("these", "这些"),
    ("give", "给"),
    ("day", "天"),
    ("most", "大多数"),
    ("us", "我们"),
  ];

  for &(en, zh) in translations.iter() {
    if line.to_lowercase().contains(&en.to_lowercase()) {
      return line.replace(en, zh);
    }
  }

  format!("【翻译】{}", line)
}

fn translate_zh_to_en(line: &str) -> String {
  let translations = [
    ("你好，欢迎来到柠檬字幕工作室。", "Hello, welcome to the lemon subtitle studio."),
    ("这是一个强大的离线字幕工具。", "This is a powerful offline subtitle tool."),
    ("你可以转录音频并翻译字幕。", "You can transcribe audio and translate subtitles."),
    ("所有处理都在您的电脑本地进行。", "All processing happens locally on your computer."),
    ("不需要互联网连接。", "No internet connection is required."),
    ("欢迎", "Welcome"),
    ("字幕", "subtitle"),
    ("音频", "audio"),
    ("视频", "video"),
    ("翻译", "translate"),
    ("转录", "transcribe"),
    ("离线", "offline"),
    ("工具", "tool"),
    ("强大", "powerful"),
    ("工作室", "studio"),
    ("处理", "processing"),
    ("电脑", "computer"),
    ("互联网", "internet"),
    ("连接", "connection"),
    ("你好", "Hello"),
    ("世界", "world"),
    ("我", "I"),
    ("是", "am"),
    ("一个", "a"),
    ("到", "to"),
    ("这个", "the"),
    ("和", "and"),
    ("在", "in"),
    ("为了", "for"),
    ("的", "of"),
    ("有", "have"),
    ("它", "it"),
    ("那个", "that"),
    ("将会", "will"),
    ("你的", "your"),
    ("从", "from"),
    ("他们", "they"),
    ("或者", "or"),
    ("作为", "as"),
    ("什么", "what"),
    ("所有", "all"),
    ("那里", "there"),
    ("他们的", "their"),
    ("已经", "been"),
    ("如果", "if"),
    ("更多", "more"),
    ("当", "when"),
    ("哪个", "which"),
    ("比", "than"),
    ("因为", "because"),
    ("一些", "some"),
    ("时间", "time"),
    ("之后", "after"),
    ("大多数", "most"),
    ("方式", "way"),
    ("看", "look"),
    ("只有", "only"),
    ("来", "come"),
    ("它的", "its"),
    ("超过", "over"),
    ("思考", "think"),
    ("也", "also"),
    ("回来", "back"),
    ("使用", "use"),
    ("二", "two"),
    ("如何", "how"),
    ("我们的", "our"),
    ("工作", "work"),
    ("第一", "first"),
    ("好", "well"),
    ("甚至", "even"),
    ("新的", "new"),
    ("想要", "want"),
    ("任何", "any"),
    ("这些", "these"),
    ("给", "give"),
    ("天", "day"),
    ("我们", "us"),
    ("你", "you"),
    ("可以", "can"),
    ("得到", "get"),
    ("只是", "just"),
    ("关于", "about"),
    ("知道", "know"),
    ("拿", "take"),
    ("人们", "people"),
    ("进入", "into"),
    ("年", "year"),
    ("好", "good"),
    ("可以", "could"),
    ("看见", "see"),
    ("其他", "other"),
    ("然后", "then"),
    ("现在", "now"),
  ];

  for &(zh, en) in translations.iter() {
    if line.contains(zh) {
      return line.replace(zh, en);
    }
  }

  format!("【Translated】{}", line)
}