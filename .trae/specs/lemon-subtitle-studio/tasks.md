# 《柠檬字幕工作室》实现计划

## [ ] Task 1: Tauri 项目初始化与基础配置
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用 Tauri CLI 初始化项目
  - 配置 tauri.conf.json（窗口大小、权限、资源路径）
  - 设置前端构建工具（Vite + React/TypeScript）
  - 创建项目目录结构
- **Acceptance Criteria Addressed**: 基础设施搭建
- **Test Requirements**:
  - `programmatic` TR-1.1: 项目能正常构建，Tauri 开发服务器启动成功
  - `programmatic` TR-1.2: 前端页面能正常加载
- **Notes**: 使用 npm create tauri-app@6.5.0 . -- --template react-ts

## [ ] Task 2: 异构算力检测模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 Rust 后端实现 NVIDIA GPU 检测（nvml.dll 扫描）
  - CPU 核心数自动识别
  - 线程池动态配置
  - GPU 异常时自动降级到 CPU
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 有 GPU 时返回 GPU 状态，无 GPU 时返回 CPU 状态
  - `programmatic` TR-2.2: 线程池配置正确（CPU核心数-2，基准6）
- **Notes**: 使用 sysinfo crate 获取系统信息

## [ ] Task 3: 前端主界面与导航组件
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 实现左侧导航栏（串联工作室、离线听写、外挂翻译、音频提取、软件设置）
  - 实现响应式布局
  - 算力状态 Badge 显示
- **Acceptance Criteria Addressed**: UI 布局需求
- **Test Requirements**:
  - `human-judgment` TR-3.1: 导航栏正常显示，点击切换看板
  - `programmatic` TR-3.2: 算力状态 Badge 正确显示
- **Notes**: 使用 Tailwind CSS 3 进行样式设计

## [ ] Task 4: 串联工作室看板（核心主打UI）
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 实现文件拖拽盲盒区
  - 全局批量配置控制条（语种、精度、翻译模型、归档目录）
  - 任务队列 Grid（文件名、大小、状态、进度、剩余时间）
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-4.1: 拖拽多个文件能正确过滤并生成任务卡片
  - `programmatic` TR-4.2: 全局配置能正确保存
- **Notes**: 使用 react-dropzone 处理文件拖拽

## [ ] Task 5: ffmpeg 音轨提取模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - Rust 异步调用 ffmpeg 进程
  - 强制执行参数: -vn -ar 16000 -ac 1 -c:a pcm_s16le
  - 实时状态反馈
- **Acceptance Criteria Addressed**: US-04
- **Test Requirements**:
  - `programmatic` TR-5.1: 成功提取音轨为 16kHz 单声道 WAV
  - `programmatic` TR-5.2: 状态正确传递到前端
- **Notes**: 使用 tokio::process::Command 执行 ffmpeg

## [ ] Task 6: Whisper.cpp ASR 集成模块
- **Priority**: P0
- **Depends On**: Task 2, Task 5
- **Description**: 
  - Rust FFI 调用 whisper.cpp
  - 高精度模式配置（--beam-size 5 等）
  - 极速模式配置（--beam-size 0）
  - 幻听截断保护（30秒重复检测）
  - 临时文件自动清理
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: 高精度模式正确注入参数
  - `programmatic` TR-6.2: 极速模式正确注入参数
  - `programmatic` TR-6.3: 临时文件在任务结束后被删除
- **Notes**: 使用 libloading crate 进行动态库加载

## [ ] Task 7: 字幕解析器模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - SRT/VTT 格式解析
  - 兼容不规范字幕（断档行号、样式代码、人名标记）
  - 纯文本 Payload 提取
- **Acceptance Criteria Addressed**: AC-7, US-10
- **Test Requirements**:
  - `programmatic` TR-7.1: 正确解析标准 SRT/VTT 文件
  - `programmatic` TR-7.2: 正确处理带样式代码和人名标记的字幕
- **Notes**: 使用 nom 或自定义解析器

## [ ] Task 8: CTranslate2 翻译模块
- **Priority**: P0
- **Depends On**: Task 7
- **Description**: 
  - Rust FFI 调用 CTranslate2
  - 64 句 Batch 张量打包
  - MarianMT 中英通道
  - NLLB-200 小语种通道（四字代码注入）
- **Acceptance Criteria Addressed**: AC-8, AC-9, US-11, US-12, US-13
- **Test Requirements**:
  - `programmatic` TR-8.1: 正确打包 64 句为一个 Batch
  - `programmatic` TR-8.2: 中英互译使用 MarianMT，小语种使用 NLLB-200
- **Notes**: 确保导入 NLLB-200 时注入正确的目标语言代码

## [ ] Task 9: 单文件离线听写工作台
- **Priority**: P1
- **Depends On**: Task 3, Task 6, Task 7
- **Description**: 
  - 视频播放器/音频波形预览
  - 时间轴-原文双列编辑器
  - 点击字幕跳转到对应时间轴
- **Acceptance Criteria Addressed**: FR-2
- **Test Requirements**:
  - `human-judgment` TR-9.1: 播放器正常播放，波形显示正确
  - `programmatic` TR-9.2: 点击字幕行播放器跳转到对应时间
- **Notes**: 使用 video.js 或原生 HTML5 video

