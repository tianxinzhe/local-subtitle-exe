import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { Task, GlobalConfig, SystemInfo } from '../types'

interface BatchWorkspaceProps {
  systemInfo: SystemInfo
}

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

const translationModels = [
  { id: 'marianmt-zh-en', label: 'MarianMT (中英互译)' },
  { id: 'nllb-200', label: 'NLLB-200 (多语言)' },
]

function BatchWorkspace({}: BatchWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1)
  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([])

  const [config, setConfig] = useState<GlobalConfig>({
    language: 'zh',
    precisionMode: true,
    translationModel: 'marianmt-zh-en',
    outputDir: '',
    extractAudio: false,
    extractSubtitle: true,
    translateSubtitle: true,
  })

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setLogs(prev => [...prev, { time, message, type }])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Media Files',
          extensions: ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac', 'srt', 'vtt'],
        },
      ],
      title: '选择音视频或字幕文件',
    })

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected]
      const newTasks: Task[] = paths.map(path => ({
        id: crypto.randomUUID(),
        filename: path.split('/').pop() || path.split('\\').pop() || path,
        fileSize: '未知',
        originalPath: path,
        status: 'pending',
        progress: 0,
        eta: null,
      }))
      setTasks(prev => [...prev, ...newTasks])
    }
  }, [])

  const handleFileClick = async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Media Files',
          extensions: ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac', 'srt', 'vtt'],
        },
      ],
      title: '选择音视频或字幕文件',
    })

    if (selected) {
      const filePaths = Array.isArray(selected) ? selected : [selected]
      const newTasks: Task[] = filePaths.map(path => ({
        id: crypto.randomUUID(),
        filename: path.split('/').pop() || path.split('\\').pop() || path,
        fileSize: '未知',
        originalPath: path,
        status: 'pending',
        progress: 0,
        eta: null,
      }))
      setTasks(prev => [...prev, ...newTasks])
    }
  }

  const handleOutputDirSelect = async () => {
    const selected = await open({
      directory: true,
      title: '选择输出目录',
    })
    if (selected) {
      const dirPath = Array.isArray(selected) ? selected[0] : selected
      setConfig(prev => ({ ...prev, outputDir: dirPath }))
    }
  }

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'pending': return 'bg-slate-500'
      case 'extracting': return 'bg-blue-500'
      case 'transcribing': return 'bg-yellow-500'
      case 'translating': return 'bg-purple-500'
      case 'completed': return 'bg-emerald-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const startProcessing = async () => {
    if (tasks.length === 0 || isProcessing) return
    if (!config.extractAudio && !config.extractSubtitle && !config.translateSubtitle) return
    if (!config.outputDir.trim()) {
      addLog('错误：请先选择输出目录', 'error')
      return
    }

    setIsProcessing(true)
    setCurrentTaskIndex(0)
    setLogs([])

    addLog(`开始处理 ${tasks.length} 个任务...`)

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      setCurrentTaskIndex(i)

      addLog(`正在处理: ${task.filename}`, 'info')
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'extracting', progress: 0 } : t
      ))

      const baseName = task.filename.replace(/\.[^/.]+$/, '')
      const outputPaths: Partial<Task['outputPaths']> = {}

      try {
        if (config.extractAudio) {
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'extracting', progress: 10 } : t
          ))
          addLog('🔊 正在提取音频...', 'info')

          await invoke('extract_audio', {
            inputPath: task.originalPath,
            outputDir: config.outputDir,
            format: 'mp3',
            bitrate: 192,
          })
          
          const audioOutputPath = `${config.outputDir}\\${baseName}.mp3`
          outputPaths.audio = audioOutputPath
          addLog('✅ 音频提取完成', 'success')
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, progress: 25 } : t
          ))
        }

        if (config.extractSubtitle) {
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'transcribing', progress: config.extractAudio ? 35 : 20 } : t
          ))
          addLog('📝 正在识别字幕...', 'info')

          const audioPath = outputPaths.audio || task.originalPath
          const transcribeResult: { success: boolean; content: string; error?: string } = await invoke('transcribe_audio', {
            audioPath,
            language: config.language,
            precisionMode: config.precisionMode,
          })

          if (transcribeResult.success && transcribeResult.content) {
            const subtitlePath = `${config.outputDir}\\${baseName}.srt`
            await saveStringToFile(transcribeResult.content, subtitlePath)
            outputPaths.subtitle = subtitlePath
            addLog('✅ 字幕识别完成', 'success')
          } else {
            addLog(`❌ 字幕识别失败: ${transcribeResult.error || '未知错误'}`, 'error')
          }
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, progress: config.extractAudio ? 60 : 50 } : t
          ))
        }

        if (config.translateSubtitle && outputPaths.subtitle) {
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'translating', progress: config.extractAudio && config.extractSubtitle ? 75 : config.extractAudio || config.extractSubtitle ? 65 : 30 } : t
          ))
          addLog('🌐 正在进行字幕翻译...', 'info')

          const subtitleContent = await readFileContent(outputPaths.subtitle!)
          const translateResult: { success: boolean; content: string; error?: string } = await invoke('translate_subtitle', {
            content: subtitleContent,
            srcLang: config.language,
            targetLang: config.language === 'zh' ? 'en' : 'zh',
            model: config.translationModel,
          })

          if (translateResult.success && translateResult.content) {
            const targetLang = config.language === 'zh' ? 'en' : 'zh'
            const translatedPath = `${config.outputDir}\\${baseName}.${targetLang}.srt`
            await saveStringToFile(translateResult.content, translatedPath)
            outputPaths.translatedSubtitle = translatedPath
            addLog('✅ 字幕翻译完成', 'success')
          } else {
            addLog(`❌ 字幕翻译失败: ${translateResult.error || '未知错误'}`, 'error')
          }
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, progress: 90 } : t
          ))
        }
      } catch (error) {
        addLog(`❌ 处理失败: ${error}`, 'error')
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'error', progress: 0 } : t
        ))
        continue
      }

      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'completed', progress: 100, outputPaths } : t
      ))
      addLog(`✅ ${task.filename} 处理完成`, 'success')
    }

    setIsProcessing(false)
    setCurrentTaskIndex(-1)
    addLog(`所有 ${tasks.length} 个任务处理完成！输出文件位于: ${config.outputDir}`, 'success')
  }

  const saveStringToFile = async (content: string, filePath: string) => {
    await invoke('write_file', { path: filePath, content })
  }

  const readFileContent = async (filePath: string): Promise<string> => {
    return await invoke('read_file', { path: filePath })
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">批量处理</h2>
          {tasks.length > 0 && (
            <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
              {tasks.length} 任务等待
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导出全部
          </button>
          <button
            onClick={startProcessing}
            disabled={tasks.length === 0 || isProcessing || (!config.extractAudio && !config.extractSubtitle && !config.translateSubtitle)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tasks.length === 0 || isProcessing || (!config.extractAudio && !config.extractSubtitle && !config.translateSubtitle)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isProcessing ? '处理中...' : '开始处理'}
          </button>
        </div>
      </header>

      <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">目标语言</label>
            <select
              value={config.language}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">处理模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setConfig(prev => ({ ...prev, precisionMode: true }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config.precisionMode
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                高精度
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, precisionMode: false }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !config.precisionMode
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                快速
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">处理选项</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.extractAudio}
                  onChange={(e) => setConfig(prev => ({ ...prev, extractAudio: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-xs text-slate-300">提取音频</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.extractSubtitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, extractSubtitle: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-xs text-slate-300">字幕提取</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.translateSubtitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, translateSubtitle: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-xs text-slate-300">字幕翻译</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">翻译模型</label>
            <select
              value={config.translationModel}
              onChange={(e) => setConfig(prev => ({ ...prev, translationModel: e.target.value }))}
              disabled={!config.translateSubtitle}
              className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 ${
                !config.translateSubtitle ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {translationModels.map(model => (
                <option key={model.id} value={model.id}>{model.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">输出目录</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.outputDir}
                onChange={(e) => setConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                placeholder="选择输出文件位置..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleOutputDirSelect}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">文件队列</h3>
              {tasks.length > 0 && (
                <button
                  onClick={() => setTasks([])}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  清空
                </button>
              )}
            </div>
            <div
              className={`border-2 rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-violet-500/50 bg-violet-500/5'
                  : 'border-dashed border-slate-700 hover:border-slate-600'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleFileClick}
            >
              <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs text-slate-500">拖拽文件或点击添加</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className={`bg-slate-800 rounded-xl p-3 transition-all ${
                  currentTaskIndex === idx ? 'ring-1 ring-violet-500/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-emerald-500/20' :
                    task.status === 'error' ? 'bg-red-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      task.status === 'completed' ? 'text-emerald-400' :
                      task.status === 'error' ? 'text-red-400' :
                      'text-blue-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{task.filename}</p>
                    <p className="text-xs text-slate-400">{task.fileSize}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} ${
                    task.status === 'extracting' || task.status === 'transcribing' || task.status === 'translating' ? 'animate-pulse' : ''
                  }`}></div>
                </div>
                {task.status !== 'completed' && task.status !== 'error' && task.status !== 'pending' && (
                  <div className="mt-2">
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(task.status)} transition-all duration-300`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeTask(task.id)}
                  className="mt-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {currentTaskIndex >= 0 && tasks[currentTaskIndex] && (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-white">正在处理</span>
                </div>
                <span className="text-xs text-slate-400">任务 {currentTaskIndex + 1}/{tasks.length}</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{tasks[currentTaskIndex].filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {config.extractAudio && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">提取音频</span>
                    )}
                    {config.extractSubtitle && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">字幕识别</span>
                    )}
                    {config.translateSubtitle && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">中英翻译</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {config.extractAudio && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">提取音频</span>
                      <span className={tasks[currentTaskIndex].progress > 20 ? 'text-emerald-400' : 'text-slate-500'}>
                        {tasks[currentTaskIndex].progress > 20 ? '完成' : '等待中'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: tasks[currentTaskIndex].progress > 20 ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                )}
                {config.extractSubtitle && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">字幕提取</span>
                      <span className="text-violet-400">{tasks[currentTaskIndex].progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(tasks[currentTaskIndex].progress, 70)}%` }}></div>
                    </div>
                  </div>
                )}
                {config.translateSubtitle && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">字幕翻译</span>
                      <span className={tasks[currentTaskIndex].progress > 70 ? 'text-purple-400' : 'text-slate-500'}>
                        {tasks[currentTaskIndex].progress > 70 ? `${tasks[currentTaskIndex].progress}%` : '等待中'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: tasks[currentTaskIndex].progress > 70 ? `${tasks[currentTaskIndex].progress - 70}%` : '0%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">处理日志</h3>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                清空日志
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">暂无日志</p>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={`${
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      log.type === 'error' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatchWorkspace