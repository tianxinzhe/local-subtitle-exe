import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

interface AudioFile {
  id: string
  name: string
  size: string
  duration: string
  status: 'pending' | 'extracting' | 'completed' | 'error'
  path: string
}

function AudioExtractor() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav')
  const [bitrate, setBitrate] = useState(192)
  const [isExtracting, setIsExtracting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [outputDir, setOutputDir] = useState('')

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    
    const files = Array.from(e.dataTransfer.files)
    const validExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac']
    
    const audioFiles: AudioFile[] = files
      .filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase()
        return ext && validExtensions.includes(ext)
      })
      .map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: formatFileSize(file.size),
        duration: '00:00:00',
        status: 'pending',
        path: '',
      }))
    
    if (audioFiles.length > 0) {
      setFiles(prev => [...prev, ...audioFiles])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleClickUpload = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Media Files',
          extensions: ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac'],
        },
      ],
      title: '选择音视频文件',
    })
    
    if (selected) {
      const filePaths = Array.isArray(selected) ? selected : [selected]
      const audioFiles: AudioFile[] = filePaths.map((path) => ({
        id: crypto.randomUUID(),
        name: path.split('/').pop() || path.split('\\').pop() || path,
        size: '未知',
        duration: '00:00:00',
        status: 'pending',
        path,
      }))
      setFiles(prev => [...prev, ...audioFiles])
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const startExtraction = async () => {
    if (files.length === 0 || isExtracting) return
    
    if (!outputDir) {
      const selected = await open({
        directory: true,
        title: '选择输出目录',
      })
      if (selected) {
        setOutputDir(Array.isArray(selected) ? selected[0] : selected)
      } else {
        return
      }
    }
    
    setIsExtracting(true)
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx]
      if (file.status === 'completed' || file.status === 'error') continue
      
      setCurrentIndex(idx)
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'extracting' } : f
      ))
      
      try {
        await invoke('extract_audio', {
          inputPath: file.path || file.name,
          outputDir,
          format,
          bitrate,
        })
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed' } : f
        ))
      } catch (error) {
        console.error('Audio extraction failed:', error)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }
    
    setIsExtracting(false)
    setCurrentIndex(-1)
  }

  const getStatusIcon = (status: AudioFile['status']): string => {
    switch (status) {
      case 'pending': return 'clock'
      case 'extracting': return 'loader'
      case 'completed': return 'check'
      case 'error': return 'alert-circle'
      default: return 'help-circle'
    }
  }

  const getStatusColor = (status: AudioFile['status']): string => {
    switch (status) {
      case 'pending': return 'text-slate-400 bg-slate-700/50'
      case 'extracting': return 'text-yellow-400 bg-yellow-500/20'
      case 'completed': return 'text-emerald-400 bg-emerald-500/20'
      case 'error': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-700/50'
    }
  }

  const Icon = ({ name, className }: { name: string; className?: string }) => {
    const icons: Record<string, string> = {
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'loader': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'check': 'M5 13l4 4L19 7',
      'alert-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'help-circle': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      'music': 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    }
    
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons['help-circle']} />
      </svg>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">音频提取</h2>
        {files.length > 0 && (
          <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
            {files.length} 个文件
          </span>
        )}
      </header>

      <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="p-8 flex-1 flex flex-col items-center justify-center">
          <div 
            className="w-full max-w-lg border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-violet-500/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleClickUpload}
          >
            <Icon name="music" className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-300 mb-2">拖拽音视频文件至此处</p>
            <p className="text-sm text-slate-500">或点击上传文件</p>
            <p className="text-xs text-slate-600 mt-2">支持 MP4, MKV, MOV, AVI, WAV, MP3, FLAC 等格式</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">文件列表</h3>
              <button 
                onClick={() => setFiles([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                清空全部
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, idx) => (
                <div 
                  key={file.id} 
                  className={`flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3 transition-all ${
                    currentIndex === idx ? 'ring-1 ring-violet-500/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(file.status)}`}>
                      <Icon name={getStatusIcon(file.status)} className={`w-4 h-4 ${
                        file.status === 'extracting' ? 'animate-spin' : ''
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">导出格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('wav')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  format === 'wav'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                WAV 无损
              </button>
              <button
                onClick={() => setFormat('mp3')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  format === 'mp3'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                MP3 高保真
              </button>
            </div>
          </div>

          {format === 'mp3' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-400">
                比特率: <span className="text-violet-400">{bitrate} kbps</span>
              </label>
              <input
                type="range"
                min="192"
                max="320"
                step="32"
                value={bitrate}
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>192 kbps</span>
                <span>320 kbps</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">输出目录</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="选择输出文件夹..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={startExtraction}
            disabled={files.length === 0 || isExtracting}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              files.length === 0 || isExtracting
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
            }`}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isExtracting ? '提取中...' : '开始提取'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioExtractor