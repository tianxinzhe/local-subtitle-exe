import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface SettingsProps {
  theme: 'dark' | 'light'
}

interface SettingsState {
  modelPath: string
  sourceFilesPath: string
  audioOutputPath: string
  subtitleOutputPath: string
  translatedSubtitlePath: string
  bilingualSubtitlePath: string
  subtitleNaming: 'original' | 'language' | 'custom'
  customNamePattern: string
}

interface ModelInfo {
  id: string
  name: string
  type: 'whisper' | 'translation'
  size: string
  installed: boolean
  isDefault: boolean
  progress?: number
  status?: 'downloading' | 'installed' | 'not-installed'
}

const availableModels: Omit<ModelInfo, 'installed' | 'isDefault' | 'progress' | 'status'>[] = [
  { id: 'whisper-tiny', name: 'Whisper Tiny (39MB)', type: 'whisper', size: '39 MB' },
  { id: 'whisper-base', name: 'Whisper Base (141MB)', type: 'whisper', size: '141 MB' },
  { id: 'whisper-small', name: 'Whisper Small (466MB)', type: 'whisper', size: '466 MB' },
  { id: 'whisper-medium', name: 'Whisper Medium (1.5GB)', type: 'whisper', size: '1.5 GB' },
  { id: 'whisper-large', name: 'Whisper Large (2.9GB)', type: 'whisper', size: '2.9 GB' },
  { id: 'marianmt-zh-en', name: 'MarianMT 中英 (40MB)', type: 'translation', size: '40 MB' },
  { id: 'nllb-200', name: 'NLLB-200 多语言 (300MB)', type: 'translation', size: '300 MB' },
]

function Settings({}: SettingsProps) {
  const [settings, setSettings] = useState<SettingsState>({
    modelPath: './models',
    sourceFilesPath: './sources',
    audioOutputPath: './output/audio',
    subtitleOutputPath: './output/subtitles',
    translatedSubtitlePath: './output/translated',
    bilingualSubtitlePath: './output/bilingual',
    subtitleNaming: 'language',
    customNamePattern: '{name}_{lang}',
  })

  const [models, setModels] = useState<ModelInfo[]>([])
  const [activeTab, setActiveTab] = useState<'whisper' | 'translation'>('whisper')

  useEffect(() => {
    loadModels()

    const unlisten = listen<{ model_name: string; progress: number }>('model_download_progress', (event) => {
      const data = event.payload
      setModels(prev => prev.map(model =>
        model.id === data.model_name
          ? { ...model, progress: data.progress }
          : model
      ))

      if (data.progress >= 100) {
        setTimeout(() => loadModels(), 500)
      }
    })

    return () => {
      unlisten.then((fn: () => void) => fn())
    }
  }, [])

  const loadModels = async () => {
    try {
      const installedModels: string[] = await invoke('list_models')
      const defaultWhisper = await invoke('get_default_whisper_model') as string
      const defaultTranslation = await invoke('get_default_translation_model') as string

      const modelList = availableModels.map(model => ({
        ...model,
        installed: installedModels.includes(model.id),
        isDefault: (model.type === 'whisper' && model.id === defaultWhisper) ||
                   (model.type === 'translation' && model.id === defaultTranslation),
        status: (installedModels.includes(model.id) ? 'installed' : 'not-installed') as 'installed' | 'not-installed',
      }))

      setModels(modelList)
    } catch (error) {
      console.error('Failed to load models:', error)
      setModels(availableModels.map(model => ({
        ...model,
        installed: false,
        isDefault: false,
        status: 'not-installed',
      })))
    }
  }

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setSettings({
      modelPath: './models',
      sourceFilesPath: './sources',
      audioOutputPath: './output/audio',
      subtitleOutputPath: './output/subtitles',
      translatedSubtitlePath: './output/translated',
      bilingualSubtitlePath: './output/bilingual',
      subtitleNaming: 'language',
      customNamePattern: '{name}_{lang}',
    })
  }

  const handleDownloadModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (!model || model.status === 'downloading') return

    setModels(prev => prev.map(m =>
      m.id === modelId
        ? { ...m, status: 'downloading', progress: 0 }
        : m
    ))

    try {
      await invoke('download_model', { modelName: modelId })
    } catch (error) {
      console.error('Failed to download model:', error)
      setModels(prev => prev.map(m =>
        m.id === modelId
          ? { ...m, status: 'not-installed', progress: undefined }
          : m
      ))
    }
  }

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(`确定要删除此模型吗？`)) return

    try {
      await invoke('delete_model', { modelName: modelId })
      loadModels()
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  const handleSetDefault = async (modelId: string, modelType: 'whisper' | 'translation') => {
    try {
      if (modelType === 'whisper') {
        await invoke('set_default_whisper_model', { modelName: modelId })
      } else {
        await invoke('set_default_translation_model', { modelName: modelId })
      }
      loadModels()
    } catch (error) {
      console.error('Failed to set default model:', error)
    }
  }

  const filteredModels = models.filter(m => m.type === activeTab)

  return (
    <div className="h-full overflow-y-auto">
      <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-white">软件设置</h2>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">模型管理</h3>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('whisper')}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'whisper'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              语音识别模型
            </button>
            <button
              onClick={() => setActiveTab('translation')}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'translation'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              翻译模型
            </button>
          </div>

          <div className="space-y-3">
            {filteredModels.map(model => (
              <div
                key={model.id}
                className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    model.status === 'downloading' ? 'bg-yellow-500 animate-pulse' :
                    model.status === 'installed' ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />
                  <div>
                    <p className="font-medium text-white">{model.name}</p>
                    <p className="text-sm text-slate-400">{model.size}</p>
                  </div>
                  {model.isDefault && (
                    <span className="px-2 py-0.5 bg-violet-600 text-xs text-white rounded-full">
                      默认
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {model.status === 'downloading' && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                          style={{ width: `${model.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">{Math.round(model.progress || 0)}%</span>
                    </div>
                  )}
                  {model.status === 'not-installed' && (
                    <button
                      onClick={() => handleDownloadModel(model.id)}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-500/25"
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载
                    </button>
                  )}
                  {model.status === 'installed' && (
                    <>
                      {!model.isDefault && (
                        <button
                          onClick={() => handleSetDefault(model.id, model.type)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          设为默认
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeTab === 'whisper' && (
            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">
                  模型越大，识别精度越高，但占用内存也越大。推荐使用 Small 或 Medium 模型。
                </p>
              </div>
            </div>
          )}
          {activeTab === 'translation' && (
            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">
                  MarianMT 适合中英互译，NLLB-200 支持 200+ 种语言互译。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">存储设置</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: '模型存储路径', key: 'modelPath' as keyof SettingsState },
              { label: '源文件目录', key: 'sourceFilesPath' as keyof SettingsState },
              { label: '音频输出目录', key: 'audioOutputPath' as keyof SettingsState },
              { label: '字幕输出目录', key: 'subtitleOutputPath' as keyof SettingsState },
              { label: '翻译字幕目录', key: 'translatedSubtitlePath' as keyof SettingsState },
              { label: '双语字幕目录', key: 'bilingualSubtitlePath' as keyof SettingsState },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-slate-400 mb-2">{item.label}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings[item.key]}
                    onChange={(e) => updateSetting(item.key, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">字幕命名规则</h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => updateSetting('subtitleNaming', 'original')}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  settings.subtitleNaming === 'original'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                保持原名
              </button>
              <button
                onClick={() => updateSetting('subtitleNaming', 'language')}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  settings.subtitleNaming === 'language'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                按语言命名
              </button>
              <button
                onClick={() => updateSetting('subtitleNaming', 'custom')}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  settings.subtitleNaming === 'custom'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                自定义
              </button>
            </div>

            {settings.subtitleNaming === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">自定义命名格式</label>
                <input
                  type="text"
                  value={settings.customNamePattern}
                  onChange={(e) => updateSetting('customNamePattern', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  placeholder="{name}_{lang}"
                />
                <p className="text-xs text-slate-500 mt-2">
                  可用变量: <span className="text-violet-400">{`{name}`}</span> - 文件名, 
                  <span className="text-violet-400">{`{lang}`}</span> - 语言代码, 
                  <span className="text-violet-400">{`{date}`}</span> - 日期
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            恢复默认设置
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings