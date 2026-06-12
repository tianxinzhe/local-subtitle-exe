import { useState, useEffect } from 'react'
import { FixedSizeList } from 'react-window'
import { invoke } from '@tauri-apps/api/core'
import type { SubtitleRow } from '../types'

const sampleSubtitles: SubtitleRow[] = [
  { id: 1, startTime: '00:00:01.000', endTime: '00:00:04.500', originalText: 'Hello, welcome to the lemon subtitle studio.', translatedText: '' },
  { id: 2, startTime: '00:00:05.000', endTime: '00:00:08.200', originalText: 'This is a powerful offline subtitle tool.', translatedText: '' },
  { id: 3, startTime: '00:00:09.000', endTime: '00:00:12.800', originalText: 'You can transcribe audio and translate subtitles.', translatedText: '' },
]

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
]

const availableTranslationModels = [
  { id: 'onnx-marianmt-zh-en', label: 'ONNX MarianMT 中英互译 ⚡', size: '40 MB' },
  { id: 'onnx-nllb-200', label: 'ONNX NLLB-200 多语言 ⚡', size: '300 MB' },
]

function TranslationDesk() {
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>(sampleSubtitles)
  const [srcLang, setSrcLang] = useState('en')
  const [targetLang, setTargetLang] = useState('zh')
  const [selectedModel, setSelectedModel] = useState<string>('nllb-200')
  const [isTranslating, setIsTranslating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [installedModels, setInstalledModels] = useState<string[]>([])

  useEffect(() => {
    loadModelConfig()
  }, [])

  const loadModelConfig = async () => {
    try {
      const models: string[] = await invoke('list_models')
      setInstalledModels(models)
      
      const defaultModel = await invoke('get_default_translation_model') as string
      if (defaultModel && models.includes(defaultModel)) {
        setSelectedModel(defaultModel)
      } else if (models.length > 0) {
        const availableModel = availableTranslationModels.find(m => models.includes(m.id))
        if (availableModel) {
          setSelectedModel(availableModel.id)
        }
      }
    } catch (error) {
      console.error('Failed to load model config:', error)
    }
  }

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
          setErrorMessage(null)
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
    setErrorMessage(null)

    try {
      const content = subtitles.map(row => row.originalText).join('\n')

      const result: { success: boolean; content: string; error?: string } = await invoke('translate_subtitle', {
        content,
        srcLang,
        targetLang,
        model: selectedModel,
      })

      if (result.success && result.content) {
        const translatedLines = result.content.split('\n')
        setSubtitles(prev => prev.map((row, index) => ({
          ...row,
          translatedText: translatedLines[index] || ''
        })))
      } else if (result.error) {
        setErrorMessage(result.error)
      } else {
        console.error('Translation failed:', result.error)
        setErrorMessage('翻译失败，请重试')
      }
    } catch (error) {
      console.error('Translation error:', error)
      setErrorMessage('翻译出错，请检查网络连接')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleTextChange = (id: number, value: string) => {
    setSubtitles(prev => prev.map(row =>
      row.id === id ? { ...row, translatedText: value } : row
    ))
  }

  const handleExportSRT = () => {
    const srtContent = subtitles.map(row => {
      const startTime = row.startTime.replace('.', ',')
      const endTime = row.endTime.replace('.', ',')
      return `${row.id}\n${startTime} --> ${endTime}\n${row.translatedText || row.originalText}\n`
    }).join('\n')

    downloadFile(srtContent, 'subtitles.srt', 'application/x-subrip')
  }

  const handleExportVTT = () => {
    const vttContent = `WEBVTT\n\n${subtitles.map(row => {
      const startTime = row.startTime
      const endTime = row.endTime
      return `${startTime} --> ${endTime}\n${row.translatedText || row.originalText}`
    }).join('\n\n')}`

    downloadFile(vttContent, 'subtitles.vtt', 'text/vtt')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const SourceRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    return (
      <div style={style} className="flex border-b border-slate-700 px-4 py-3 hover:bg-slate-700/30">
        <span className="text-xs text-slate-500 mr-4 w-24 shrink-0">{row.startTime}</span>
        <span className="text-sm text-white truncate">{row.originalText}</span>
      </div>
    )
  }

  const TargetRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = subtitles[index]
    return (
      <div style={style} className="flex border-b border-slate-700 px-4 py-3 hover:bg-slate-700/30">
        <span className="text-xs text-slate-500 mr-4 w-24 shrink-0">{row.startTime}</span>
        <input
          type="text"
          value={row.translatedText}
          onChange={(e) => handleTextChange(row.id, e.target.value)}
          placeholder="翻译结果..."
          className="flex-1 bg-transparent text-violet-400 text-sm focus:outline-none placeholder-slate-600"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">外挂翻译</h2>
          <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
            {subtitles.length} 条字幕
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportSRT}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导出 SRT
          </button>
          <button
            onClick={handleExportVTT}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/25"
          >
            导出 VTT
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-6 mt-4 bg-red-900/50 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-medium">翻译失败</p>
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleFileSelect}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              导入字幕文件
            </button>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            >
              {availableTranslationModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.label} {installedModels.includes(model.id) ? '(已安装)' : '(未安装)'}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <select
                value={srcLang}
                onChange={(e) => setSrcLang(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>

              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isTranslating
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isTranslating ? '翻译中...' : '开始翻译'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 px-6 pb-6 overflow-hidden">
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">源字幕</span>
              <span className="text-xs text-slate-500">{srcLang === 'zh' ? '中文' : srcLang === 'en' ? 'English' : srcLang}</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <FixedSizeList
              height={450}
              itemCount={subtitles.length}
              itemSize={48}
              width="100%"
            >
              {SourceRow}
            </FixedSizeList>
          </div>
        </div>

        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-medium text-violet-400">目标字幕</span>
              <span className="text-xs text-violet-400/70">{targetLang === 'zh' ? '中文' : targetLang === 'en' ? 'English' : targetLang}</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <FixedSizeList
              height={450}
              itemCount={subtitles.length}
              itemSize={48}
              width="100%"
            >
              {TargetRow}
            </FixedSizeList>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranslationDesk