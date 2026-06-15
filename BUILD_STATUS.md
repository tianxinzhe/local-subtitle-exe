# 柠檬字幕工作室 - 构建指南

## 项目概述

- **项目名称**: lemon-subtitle-studio（柠檬字幕工作室）
- **技术栈**: Tauri 2 + Rust + React + TypeScript + Vite
- **功能**: 本地语音识别（Whisper）+ 翻译（ONNX）+ 字幕生成
- **构建目标**: `x86_64-pc-windows-msvc`
- **打包格式**: NSIS 安装程序

## 环境要求

### 必须安装

| 工具 | 版本要求 | 用途 | 安装方式 |
|------|---------|------|---------|
| **Rust** | stable 最新版 (>=1.96) | 编译 Rust 后端 | `https://rustup.rs` → 选默认安装 |
| **Node.js** | >= 18 | 前端构建 | `https://nodejs.org` → LTS 版本 |
| **LLVM** | >= 17 | 提供 libclang（whisper-rs-sys 构建需要） | `https://releases.llvm.org/download.html` → 安装到 `d:\Program Files\LLVM\` |
| **CMake** | >= 3.5 | 编译 whisper.cpp C++ 库 | `https://cmake.org/download` → .msi 安装，勾选 "Add to PATH" |
| **Visual Studio Build Tools** | 2022 | MSVC 编译器和 Windows SDK | `https://visualstudio.microsoft.com/visual-cpp-build-tools/` → 勾选 "C++ 桌面开发" |

### 环境变量

构建前需设置：

```powershell
$env:LIBCLANG_PATH = "d:\Program Files\LLVM\bin"
```

### 验证环境

```powershell
rustc --version          # 应显示 1.96.0 或更高
node --version           # 应显示 v18+ 
cmake --version          # 应显示 3.5+
clang --version          # 应显示 17+
```

## 构建步骤

### 1. 安装前端依赖

```powershell
cd d:\Project\local-subtitle-exe
npm install
```

### 2. 设置环境变量

```powershell
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
```

### 3. 开发模式运行

```powershell
npm run tauri dev
```

### 4. 打包发布

```powershell
npm run build:tauri
```

打包完成后，安装程序位于：
```
src-tauri/target/release/bundle/nsis/柠檬字幕工作室_1.0.0_x64-setup.exe
```

### 5. 仅编译 Rust 后端（调试用）

```powershell
cd src-tauri
cargo build --release --target x86_64-pc-windows-msvc
```

如遇缓存问题，先清理：
```powershell
cd src-tauri
cargo clean
cargo build --release --target x86_64-pc-windows-msvc
```

## 项目结构

```
local-subtitle-exe/
├── src/                          # React 前端源码
│   ├── components/               # UI 组件
│   │   ├── ASRStudio.tsx         # 语音识别工作台
│   │   ├── AudioExtractor.tsx    # 音频提取
│   │   ├── BatchWorkspace.tsx    # 批量处理
│   │   ├── Navigation.tsx        # 导航
│   │   ├── Settings.tsx          # 设置
│   │   └── TranslationDesk.tsx   # 翻译工作台
│   ├── hooks/                    # React hooks
│   ├── types/                    # TypeScript 类型
│   ├── App.tsx                   # 主应用
│   ├── main.tsx                  # 入口
│   └── index.css                 # 样式
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # Tauri 入口
│   │   ├── commands.rs           # Tauri 命令定义
│   │   ├── whisper.rs            # Whisper 语音识别（whisper-rs 0.14）
│   │   ├── onnx_translate.rs     # ONNX 翻译（ort 2.0.0-rc.12）
│   │   ├── ffmpeg.rs             # 音频处理（ffmpeg-sidecar）
│   │   ├── database.rs           # SQLite 数据库
│   │   ├── gpu_detect.rs         # GPU 检测
│   │   ├── model_downloader.rs   # 模型下载
│   │   └── translate.rs          # 翻译逻辑
│   ├── whisper-rs-sys/           # 本地 patch 的 whisper-rs-sys
│   │   ├── build.rs              # 构建脚本（自动下载 whisper.cpp）
│   │   ├── src/bindings.rs       # 手写 Windows MSVC 绑定
│   │   ├── src/lib.rs            # FFI 入口
│   │   ├── wrapper.h             # C 头文件引用
│   │   └── Cargo.toml            # 包配置
│   ├── Cargo.toml                # Rust 依赖（含 [patch.crates-io]）
│   ├── tauri.conf.json           # Tauri 配置
│   └── capabilities/             # Tauri 权限配置
├── .cargo/config.toml            # Cargo 构建目标配置
├── package.json                  # Node.js 依赖
└── vite.config.ts                # Vite 配置
```

