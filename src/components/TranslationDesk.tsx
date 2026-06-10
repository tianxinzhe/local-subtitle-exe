import { useState } from 'react'
import { FixedSizeList } from 'react-window'
import type { SubtitleRow } from '../types'

const sampleSubtitles: SubtitleRow[] = [
  { id: 1, startTime: '00:00:01.000', endTime: '00:00:04.500', originalText: 'Hello, welcome to the lemon subtitle studio.', translatedText: '' },
  { id: 2, startTime: '00:00:05.000', endTime: '00:00:08.200', originalText: 'This is a powerful offline subtitle tool.', translatedText: '' },
  { id: 3, startTime: '00:00:09.000', endTime: '00:00:12.800', originalText: 'You can transcribe audio and translate subtitles.', translatedText: '' },
]

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
  { code: 'ru', label: '俄语' },
]

function TranslationDesk() {
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>(sampleSubtitles)
  const [srcLang, setSrcLang] = useState('en')
  const [targetLang, setTargetLang] = useState('zh')
  const [isTranslating, setIsTranslating] = useState(false)

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.srt,.vtt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          const parsed = parseSubtitle(content)
          setSubtitles(parsed)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const parseSubtitle = (content: string): SubtitleRow[] => {
    const lines = content.split('\n')
    const rows: SubtitleRow[] = []
    let i = 0
    while (i < lines.length) {
      const id = parseInt(lines[i]?.trim()) || rows.length + 1
      i++
      const timeLine = lines[i]?.trim() || ''
      i++
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)
      let text = ''
      while (i < lines.length && lines[i]?.trim() !== '') {
        text += lines[i]?.trim() + ' '
        i++
      }
      i++
      
      if (timeMatch) {
        rows.push({
          id,
          startTime: timeMatch[1].replace(',', '.'),
          endTime: timeMatch[2].replace(',', '.'),
          originalText: text.trim(),
          translatedText: '',
        })
      }
    }
    return rows
  }

  const handleTranslate = async () => {
    setIsTranslating(true)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSubtitles(prev => prev.map(row => ({
      ...row,
      translatedText: `[翻译结果] ${row.originalText.slice(0, 30)}...`
    })))
    
    setIsTranslating(false)
  }

  const handleTextChange = (id: number, value: string) => {
    setSubtitles(prev => prev.map(row => 
      row.id === id ? { ...row, translatedText: value } : row
    ))
  }

  const SourceRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    return (
      <div style={style} className="flex border-b border-slate-700 px-4 py-3 hover:bg-slate-700/30">
        <span className="text-xs text-slate-500 mr-4">{row.startTime}</span>
        <span className="text-sm text-white">{row.originalText}</span>
      </div>
    )
  }

  const TargetRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    return (
      <div style={style} className="flex border-b border-slate-700 px-4 py-3 hover:bg-slate-700/30">
        <span className="text-xs text-slate-500 mr-4">{row.startTime}</span>
        <input
          type="text"
          value={row.translatedText}
          onChange={(e) => handleTextChange(row.id, e.target.value)}
          placeholder="翻译结果..."
          className="flex-1 bg-transparent text-primary-300 text-sm focus:outline-none placeholder-slate-600"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleFileSelect}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            📁 导入字幕文件
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={srcLang}
            onChange={(e) => setSrcLang(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          
          <span className="text-2xl text-primary-400">→</span>
          
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isTranslating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isTranslating ? '翻译中...' : '🌐 开始翻译'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700 font-medium text-slate-300">
            源字幕 ({srcLang === 'zh' ? '中文' : srcLang === 'en' ? '英语' : srcLang})
          </div>
          <div className="flex-1 overflow-hidden">
            <FixedSizeList
              height={500}
              itemCount={subtitles.length}
              itemSize={48}
              width="100%"
            >
              {SourceRow}
            </FixedSizeList>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700 font-medium text-primary-400">
            目标字幕 ({targetLang === 'zh' ? '中文' : targetLang === 'en' ? '英语' : targetLang})
          </div>
          <div className="flex-1 overflow-hidden">
            <FixedSizeList
              height={500}
              itemCount={subtitles.length}
              itemSize={48}
              width="100%"
            >
              {TargetRow}
            </FixedSizeList>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          💾 导出为 SRT
        </button>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
          💾 导出为 VTT
        </button>
      </div>
    </div>
  )
}

export default TranslationDesk