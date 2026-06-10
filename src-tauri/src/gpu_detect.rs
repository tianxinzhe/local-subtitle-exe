use super::commands::SystemInfo;
use sysinfo::System;

pub async fn detect_system_info() -> Result<SystemInfo, String> {
  let mut sys = System::new_all();
  sys.refresh_all();

  let mut gpu_available = false;
  let mut gpu_name = String::new();

  #[cfg(target_os = "windows")]
  {
    if let Ok(_) = std::fs::metadata("C:\\Windows\\System32\\nvml.dll") {
      gpu_available = true;
      gpu_name = "NVIDIA GPU detected".to_string();
    }
  }

  #[cfg(target_os = "macos")]
  {
    if let Ok(output) = std::process::Command::new("system_profiler")
      .arg("SPDisplaysDataType")
      .output()
    {
      let output_str = String::from_utf8_lossy(&output.stdout);
      if output_str.contains("NVIDIA") || output_str.contains("AMD") || output_str.contains("Apple") {
        gpu_available = true;
        gpu_name = "GPU detected".to_string();
      }
    }
  }

  let cpu_cores = sys.cpus().len();
  let thread_pool_size = std::cmp::max(6, cpu_cores.saturating_sub(2));

  Ok(SystemInfo {
    gpu_available,
    gpu_name,
    cpu_cores,
    thread_pool_size,
  })
}