## 关键技术决策

### 1. 手写 whisper-rs-sys 绑定（替代 bindgen）

**原因**: bindgen 在 Windows MSVC 上生成错误绑定：
- `whisper_full_params` 只有 `_address` 字段，缺少 `greedy`/`beam_search`
- 引入 `_G_fpos_t`、`_IO_FILE` 等 glibc 类型导致编译溢出

**方案**: `src-tauri/whisper-rs-sys/` 目录包含手写的 `bindings.rs`，通过 `[patch.crates-io]` 替换 crates.io 上的 `whisper-rs-sys`。

### 2. whisper.cpp 源码自动下载

**原因**: whisper.cpp 完整源码约 100+ 文件，不适合提交到 git。

**方案**: `build.rs` 在构建时自动从 GitHub 下载 whisper.cpp v1.7.4 源码到 `OUT_DIR`。如果本地存在 `whisper.cpp/` 目录则优先使用（离线场景）。

### 3. ffmpeg-sidecar 替代 ffmpeg-next

**原因**: `ffmpeg-sys-next` 在 Windows 上编译困难，需要系统安装 FFmpeg 开发库。

**方案**: `ffmpeg-sidecar` 在运行时自动下载 FFmpeg 二进制，无需编译时依赖。

### 4. ort v2.0.0-rc.12 API 适配

**变更**: 移除 `Environment`，使用 `Session::builder()` + `ndarray::Array2` + `ort::inputs!` 宏。

## 已解决的构建问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `can't find crate for core` | 目标平台不存在 | 重装 Rust，切换到 stable 工具链 |
| `rustc 1.85.0 is not supported` | Rust 版本过旧 | `rustup default stable` 升级到最新 |
| 找不到 `libclang` | 未安装 LLVM | 安装 LLVM 并设置 `LIBCLANG_PATH` |
| 找不到 `cmake` | 未安装 CMake | 安装 CMake 并加入 PATH |
| 构建脚本进程创建失败 | IDE 沙箱限制 | 在系统 PowerShell 中执行构建 |
| `whisper_full_params` 只有 `_address` | bindgen 无法处理匿名结构体 | 手写绑定文件 |
| `_G_fpos_t` 编译溢出 | bindgen 引入 glibc 类型 | 手写绑定 + 跳过 bindgen |
| `ort::Environment` 不存在 | ort v2 API 变更 | 适配新 API |
| `ffmpeg-sys-next` 构建失败 | 需要系统 FFmpeg 开发库 | 替换为 `ffmpeg-sidecar` |

## 可能的后续问题

1. **ort v2 API 编译错误**: `ort::inputs!` 宏、`try_extract_tensor` 的具体用法可能需要根据编译错误微调
2. **ndarray 依赖**: ort v2 需要 `ndarray` crate，需确认 Cargo.toml 中有此依赖
3. **链接阶段**: whisper.cpp 静态库（`whisper.lib`、`ggml.lib` 等）是否能正确链接
4. **网络依赖**: 首次构建需要从 GitHub 下载 whisper.cpp 源码，需确保网络通畅

## CUDA 支持（可选）

如需 GPU 加速，使用 CUDA 构建命令：

```powershell
npm run build:tauri:cuda
```

需要额外安装：
- NVIDIA CUDA Toolkit（`https://developer.nvidia.com/cuda-downloads`）
- 设置 `CUDA_PATH` 环境变量
