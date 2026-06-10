import { invoke } from '@tauri-apps/api/core'
import type { SystemInfo } from '../types'

export const useTauri = () => {
  const getSystemInfo = async (): Promise<SystemInfo> => {
    return invoke<SystemInfo>('get_system_info')
  }

  const extractAudio = async (inputPath: string, outputPath: string): Promise<string> => {
    return invoke<string>('extract_audio', { inputPath, outputPath })
  }

  const transcribeAudio = async (
    audioPath: string,
    language: string,
    precisionMode: boolean
  ): Promise<{ success: boolean; content: string; error?: string }> => {
    return invoke('transcribe_audio', { audioPath, language, precisionMode })
  }

  const translateSubtitle = async (
    content: string,
    srcLang: string,
    targetLang: string
  ): Promise<{ success: boolean; content: string; error?: string }> => {
    return invoke('translate_subtitle', { content, srcLang, targetLang })
  }

  const downloadModel = async (modelName: string): Promise<void> => {
    return invoke('download_model', { modelName })
  }

  return {
    getSystemInfo,
    extractAudio,
    transcribeAudio,
    translateSubtitle,
    downloadModel,
  }
}