## [ ] Task 10: 外挂字幕独立翻译台
- **Priority**: P1
- **Depends On**: Task 3, Task 7, Task 8
- **Description**: 
  - 源字幕预览
  - 目标字幕预览
  - 源语种→目标语种选择器
- **Acceptance Criteria Addressed**: FR-3
- **Test Requirements**:
  - `programmatic` TR-10.1: 正确解析并显示源字幕
  - `programmatic` TR-10.2: 翻译结果正确显示
- **Notes**: 复用 Task 7 和 Task 8 的解析和翻译模块

## [ ] Task 11: 音频提取器
- **Priority**: P1
- **Depends On**: Task 3, Task 5
- **Description**: 
  - 文件列表展示
  - 导出格式选择（WAV/MP3）
  - 比特率滑块（192kbps-320kbps）
- **Acceptance Criteria Addressed**: FR-4
- **Test Requirements**:
  - `programmatic` TR-11.1: 正确提取 WAV 无损格式
  - `programmatic` TR-11.2: 正确提取 MP3 格式，比特率符合设置
- **Notes**: 复用 Task 5 的 ffmpeg 调用逻辑

## [ ] Task 12: 虚拟滚动编辑器组件
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 实现虚拟滚动条（Virtual List）
  - 支持 10000+ 行字幕无卡顿滚动
  - 热内存同步（Blur 时更新）
- **Acceptance Criteria Addressed**: AC-10, AC-11
- **Test Requirements**:
  - `human-judgment` TR-12.1: 10000+ 行字幕滚动无卡顿
  - `programmatic` TR-12.2: 修改后失焦立即同步到内存
- **Notes**: 使用 react-window 或 react-virtualized

## [ ] Task 13: 字幕导出模块
- **Priority**: P0
- **Depends On**: Task 12
- **Description**: 
  - 原生 Save File Dialog 集成
  - 单语导出（纯原文/纯译文）
  - 双语对照导出（译文+换行+原文）
  - VTT 格式合规化
- **Acceptance Criteria Addressed**: AC-12, AC-13, US-16, US-17, US-18, US-19
- **Test Requirements**:
  - `programmatic` TR-13.1: 正确导出单语 SRT
  - `programmatic` TR-13.2: 正确导出双语对照 SRT（译文在上，原文在下）
  - `programmatic` TR-13.3: VTT 格式首行有 WEBVTT，毫秒分隔符为 .
- **Notes**: 使用 Tauri 的 dialog API

## [ ] Task 14: 批量挂机任务队列
- **Priority**: P0
- **Depends On**: Task 4, Task 5, Task 6, Task 8, Task 13
- **Description**: 
  - 串行任务执行（N=1）
  - 全自动流水线：剥离→听写→翻译→导出→清理→下一个
  - 免打扰静默处理
  - 自动命名（[原文件名].bilingual.srt）
- **Acceptance Criteria Addressed**: AC-14, US-20, US-21, US-22, US-23
- **Test Requirements**:
  - `programmatic` TR-14.1: 多个任务串行执行，完成一个再开始下一个
  - `programmatic` TR-14.2: 自动生成正确的文件名格式
  - `programmatic` TR-14.3: 任务完成后自动清理临时文件
- **Notes**: 使用 tokio::sync::mpsc 实现任务队列

## [ ] Task 15: 模型中心模块
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 模型商店界面
  - 流式分块下载（reqwest::stream）
  - 实时网速和进度计算
  - 模型文件存放到 ./models/ 目录
- **Acceptance Criteria Addressed**: AC-15, US-24, US-25, US-26
- **Test Requirements**:
  - `programmatic` TR-15.1: 正确显示下载进度和网速
  - `programmatic` TR-15.2: 模型文件正确保存到 ./models/ 目录
- **Notes**: 使用 reqwest crate 进行 HTTP 下载

## [ ] Task 16: 异常处理与边界约束
- **Priority**: P0
- **Depends On**: Task 6, Task 14
- **Description**: 
  - 超长无声视频 60 秒超时处理
  - 磁盘空间不足检测（io::ErrorKind::WriteZero）
  - 字幕时间轴重叠冲突处理
- **Acceptance Criteria Addressed**: AC-16, AC-17, EC-01, EC-02, EC-03
- **Test Requirements**:
  - `programmatic` TR-16.1: 无声视频 60 秒后超时跳过
  - `programmatic` TR-16.2: 磁盘满时正确捕获异常并暂停队列
- **Notes**: 使用 tokio::time::timeout 实现超时

## [ ] Task 17: 软件设置看板
- **Priority**: P2
- **Depends On**: Task 3
- **Description**: 
  - 全局配置展示和修改
  - 模型存储路径设置
  - 快捷键设置（可选）
- **Acceptance Criteria Addressed**: FR-1 配置需求
- **Test Requirements**:
  - `human-judgment` TR-17.1: 设置界面布局清晰，操作流畅
- **Notes**: 配置持久化到本地文件

## [ ] Task 18: 跨平台构建与打包
- **Priority**: P0
- **Depends On**: 所有核心功能
- **Description**: 
  - Windows 平台构建（MSVC）
  - macOS 平台构建（Clang）
  - 安装包大小控制在 40MB 左右
- **Acceptance Criteria Addressed**: 跨平台支持
- **Test Requirements**:
  - `programmatic` TR-18.1: Windows 安装包构建成功
  - `programmatic` TR-18.2: macOS 安装包构建成功
- **Notes**: 使用 Tauri CLI 进行打包