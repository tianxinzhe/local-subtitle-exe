import { useState, useRef } from 'react'
import { FixedSizeList } from 'react-window'
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

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    const isSelected = selectedRow === row.id

    return (
      <div
        style={style}
        onClick={() => handleRowClick(row)}
        className={`flex border-b border-slate-700 cursor-pointer transition-colors ${
          isSelected ? 'bg-primary-500/20' : 'hover:bg-slate-700/50'
        }`}
      >
        <div className="w-32 px-3 py-2 bg-slate-800/50 border-r border-slate-700 flex-shrink-0">
          <span className="text-xs text-slate-400">{row.startTime}</span>
        </div>
        <div className="flex-1 px-3 py-2">
          <input
            type="text"
            value={row.originalText}
            onChange={(e) => handleTextChange(row.id, 'originalText', e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none"
          />
        </div>
        <div className="flex-1 px-3 py-2 border-l border-slate-700">
          <input
            type="text"
            value={row.translatedText}
            onChange={(e) => handleTextChange(row.id, 'translatedText', e.target.value)}
            className="w-full bg-transparent text-primary-300 text-sm focus:outline-none"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex gap-4">
        <div className="flex-1 bg-slate-800 rounded-xl overflow-hidden aspect-video">
          {videoRef.current?.src ? (
            <video 
              ref={videoRef} 
              controls 
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">🎬</div>
              <p className="text-slate-400">点击下方按钮导入音视频文件</p>
            </div>
          )}
        </div>
        
        <div className="w-80 bg-slate-800 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4 text-slate-300">音频波形预览</h3>
          <div className="h-40 flex items-end justify-center gap-1">
            {Array.from({ length: 60 }).map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-primary-500 rounded-t"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-4 text-sm text-slate-500">
            <p>时长: 00:15:30</p>
            <p>采样率: 16kHz</p>
            <p>声道: 单声道</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-700">
          <div className="w-32 px-3 py-3 bg-slate-700/50 border-r border-slate-700 font-medium text-slate-300 text-sm">
            时间轴
          </div>
          <div className="flex-1 px-3 py-3 bg-slate-700/50 font-medium text-slate-300 text-sm">
            原文
          </div>
          <div className="flex-1 px-3 py-3 bg-slate-700/50 border-l border-slate-700 font-medium text-primary-400 text-sm">
            译文
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <FixedSizeList
            height={400}
            itemCount={subtitles.length}
            itemSize={44}
            width="100%"
          >
            {Row}
          </FixedSizeList>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handleFileSelect}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          📁 导入音视频文件
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            ↺ 重新听写
          </button>
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
            ▶️ 开始听写
          </button>
        </div>
      </div>
    </div>
  )
}

export default ASRStudio