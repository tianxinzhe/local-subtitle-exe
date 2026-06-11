export interface SystemInfo {
  gpu_available: boolean
  gpu_name: string
  cpu_cores: number
  thread_pool_size: number
}

export interface Task {
  id: string
  filename: string
  fileSize: string
  originalPath: string
  status: 'pending' | 'extracting' | 'transcribing' | 'translating' | 'completed' | 'error'
  progress: number
  eta: string | null
  error?: string
  outputPaths?: {
    audio?: string
    subtitle?: string
    translatedSubtitle?: string
    bilingualSubtitle?: string
  }
}

export interface SubtitleRow {
  id: number
  startTime: string
  endTime: string
  originalText: string
  translatedText: string
}

export interface GlobalConfig {
  language: string
  precisionMode: boolean
  translationModel: string
  outputDir: string
  extractAudio: boolean
  extractSubtitle: boolean
  translateSubtitle: boolean
}

export interface StoragePaths {
  sourceFiles: string
  audioOutput: string
  subtitleOutput: string
  translatedSubtitleOutput: string
  bilingualSubtitleOutput: string
  subtitleNaming: 'original' | 'language' | 'custom'
  customNamePattern: string
}

export type ExportMode = 'original' | 'translated' | 'bilingual'

export type ExportFormat = 'srt' | 'vtt'