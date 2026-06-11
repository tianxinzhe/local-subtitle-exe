import { useState, useRef } from 'react'
import { FixedSizeList } from 'react-window'
import { invoke } from '@tauri-apps/api/core'
import type { SubtitleRow } from '../types'

const sampleSubtitles: SubtitleRow[] = [
  { id: 1, startTime: '00:00:01.000', endTime: '00:00:04.500', originalText: 'Hello, welcome to the lemon subtitle studio.', translatedText: '你好，欢迎来到柠檬字幕工作室。' },
  { id: 2, startTime: '00:00:05.000', endTime: '00:00:08.200', originalText: 'This is a powerful offline subtitle tool.', translatedText: '这是一个强大的离线字幕工具。' },
  { id: 3, startTime: '00:00:09.000', endTime: '00:00:12.800', originalText: 'You can transcribe audio and translate subtitles.', translatedText: '你可以转录音频并翻译字幕。' },
  { id: 4, startTime: '00:00:13.500', endTime: '00:00:17.000', originalText: 'All processing happens locally on your computer.', translatedText: '所有处理都在您的电脑本地进行。' },
  { id: 5, startTime: '00:00:18.000', endTime: '00:00:21.500', originalText: 'No internet connection is required.', translatedText: '不需要互联网连接。' },
]

function ASRStudio() {
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>(sampleSubtitles)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*,audio/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        if (videoRef.current) {
          videoRef.current.src = url
        }
        setCurrentFile(file.name)
        setCurrentFilePath((file as any).path || file.name)
      }
    }
    input.click()
  }

  const handleRowClick = (row: SubtitleRow) => {
    setSelectedRow(row.id)
    if (videoRef.current) {
      const timeParts = row.startTime.split(':')
      const seconds = parseFloat(timeParts[0]) * 3600 + parseFloat(timeParts[1]) * 60 + parseFloat(timeParts[2])
      videoRef.current.currentTime = seconds
    }
  }

  const handleTextChange = (id: number, field: 'originalText' | 'translatedText', value: string) => {
    setSubtitles(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const handleStartTranscription = async () => {
    if (!currentFilePath || isTranscribing) return
    
    setIsTranscribing(true)
    setTranscriptionProgress(0)
    
    try {
      const progressInterval = setInterval(() => {
        setTranscriptionProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 15
        })
      }, 500)

      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setTranscriptionProgress(100)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = await invoke('transcribe_audio', {
        audioPath: currentFilePath,
        language: 'zh',
        precisionMode: true,
      })
      
      console.log('Transcription result:', result)
      
    } catch (error) {
      console.error('Transcription failed:', error)
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(0)
    }
  }

  const handleReset = () => {
    setSubtitles(sampleSubtitles)
    setSelectedRow(null)
    if (videoRef.current) {
      videoRef.current.src = ''
    }
    setCurrentFile(null)
    setCurrentFilePath(null)
  }

  const handleExportSRT = () => {
    const srtContent = subtitles.map(row => {
      const startTime = row.startTime.replace('.', ',')
      const endTime = row.endTime.replace('.', ',')
      return `${row.id}\n${startTime} --> ${endTime}\n${row.originalText}\n${row.translatedText}\n`
    }).join('\n')
    
    const blob = new Blob([srtContent], { type: 'application/x-subrip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    const isSelected = selectedRow === row.id

    return (
      <div
        style={style}
        onClick={() => handleRowClick(row)}
        className={`flex border-b border-slate-700 cursor-pointer transition-all ${
          isSelected ? 'bg-violet-500/20 ring-1 ring-violet-500/50' : 'hover:bg-slate-700/50'
        }`}
      >
        <div className="w-36 px-4 py-3 bg-slate-800/50 border-r border-slate-700 flex-shrink-0">
          <span className="text-xs text-slate-400">{row.startTime}</span>
        </div>
        <div className="flex-1 px-4 py-3">
          <input
            type="text"
            value={row.originalText}
            onChange={(e) => handleTextChange(row.id, 'originalText', e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none"
          />
        </div>
        <div className="flex-1 px-4 py-3 border-l border-slate-700">
          <input
            type="text"
            value={row.translatedText}
            onChange={(e) => handleTextChange(row.id, 'translatedText', e.target.value)}
            className="w-full bg-transparent text-violet-400 text-sm focus:outline-none"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">字幕提取</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportSRT}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导出字幕
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="flex gap-6 h-full">
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              {videoRef.current?.src ? (
                <video 
                  ref={videoRef} 
                  controls 
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400">点击下方按钮导入音视频文件</p>
                </div>
              )}
            </div>

            <div className="h-24 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300">音频波形预览</h3>
                {currentFile && <span className="text-xs text-slate-500 truncate max-w-xs">{currentFile}</span>}
              </div>
              <div className="h-10 flex items-end justify-center gap-1">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-violet-500 rounded-t transition-all duration-300"
                    style={{ height: `${20 + Math.sin(i * 0.3) * 60 + Math.random() * 20}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>时长: 00:15:30</span>
                <span>采样率: 16kHz</span>
                <span>声道: 单声道</span>
              </div>
            </div>
          </div>

          <div className="w-96 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex border-b border-slate-800">
              <div className="w-36 px-4 py-3 bg-slate-800/50 border-r border-slate-800 font-medium text-slate-300 text-sm">
                时间轴
              </div>
              <div className="flex-1 px-4 py-3 bg-slate-800/50 font-medium text-slate-300 text-sm">
                原文
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <FixedSizeList
                height={350}
                itemCount={subtitles.length}
                itemSize={48}
                width="100%"
              >
                {Row}
              </FixedSizeList>
            </div>

            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleFileSelect}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  导入文件
                </button>

                {isTranscribing && (
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${transcriptionProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-violet-400">{Math.round(transcriptionProgress)}%</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={handleReset}
                    disabled={isTranscribing}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-300 transition-colors"
                  >
                    重置
                  </button>
                  <button 
                    onClick={handleStartTranscription}
                    disabled={isTranscribing || !currentFile}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isTranscribing || !currentFile
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isTranscribing ? '提取中...' : '开始提取'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ASRStudio