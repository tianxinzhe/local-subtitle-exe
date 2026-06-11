import type { SystemInfo } from '../types'

type KanbanType = 'batch' | 'asr' | 'translation' | 'extractor' | 'settings'

interface NavigationProps {
  activeKanban: KanbanType
  onKanbanChange: (kanban: KanbanType) => void
  systemInfo: SystemInfo | null
  language: string
  onLanguageChange: (language: string) => void
  languages: { code: string; label: string }[]
}

const navItems = [
  { id: 'batch', label: '串联工作室', icon: 'layout-list' },
  { id: 'asr', label: '字幕提取', icon: 'mic' },
  { id: 'translation', label: '外挂翻译', icon: 'globe' },
  { id: 'extractor', label: '音频提取', icon: 'music' },
  { id: 'settings', label: '软件设置', icon: 'settings' },
]

function Navigation({ activeKanban, onKanbanChange, systemInfo, language, onLanguageChange, languages }: NavigationProps) {
  const getStatusBadge = () => {
    if (!systemInfo) return null
    
    if (systemInfo.gpu_available) {
      return (
        <div className="absolute top-4 right-4 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>GPU加速</span>
        </div>
      )
    } else {
      return (
        <div className="absolute top-4 right-4 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span>CPU模式</span>
        </div>
      )
    }
  }

  const Icon = ({ name }: { name: string }) => {
    const icons: Record<string, string> = {
      'layout-list': 'M4 6h16M4 10h16M4 14h16M4 18h16',
      'mic': 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
      'globe': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'music': 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
      'settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    }
    
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons['settings']} />
      </svg>
    )
  }

  return (
    <nav className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative">
      {getStatusBadge()}
      
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">柠檬字幕</h1>
            <p className="text-xs text-slate-400">字幕工作室</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onKanbanChange(item.id as KanbanType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeKanban === item.id
                    ? 'bg-gradient-to-r from-violet-600/20 to-violet-600/5 text-violet-400 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon name={item.icon} />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-3">
          <label className="block text-xs text-slate-500 mb-1">界面语言</label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>v1.0.0</span>
          {systemInfo && <span>{systemInfo.thread_pool_size} 线程</span>}
        </div>
      </div>
    </nav>
  )
}

export default Navigation