import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Navigation from './components/Navigation'
import BatchWorkspace from './components/BatchWorkspace'
import ASRStudio from './components/ASRStudio'
import TranslationDesk from './components/TranslationDesk'
import AudioExtractor from './components/AudioExtractor'
import Settings from './components/Settings'
import { useGlobalSettings } from './hooks/useGlobalSettings'
import type { SystemInfo } from './types'

type KanbanType = 'batch' | 'asr' | 'translation' | 'extractor' | 'settings'

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
]

function App() {
  const [activeKanban, setActiveKanban] = useState<KanbanType>('batch')
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { settings, updateLanguage } = useGlobalSettings()

  useEffect(() => {
    const detectSystemLanguage = () => {
      const lang = navigator.language || 'zh'
      const isChinese = lang.startsWith('zh')
      const detectedLang = isChinese ? 'zh' : 'en'

      if (!localStorage.getItem('language')) {
        updateLanguage(detectedLang)
      }
    }

    detectSystemLanguage()
  }, [updateLanguage])

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await invoke<SystemInfo>('get_system_info')
        setSystemInfo(info)
      } catch (error) {
        console.error('Failed to fetch system info:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSystemInfo()
  }, [])

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [settings.theme])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-full h-full border-4 border-violet-500/30 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-lg font-medium">初始化中...</p>
          <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  const renderKanban = () => {
    switch (activeKanban) {
      case 'batch':
        return <BatchWorkspace systemInfo={systemInfo!} />
      case 'asr':
        return <ASRStudio />
      case 'translation':
        return <TranslationDesk />
      case 'extractor':
        return <AudioExtractor />
      case 'settings':
        return <Settings theme={settings.theme} />
      default:
        return <BatchWorkspace systemInfo={systemInfo!} />
    }
  }

  return (
    <div className="h-screen flex bg-slate-900">
      <Navigation
        activeKanban={activeKanban}
        onKanbanChange={setActiveKanban}
        systemInfo={systemInfo}
        language={settings.language}
        onLanguageChange={updateLanguage}
        languages={languages}
      />
      <main className="flex-1 overflow-hidden bg-slate-900">
        {renderKanban()}
      </main>
    </div>
  )
}

export default App