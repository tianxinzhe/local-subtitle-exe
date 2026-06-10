import { useState, useCallback } from 'react'
import type { SystemInfo, Task, GlobalConfig } from '../types'

interface BatchWorkspaceProps {
  systemInfo: SystemInfo
}

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
]

const translationModels = [
  { id: 'marianmt', label: 'MarianMT (中英互译)' },
  { id: 'nllb200', label: 'NLLB-200 (多语种)' },
]

function BatchWorkspace({ systemInfo }: BatchWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [config, setConfig] = useState<GlobalConfig>({
    language: 'zh',
    precisionMode: true,
    translationModel: 'marianmt',
    outputDir: '',
  })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac', 'srt', 'vtt'].includes(ext || '')
    })

    const newTasks: Task[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      filename: file.name,
      fileSize: formatFileSize(file.size),
      status: 'pending',
      progress: 0,
      eta: null,
    }))

    setTasks(prev => [...prev, ...newTasks])
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusLabel = (status: Task['status']): string => {
    switch (status) {
      case 'pending': return '等待中'
      case 'extracting': return '提取音轨中'
      case 'transcribing': return '听写中'
      case 'translating': return '翻译中'
      case 'completed': return '已完成'
      case 'error': return '出错'
      default: return '未知'
    }
  }

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'pending': return 'bg-slate-500'
      case 'extracting': return 'bg-blue-500'
      case 'transcribing': return 'bg-yellow-500'
      case 'translating': return 'bg-purple-500'
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const startProcessing = async () => {
    if (tasks.length === 0 || isProcessing) return
    
    setIsProcessing(true)
    
    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'error') continue
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'extracting', progress: 20 } : t
      ))
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'transcribing', progress: 50 } : t
      ))
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'translating', progress: 80 } : t
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
      ))
    }
    
    setIsProcessing(false)
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div 
        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          isDragging 
            ? 'border-primary-400 bg-primary-500/10' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-6xl">📁</div>
        <p className="text-xl font-medium text-slate-300">拖拽音视频/字幕文件至此处</p>
        <p className="text-slate-500">支持 MP4, MKV, MOV, WAV, MP3, SRT, VTT 等格式</p>
        <p className="text-sm text-slate-600">最多支持 100+ 任务批量处理</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">选择语言</label>
            <select
              value={config.language}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">精度模式</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="precision"
                  checked={config.precisionMode}
                  onChange={() => setConfig(prev => ({ ...prev, precisionMode: true }))}
                  className="w-4 h-4 text-primary-500 bg-slate-700 border-slate-600 focus:ring-primary-500"
                />
                <span className="text-sm">高精度</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="precision"
                  checked={!config.precisionMode}
                  onChange={() => setConfig(prev => ({ ...prev, precisionMode: false }))}
                  className="w-4 h-4 text-primary-500 bg-slate-700 border-slate-600 focus:ring-primary-500"
                />
                <span className="text-sm">极速</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">翻译模型</label>
            <select
              value={config.translationModel}
              onChange={(e) => setConfig(prev => ({ ...prev, translationModel: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
            >
              {translationModels.map(model => (
                <option key={model.id} value={model.id}>{model.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">归档目录</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.outputDir}
                onChange={(e) => setConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                placeholder="选择目标文件夹..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <button className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors">
                📂
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            {systemInfo.gpu_available && (
              <span className="text-green-400">🟩 GPU 加速已就绪</span>
            )}
            {!systemInfo.gpu_available && (
              <span className="text-blue-400">🟦 CPU 优化模式 ({systemInfo.thread_pool_size} 线程)</span>
            )}
          </div>
          <button
            onClick={startProcessing}
            disabled={tasks.length === 0 || isProcessing}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              tasks.length === 0 || isProcessing
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isProcessing ? '处理中...' : '▶️ 一键启动批量挂机'}
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 max-h-80 overflow-y-auto">
          <h3 className="text-lg font-medium mb-4 text-slate-300">任务队列 ({tasks.length})</h3>
          <div className="grid gap-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between task-card">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{task.filename}</p>
                    <p className="text-sm text-slate-400">{task.fileSize} · {getStatusLabel(task.status)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {task.status !== 'completed' && task.status !== 'error' && (
                    <>
                      <div className="w-32">
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getStatusColor(task.status)} progress-bar`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">{task.progress}%</p>
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchWorkspace