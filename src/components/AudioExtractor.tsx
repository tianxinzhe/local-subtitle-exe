import { useState } from 'react'

interface AudioFile {
  id: string
  name: string
  size: string
  duration: string
  status: 'pending' | 'extracting' | 'completed' | 'error'
}

function AudioExtractor() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav')
  const [bitrate, setBitrate] = useState(192)
  const [isExtracting, setIsExtracting] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ['mp4', 'mkv', 'mov', 'avi', 'wav', 'mp3', 'flac'].includes(ext || '')
    })

    const newFiles: AudioFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: formatFileSize(file.size),
      duration: '00:00:00',
      status: 'pending',
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

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
    
    setIsExtracting(true)
    
    for (const file of files) {
      if (file.status === 'completed' || file.status === 'error') continue
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'extracting' } : f
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed' } : f
      ))
    }
    
    setIsExtracting(false)
  }

  const getStatusIcon = (status: AudioFile['status']): string => {
    switch (status) {
      case 'pending': return '⏳'
      case 'extracting': return '🔄'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const getStatusColor = (status: AudioFile['status']): string => {
    switch (status) {
      case 'pending': return 'text-slate-400'
      case 'extracting': return 'text-yellow-400'
      case 'completed': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div 
        className="flex-1 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-slate-500 transition-colors bg-slate-800/50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-6xl">🎵</div>
        <p className="text-xl font-medium text-slate-300">拖拽音视频文件至此处</p>
        <p className="text-slate-500">支持 MP4, MKV, MOV, AVI, WAV, MP3, FLAC 等格式</p>
      </div>

      {files.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4 text-slate-300">文件列表 ({files.length})</h3>
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${getStatusColor(file.status)}`}>{getStatusIcon(file.status)}</span>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-slate-400">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">导出格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('wav')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  format === 'wav'
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                WAV 无损
              </button>
              <button
                onClick={() => setFormat('mp3')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  format === 'mp3'
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                MP3 高保真
              </button>
            </div>
          </div>

          {format === 'mp3' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-400">
                比特率: {bitrate} kbps
              </label>
              <input
                type="range"
                min="192"
                max="320"
                step="32"
                value={bitrate}
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>192 kbps</span>
                <span>320 kbps</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">输出目录</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="选择输出文件夹..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <button className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors">
                📂
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={startExtraction}
            disabled={files.length === 0 || isExtracting}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              files.length === 0 || isExtracting
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isExtracting ? '提取中...' : '▶️ 开始提取'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioExtractor