# 《柠檬字幕工作室》全量功能需求规格书

## Overview
- **Summary**: 一款基于 Tauri + Rust/C++ 架构的高性能离线字幕处理桌面应用，支持音视频转录、字幕翻译、音频提取等核心功能，具备完整的批量挂机处理能力和异构算力自适应能力。
- **Purpose**: 为视频创作者提供一站式字幕解决方案，支持离线工作、批量处理、多语种翻译，充分利用本地硬件资源。
- **Target Users**: 视频剪辑师、自媒体创作者、影视字幕制作人员、需要批量处理音视频字幕的专业用户。

## Goals
- 实现高性能离线字幕处理，支持 GPU/CPU 自动切换
- 提供完整的批量挂机处理能力，支持 100+ 任务队列
- 支持多语种翻译（中英及小语种），端到端直译
- 提供流畅的用户体验，支持虚拟滚动、实时进度更新
- 跨平台支持（Windows/macOS），模型文件可迁移复用

## Non-Goals (Out of Scope)
- 在线云服务依赖（完全离线运行）
- 实时流媒体字幕
- 视频编辑功能（专注字幕处理）
- 付费功能（本阶段不实现）

## Background & Context
- 基于 Tauri 框架构建，前端使用 Web 技术栈，后端使用 Rust 异步运行时
- 集成 whisper.cpp 进行语音识别，CTranslate2 进行机器翻译
- 支持 CUDA GPU 加速和 CPU 优化模式自动切换
- 设计目标：极致性能、完全离线、跨平台兼容

## Functional Requirements

### FR-1: 串联工作室主看板
- 支持文件拖拽批量导入
- 任务队列可视化展示（文件名、大小、状态、进度、剩余时间）
- 全局配置控制（语种、精度、翻译模型、归档目录）

### FR-2: 单文件离线听写工作台
- 视频播放器/音频波形预览
- 时间轴-原文双列动态编辑器
- 点击字幕跳转到对应时间轴

### FR-3: 外挂字幕独立翻译台
- SRT/VTT 字幕文件导入解析
- 源语种→目标语种选择
- 双语对照预览

### FR-4: 全能音频提取器
- 音视频文件导入
- 导出格式选择（WAV/MP3）
- 比特率配置（192kbps-320kbps）

### FR-5: 异构算力自适应检测
- NVIDIA GPU 检测（显存≥2GB）
- CPU 核心数自动识别
- 运行时动态降级切换

### FR-6: 批量挂机处理队列
- 串行任务执行（N=1）
- 全自动流水线（剥离→听写→翻译→导出→清理）
- 免打扰静默处理

### FR-7: 模型中心
- 流式模型下载
- 实时网速和进度显示
- 跨平台模型复用

## Non-Functional Requirements

### NFR-1: 性能要求
- 高精度模式：准确识别 BGM 和噪音环境下的语音
- 极速模式：i7 CPU 上实现 50x 实时速度
- 虚拟滚动：10000+ 行字幕无卡顿滚动

### NFR-2: 稳定性要求
- GPU 异常时 0.5 秒内平滑降级到 CPU
- 进程无响应 60 秒自动超时处理
- 磁盘空间不足时安全暂停队列

### NFR-3: 资源管理
- 临时文件自动清理
- 内存状态实时同步
- 模型文件跨平台通用

### NFR-4: 用户体验
- 响应式布局，支持拖拽操作
- 实时进度更新，预计剩余时间
- 原生系统对话框集成

## Constraints
- **Technical**: Windows 10+/macOS 11+, Rust 1.70+, Node.js 18+
- **Dependencies**: whisper.cpp, CTranslate2, ffmpeg
- **Package Size**: 安装包控制在 40MB 左右

## Assumptions
- 用户拥有基本的计算机操作能力
- 用户了解字幕文件格式（SRT/VTT）
- 目标磁盘有足够空间存放临时文件和输出

## Acceptance Criteria

### AC-1: GPU/CPU 自适应检测
- **Given**: 用户启动软件
- **When**: 软件完成初始化
- **Then**: 
  - 检测到 NVIDIA GPU（显存≥2GB）时显示"🟩 显卡加速已就绪"
  - 未检测到 GPU 时显示"🟦 CPU 优化模式"，线程池设为 CPU核心数-2
- **Verification**: `programmatic`

