import type { SystemInfo } from '../types'

type KanbanType = 'batch' | 'asr' | 'translation' | 'extractor' | 'settings'

interface NavigationProps {
  activeKanban: KanbanType
  onKanbanChange: (kanban: KanbanType) => void
  systemInfo: SystemInfo | null
}

const navItems = [
  { id: 'batch', label: '串联工作室', icon: '📂' },
  { id: 'asr', label: '离线听写', icon: '🎙️' },
  { id: 'translation', label: '外挂翻译', icon: '📄' },
  { id: 'extractor', label: '音频提取', icon: '🎵' },
  { id: 'settings', label: '软件设置', icon: '⚙️' },
]

function Navigation({ activeKanban, onKanbanChange, systemInfo }: NavigationProps) {
  const getStatusBadge = () => {
    if (!systemInfo) return null
    
    if (systemInfo.gpu_available) {
      return (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
          <span>🟩</span>
          <span>显卡加速</span>
        </div>
      )
    } else {
      return (
        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
          <span>🟦</span>
          <span>CPU模式</span>
        </div>
      )
    }
  }

  return (
    <nav className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col relative">
      {getStatusBadge()}
      
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-primary-400 flex items-center gap-2">
          <span>🍋</span>
          <span>柠檬字幕工作室</span>
        </h1>
      </div>

      <div className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onKanbanChange(item.id as KanbanType)}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  activeKanban === item.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          <p>v1.0.0</p>
          {systemInfo && (
            <p className="mt-1">线程池: {systemInfo.thread_pool_size} 线程</p>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation