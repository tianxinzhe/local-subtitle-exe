use crate::commands::TranslationResult;
use once_cell::sync::OnceCell;
use ort::session::Session;
use std::path::Path;

static ORT_SESSION: OnceCell<Session> = OnceCell::new();

pub fn find_onnx_model(model_name: &str) -> Option<String> {
    let model_file = format!("{}.onnx", model_name);

    let possible_paths = [
        format!("./models/{}", model_file),
        format!("./models/{}/model.onnx", model_name),
        format!("./{}", model_file),
    ];

    if let Ok(exe_path) = tauri::utils::platform::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let exe_model_path = exe_dir.join("models").join(&model_file);
            if exe_model_path.exists() {
                return Some(exe_model_path.to_string_lossy().to_string());
            }
            let exe_model_dir = exe_dir.join("models").join(model_name).join("model.onnx");
            if exe_model_dir.exists() {
                return Some(exe_model_dir.to_string_lossy().to_string());
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

pub async fn translate_with_onnx(
    content: &str,
    src_lang: &str,
    target_lang: &str,
    model_name: &str,
) -> Result<TranslationResult, String> {
    let model_path = find_onnx_model(model_name);

    if model_path.is_none() {
        return Ok(TranslationResult {
            success: false,
            content: "".to_string(),
            error: Some(format!("ONNX模型 {} 未找到。请先下载该模型。", model_name)),
        });
    }

    let model_path = model_path.unwrap();

    let session = ORT_SESSION.get_or_try_init(|| {
        Session::builder()
            .and_then(|b| {
                b.with_optimization_level(ort::session::GraphOptimizationLevel::Level3)?
                    .with_intra_threads(4)?
                    .commit_from_file(&model_path)
            })
            .map_err(|e| format!("Failed to load ONNX model: {}", e))
    })?;

    let input_names: Vec<String> = session
        .input_names()
        .iter()
        .map(|name| name.to_string())
        .collect();

    let output_names: Vec<String> = session
        .output_names()
        .iter()
        .map(|name| name.to_string())
        .collect();

    let tokenized_input = tokenize(content, src_lang);

    let input_array = ndarray::Array2::from_shape_vec(
        (1, tokenized_input.len()),
        tokenized_input,
    ).map_err(|e| format!("Failed to create input array: {}", e))?;

    let inputs = ort::inputs![&input_names[0] => input_array]
        .map_err(|e| format!("Failed to create inputs: {}", e))?;

    let outputs = session
        .run(inputs)
        .map_err(|e| format!("Failed to run model: {}", e))?;

    let output = outputs[&output_names[0].as_str()]
        .try_extract_tensor::<i64>()
        .map_err(|e| format!("Failed to extract output tensor: {}", e))?;

    let output_data: Vec<i64> = output.iter().copied().collect();

    let translated_text = detokenize(&output_data, target_lang);

    Ok(TranslationResult {
        success: true,
        content: translated_text,
        error: None,
    })
}

fn tokenize(text: &str, _lang: &str) -> Vec<i64> {
    let mut tokens: Vec<i64> = vec![2];

    for c in text.chars() {
        let token = c as i64 + 100;
        tokens.push(token);
    }

    tokens.push(3);
    tokens
}

fn detokenize(tokens: &[i64], _lang: &str) -> String {
    let mut result = String::new();

    for &token in tokens {
        if token == 2 || token == 3 || token == 0 {
            continue;
        }
        if token >= 100 {
            result.push((token - 100) as u8 as char);
        }
    }

    result
}
