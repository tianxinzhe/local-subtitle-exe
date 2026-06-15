# local-subtitle-exe 构建问题排查记录

## 项目信息

- **项目名称**：local-subtitle-studio（柠檬字幕工作室）
- **项目类型**：Tauri 2 桌面应用（Rust + Vite/React）
- **核心功能**：字幕提取、语音识别（whisper）、机器翻译（ONNX）
- **关键依赖**：`ffmpeg-next`（已替换为 `ffmpeg-sidecar`）、`whisper-rs`、`ort`（ONNX 推理）

---

## 问题排查历程

### 1. `x86_64-win7-windows-msvc` 目标不存在

**现象**：构建时报错 `can't find crate for core`，提示 `x86_64-win7-windows-msvc` 目标未安装。

**原因**：Rust 安装了低版本或配置了非标准目标。

**处理**：卸载 Rust 并重新安装，切换到 stable 工具链。

```powershell
rustup self uninstall
# 重新安装后
rustup default stable
```

---

### 2. Rust 工具链版本不兼容

**现象**：`rustc 1.85.0 is not supported by the following packages`，多个依赖要求 rustc 1.86+ 或 1.88+。

**涉及依赖**：`darling`、`ort`、`icu_*`、`time`、`serde_with` 等。

**处理**：升级 Rust 到最新 stable（1.96.0）。

```powershell
rustup default stable
```

---

### 3. 缺少 `libclang`（whisper-rs 的 bindgen 需要）

**现象**：`whisper-rs-sys` 构建失败，找不到 `libclang`。

**处理**：安装 MSYS2 的 `mingw-w64-x86_64-clang` 和 `mingw-w64-x86_64-llvm`。

```bash
# MSYS2 终端
pacman -S mingw-w64-x86_64-clang mingw-w64-x86_64-llvm
```

```powershell
$env:LIBCLANG_PATH = "C:\msys64\mingw64\bin"
```

---

### 4. 缺少 `cmake`（whisper-rs-sys 需要）

**现象**：`whisper-rs-sys` 构建失败，找不到 `cmake`。

**处理**：安装 CMake（https://cmake.org/download/），安装时勾选 "Add to PATH"。

---

### 5. 构建脚本进程创建失败（沙箱限制）

**现象**：所有 Rust 版本都报 `Os { code: 0, kind: Uncategorized, message: "操作成功完成。" }`，进程创建失败。

**原因**：IDE（Trae）的沙箱环境限制了子进程创建，导致 `proc-macro2`、`quote` 等构建脚本无法启动子进程。

**处理**：改用 Windows 系统自带的独立 PowerShell 终端执行构建命令，不通过 IDE 沙箱。

---

### 6. MSVC 与 MinGW 工具链冲突

**现象**：构建目标为 `x86_64-pc-windows-msvc`，但 `LIBCLANG_PATH` 指向 MSYS2 的 MinGW Clang，导致 `whisper_full_params` 结构体绑定错误（只有 `_address` 字段）。

**原因**：MinGW 的 Clang 按 GNU ABI 解析头文件，生成的结构体布局与 MSVC 不兼容。

**尝试的方案**：
- 切换到 `x86_64-pc-windows-gnu` 目标 → 引出后续问题
- 设置 `BINDGEN_EXTRA_CLANG_ARGS = "-target x86_64-pc-windows-msvc"` → 未验证

**最终处理**：安装官方 LLVM for Windows（MSVC 兼容），卸载 MSYS2。

---

### 7. `ffmpeg-sys-next` 构建失败（核心卡点）

**现象**：`ffmpeg-sys-next v6.1.0` 始终无法构建成功。

**尝试的方案**：

| 方案 | 结果 |
|------|------|
| 默认构建（vcpkg） | vcpkg 只支持 MSVC ABI |
| `PKG_CONFIG_ALLOW_CROSS=1` | pkg-config 仍报 cross-compilation 错误 |
| `NO_VCPKG=1` + `FFMPEG_DIR` | 仍失败 |
| `NO_PKG_CONFIG` 系列环境变量 | 仍失败 |
| 切换到 GNU 目标 + MSYS2 FFmpeg | vcpkg 报 MSVC ABI 不兼容 |
| `PKG_CONFIG_PATH` 指向 MSYS2 | pkg-config 能找到 FFmpeg，但构建仍失败 |

**最终处理**：将 `ffmpeg-next` 替换为 `ffmpeg-sidecar`，彻底绕过 C 代码编译问题。

---

### 8. 替换 `ffmpeg-next` 为 `ffmpeg-sidecar`

**改动文件**：

1. **`src-tauri/Cargo.toml`**：
   - `ffmpeg-next = "6.1"` → `ffmpeg-sidecar = "2.5"`
   - `windows-target` 改回 `x86_64-pc-windows-msvc`

2. **`src-tauri/src/ffmpeg.rs`**：完全重写，从低级绑定 API 改为 CLI 调用方式。

3. **`.cargo/config.toml`**：目标改回 `x86_64-pc-windows-msvc`。

**ffmpeg-sidecar 优势**：
- 无需编译 C 代码
- 自动下载预编译的 FFmpeg 二进制
- 支持 Windows/macOS/Linux
- 最小依赖

---

## 当前环境配置

### 需要安装的工具

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| Rust (stable) | 编译 Rust 代码 | https://rustup.rs/ |
| LLVM | 提供 libclang（whisper-rs bindgen 需要） | https://github.com/llvm/llvm-project/releases |
| CMake | whisper-rs-sys 编译需要 | https://cmake.org/download/ |
| Visual Studio Build Tools | MSVC 编译工具链 | https://visualstudio.microsoft.com/visual-cpp-build-tools/ |
| Node.js + pnpm | 前端构建 | https://nodejs.org/ |

### 构建命令

```powershell
# 设置环境变量
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"

# 清理并构建
cd d:\Project\local-subtitle-exe\src-tauri
cargo clean
cargo build --release --target x86_64-pc-windows-msvc

# 或使用 tauri CLI 完整打包
cd d:\Project\local-subtitle-exe
npm run tauri build
```

### 已卸载的工具

- **MSYS2**：不再需要，已卸载

---

## 关键经验总结

1. **Windows 上 Rust 构建尽量使用 MSVC 工具链**，避免 MinGW/GNU 混用导致 ABI 不兼容。
2. **`ffmpeg-sys-next` 在 Windows 上极难编译**，推荐使用 `ffmpeg-sidecar` 替代。
3. **IDE 沙箱可能限制子进程创建**，构建 Rust 项目时建议使用独立终端。
4. **`LIBCLANG_PATH` 必须与构建目标匹配**：MSVC 目标用官方 LLVM，GNU 目标用 MSYS2 Clang。
5. **Rust 版本要满足依赖要求**，项目依赖要求 rustc 1.86+，使用最新 stable 即可。
