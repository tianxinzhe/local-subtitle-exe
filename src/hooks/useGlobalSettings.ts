import { useState, useEffect, useCallback } from 'react'

interface GlobalSettings {
  theme: 'dark' | 'light'
  language: string
}

const defaultSettings: GlobalSettings = {
  theme: 'dark',
  language: 'zh',
}

const STORAGE_KEY = 'lemon-subtitle-settings'

export function useGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) }
      } catch {
        return defaultSettings
      }
    }
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    document.documentElement.classList.toggle('light', settings.theme === 'light')
  }, [settings.theme])

  const updateTheme = useCallback((theme: 'dark' | 'light') => {
    setSettings(prev => ({ ...prev, theme }))
  }, [])

  const updateLanguage = useCallback((language: string) => {
    setSettings(prev => ({ ...prev, language }))
  }, [])

  return {
    settings,
    updateTheme,
    updateLanguage,
  }
}