### AC-2: GPU 异常降级
- **Given**: 软件正在使用 GPU 加速
- **When**: GPU 驱动崩溃或电源断开
- **Then**: 0.5 秒内自动切换到 CPU 模式，不闪退
- **Verification**: `programmatic`

### AC-3: 批量文件拖拽导入
- **Given**: 主看板处于就绪状态
- **When**: 用户拖拽多个音视频/字幕文件到盲盒区
- **Then**: 
  - 自动过滤非法格式
  - 合法文件生成任务卡片加入队列
  - 每个卡片显示文件名、大小、状态
- **Verification**: `programmatic`

### AC-4: 高精度/极速模式切换
- **Given**: 用户在全局配置中选择模式
- **When**: 任务启动
- **Then**: 
  - 高精度：注入 --beam-size 5 --entropy-thold 2.4 --logprob-thold -1.0
  - 极速：注入 --beam-size 0（贪婪解码）
- **Verification**: `programmatic`

### AC-5: 幻听截断保护
- **Given**: ASR 正在处理纯音乐片段
- **When**: 检测到连续 30 秒无意义重复字符
- **Then**: 强行静音切断，保护时间轴
- **Verification**: `programmatic`

### AC-6: 临时文件清理
- **Given**: 任务完成或用户取消
- **When**: 进程结束
- **Then**: Rust 执行 fs::remove_file 删除临时 WAV 文件
- **Verification**: `programmatic`

### AC-7: 字幕解析兼容性
- **Given**: 用户导入不规范字幕（断档行号、样式代码、人名标记）
- **When**: 解析器处理
- **Then**: 正确提取纯文本 Payload，忽略格式标记
- **Verification**: `programmatic`

### AC-8: Batch 张量打包翻译
- **Given**: 字幕解析完成
- **When**: 启动翻译
- **Then**: 以 64 句为 Batch 打包，整体送入 CTranslate2
- **Verification**: `programmatic`

### AC-9: 翻译模型选择
- **Given**: 用户选择源语种和目标语种
- **When**: 启动翻译
- **Then**: 
  - 中英互译：使用 MarianMT 模型（40MB）
  - 小语种：使用 NLLB-200 模型（300MB），注入四字目标代码
- **Verification**: `programmatic`

### AC-10: 虚拟滚动编辑器
- **Given**: 用户导入 10000+ 行字幕
- **When**: 滚动或编辑
- **Then**: 界面无卡顿（0 毫秒延迟）
- **Verification**: `human-judgment`

### AC-11: 热内存同步
- **Given**: 用户在编辑器中修改文本
- **When**: 光标失焦（Blur）
- **Then**: 立即更新内存状态树，无需手动保存
- **Verification**: `programmatic`

### AC-12: 双语对照导出
- **Given**: 用户选择"双语对照"导出模式
- **When**: 点击导出
- **Then**: 生成译文+换行+原文格式的 SRT 文件
- **Verification**: `programmatic`

### AC-13: VTT 格式合规化
- **Given**: 用户选择导出为 .vtt 格式
- **When**: 写入文件
- **Then**: 
  - 首行写入 WEBVTT
  - 毫秒分隔符由 , 替换为 .
- **Verification**: `programmatic`

### AC-14: 批量挂机流水线
- **Given**: 用户拖入多个文件并选择归档目录
- **When**: 点击一键启动
- **Then**: 
  - 串行执行 N=1
  - 自动完成：剥离→听写→翻译→导出→清理→下一个
- **Verification**: `programmatic`

### AC-15: 流式模型下载
- **Given**: 用户在模型商店点击下载
- **When**: 下载进行中
- **Then**: 实时显示网速（MB/s）和百分比进度
- **Verification**: `programmatic`

### AC-16: 超长无声处理
- **Given**: 用户导入前 20 分钟无声的视频
- **When**: ASR 处理时陷入无响应
- **Then**: 60 秒超时后杀进程，跳过任务，继续下一个
- **Verification**: `programmatic`

### AC-17: 磁盘空间不足处理
- **Given**: 批量挂机时目标盘满
- **When**: BufWriter 写入失败
- **Then**: 捕获 io::ErrorKind::WriteZero，暂停队列，弹窗提示
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要支持其他字幕格式（如 ASS/SSA）？
- [ ] 是否需要支持在线更新检测？
- [ ] 是否需要提供快捷键支持？