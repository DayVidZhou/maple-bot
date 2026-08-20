import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_BOT_SETTINGS,
  normalizeBotSettings,
  type BotSettings,
} from '../types/botSettings'

interface LieDetectorTemplateInfo {
  hasTemplate: boolean
  width: number | null
  height: number | null
}

interface BotSettingsContextValue {
  settings: BotSettings
  templateInfo: LieDetectorTemplateInfo
  isLoaded: boolean
  isSaving: boolean
  updateSettings: (patch: Partial<BotSettings>) => void
  refreshTemplateInfo: () => Promise<void>
  pickTemplateImage: () => Promise<{ ok: boolean; message?: string }>
}

const BotSettingsContext = createContext<BotSettingsContextValue | null>(null)

const EMPTY_TEMPLATE_INFO: LieDetectorTemplateInfo = {
  hasTemplate: false,
  width: null,
  height: null,
}

export function BotSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_BOT_SETTINGS)
  const [templateInfo, setTemplateInfo] =
    useState<LieDetectorTemplateInfo>(EMPTY_TEMPLATE_INFO)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const refreshTemplateInfo = useCallback(async () => {
    if (!window.electronAPI?.getLieDetectorTemplateInfo) {
      setTemplateInfo(EMPTY_TEMPLATE_INFO)
      return
    }

    const info = await window.electronAPI.getLieDetectorTemplateInfo()
    setTemplateInfo(info)
  }, [])

  useEffect(() => {
    async function loadSettings() {
      if (!window.electronAPI?.loadBotSettings) {
        setIsLoaded(true)
        return
      }

      try {
        const loaded = await window.electronAPI.loadBotSettings()
        setSettings(normalizeBotSettings(loaded))
        await refreshTemplateInfo()
      } catch (error) {
        console.error('Failed to load bot settings:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    void loadSettings()
  }, [refreshTemplateInfo])

  useEffect(() => {
    if (!isLoaded || !window.electronAPI?.saveBotSettings) return

    setIsSaving(true)
    void window.electronAPI
      .saveBotSettings(settings)
      .catch((error) => {
        console.error('Failed to save bot settings:', error)
      })
      .finally(() => {
        setIsSaving(false)
      })
  }, [settings, isLoaded])

  const updateSettings = useCallback((patch: Partial<BotSettings>) => {
    setSettings((current) => normalizeBotSettings({ ...current, ...patch }))
  }, [])

  const pickTemplateImage = useCallback(async () => {
    if (!window.electronAPI?.pickLieDetectorTemplate) {
      return { ok: false, message: 'Template upload requires the Electron app.' }
    }

    const result = await window.electronAPI.pickLieDetectorTemplate()
    await refreshTemplateInfo()

    if (!result.ok) {
      return { ok: false, message: result.message ?? 'No template selected.' }
    }

    return { ok: true }
  }, [refreshTemplateInfo])

  const value = useMemo(
    () => ({
      settings,
      templateInfo,
      isLoaded,
      isSaving,
      updateSettings,
      refreshTemplateInfo,
      pickTemplateImage,
    }),
    [
      settings,
      templateInfo,
      isLoaded,
      isSaving,
      updateSettings,
      refreshTemplateInfo,
      pickTemplateImage,
    ],
  )

  return (
    <BotSettingsContext.Provider value={value}>
      {children}
    </BotSettingsContext.Provider>
  )
}

export function useBotSettingsContext(): BotSettingsContextValue {
  const context = useContext(BotSettingsContext)
  if (!context) {
    throw new Error(
      'useBotSettingsContext must be used within BotSettingsProvider',
    )
  }
  return context
}
