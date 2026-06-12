use ffmpeg_next as ffmpeg;
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

  ffmpeg::init().map_err(|e| format!("FFmpeg 初始化失败: {}", e))?;

  let input = ffmpeg::format::input(input_path)
    .map_err(|e| format!("无法打开输入文件: {}", e))?;

  let audio_stream = input.streams()
    .best(ffmpeg::media::Type::Audio)
    .ok_or_else(|| "未找到音频流".to_string())?;

  let audio_codec = ffmpeg::codec::decoder::find(audio_stream.codec().id())
    .ok_or_else(|| format!("无法找到解码器: {:?}", audio_stream.codec().id()))?
    .audio()
    .ok_or_else(|| "无法获取音频解码器".to_string())?;

  let mut decoder = audio_codec.open().map_err(|e| format!("无法打开解码器: {}", e))?;
  decoder.set_parameters(audio_stream.parameters()).map_err(|e| format!("无法设置解码器参数: {}", e))?;

  let sample_rate = decoder.rate();
  let channels = decoder.channels();

  let mut output = ffmpeg::format::output(&output_path)
    .map_err(|e| format!("无法创建输出文件: {}", e))?;

  let codec_id = match format {
    "mp3" => ffmpeg::codec::Id::MP3,
    _ => ffmpeg::codec::Id::PCM_S16LE,
  };

  let mut encoder = ffmpeg::codec::encoder::find(codec_id)
    .ok_or_else(|| format!("无法找到编码器: {:?}", codec_id))?
    .audio()
    .ok_or_else(|| "无法获取音频编码器".to_string())?;

  encoder.set_rate(sample_rate);
  encoder.set_channels(channels);
  encoder.set_format(ffmpeg::format::sample::Type::S16);

  if format == "mp3" {
    encoder.set_bit_rate(bitrate * 1000);
  }

  let mut encoder = encoder.open().map_err(|e| format!("无法打开编码器: {}", e))?;

  let mut stream = output.add_stream(encoder).map_err(|e| format!("无法添加流: {}", e))?;
  stream.set_time_base(ffmpeg::Rational::new(1, sample_rate as i32));

  output.set_metadata(input.metadata().clone());
  output.write_header().map_err(|e| format!("无法写入文件头: {}", e))?;

  let mut frame_count = 0;
  let mut packet_count = 0;

  for (stream, packet) in input.packets() {
    if stream.index() != audio_stream.index() {
      continue;
    }

    packet_count += 1;
    let mut decoded = ffmpeg::frame::Audio::empty();

    match decoder.send_packet(&packet) {
      Ok(_) => (),
      Err(ffmpeg::Error::Eof) => break,
      Err(e) => return Err(format!("解码失败: {}", e)),
    }

    while let Ok(_) = decoder.receive_frame(&mut decoded) {
      frame_count += 1;

      let mut encoded = ffmpeg::packet::Packet::empty();
      if let Err(e) = stream.codec().encoder().unwrap().audio().unwrap().send_frame(&decoded) {
        if !e.is_eof() {
          return Err(format!("编码失败: {}", e));
        }
      }

      while let Ok(_) = stream.codec().encoder().unwrap().receive_packet(&mut encoded) {
        encoded.set_stream_index(stream.index());
        output.write_packet(&encoded).map_err(|e| format!("写入数据包失败: {}", e))?;
      }
    }
  }

  let mut encoded = ffmpeg::packet::Packet::empty();
  if let Err(e) = stream.codec().encoder().unwrap().audio().unwrap().send_frame(None) {
    if !e.is_eof() {
      return Err(format!("编码结束失败: {}", e));
    }
  }

  while let Ok(_) = stream.codec().encoder().unwrap().receive_packet(&mut encoded) {
    encoded.set_stream_index(stream.index());
    output.write_packet(&encoded).map_err(|e| format!("写入结束数据包失败: {}", e))?;
  }

  output.write_trailer().map_err(|e| format!("无法写入文件尾: {}", e))?;

  Ok(output_path.to_string_lossy().to_string())
}

pub fn is_ffmpeg_available() -> bool {
  ffmpeg::init().is_ok()
}