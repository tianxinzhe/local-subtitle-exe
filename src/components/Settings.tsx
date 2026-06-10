import { useState } from 'react'

interface SettingsState {
  autoStart: boolean
  checkUpdates: boolean
  theme: 'dark' | 'light'
  language: string
  modelPath: string
  cacheLimit: number
}

const themes = [
  { id: 'dark', label: '深色模式' },
  { id: 'light', label: '浅色模式' },
]

const languages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
]

function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    autoStart: false,
    checkUpdates: true,
    theme: 'dark',
    language: 'zh',
    modelPath: './models',
    cacheLimit: 5,
  })

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setSettings({
      autoStart: false,
      checkUpdates: true,
      theme: 'dark',
      language: 'zh',
      modelPath: './models',
      cacheLimit: 5,
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">软件设置</h2>
      
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">通用设置</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">开机自启动</p>
                <p className="text-sm text-slate-400">启动计算机时自动运行软件</p>
              </div>
              <button
                onClick={() => updateSetting('autoStart', !settings.autoStart)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoStart ? 'bg-primary-500' : 'bg-slate-600'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.autoStart ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">自动检查更新</p>
                <p className="text-sm text-slate-400">定期检查软件更新</p>
              </div>
              <button
                onClick={() => updateSetting('checkUpdates', !settings.checkUpdates)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.checkUpdates ? 'bg-primary-500' : 'bg-slate-600'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.checkUpdates ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">外观设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">主题模式</label>
              <div className="flex gap-2">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => updateSetting('theme', theme.id as SettingsState['theme'])}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      settings.theme === theme.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">界面语言</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">模型设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">模型存储路径</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.modelPath}
                  onChange={(e) => updateSetting('modelPath', e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
                <button className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors">
                  📂
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                缓存限制: {settings.cacheLimit} GB
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.cacheLimit}
                onChange={(e) => updateSetting('cacheLimit', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 GB</span>
                <span>20 GB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">关于软件</h3>
          
          <div className="space-y-2 text-sm text-slate-400">
            <p>软件名称: 柠檬字幕工作室</p>
            <p>版本号: v1.0.0</p>
            <p>作者: Lemon Studio</p>
            <p>联系邮箱: support@lemonsubtitle.com</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              检查更新
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            重置为默认设置
          </button>
          <button className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings