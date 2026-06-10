import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Navigation from './components/Navigation'
import BatchWorkspace from './components/BatchWorkspace'
import ASRStudio from './components/ASRStudio'
import TranslationDesk from './components/TranslationDesk'
import AudioExtractor from './components/AudioExtractor'
import Settings from './components/Settings'
import type { SystemInfo } from './types'

type KanbanType = 'batch' | 'asr' | 'translation' | 'extractor' | 'settings'

function App() {
  const [activeKanban, setActiveKanban] = useState<KanbanType>('batch')
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">正在检测系统信息...</p>
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
        return <Settings />
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
      />
      <main className="flex-1 overflow-hidden">
        {renderKanban()}
      </main>
    </div>
  )
}

export default App