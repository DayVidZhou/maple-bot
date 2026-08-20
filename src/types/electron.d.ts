import type { HotkeyListItem, MinimapProfileListItem, RoutineListItem } from './registry'

export interface ElectronAPI {
  getPlatform: () => NodeJS.Platform
  listOpenApplications: () => Promise<string[]>
  focusApplication: (name: string) => Promise<void>
  focusMapleStoryWorlds: () => Promise<void>
  isMapleStoryWorldsFocused: () => Promise<boolean>
  pressKey: (key: string) => Promise<void>
  releaseKey: (key: string) => Promise<void>
  loadRegistryRoutines: () => Promise<RoutineListItem[]>
  saveRegistryRoutines: (items: RoutineListItem[]) => Promise<{ savedAt: string }>
  loadRegistryHotkeys: () => Promise<HotkeyListItem[]>
  saveRegistryHotkeys: (items: HotkeyListItem[]) => Promise<{ savedAt: string }>
  loadRegistryMinimaps: () => Promise<MinimapProfileListItem[]>
  saveRegistryMinimaps: (
    items: MinimapProfileListItem[],
  ) => Promise<{ savedAt: string }>
  tapKey: (key: string) => Promise<void>
  typeText: (text: string) => Promise<void>
  reportDiscordStatus: (patch: {
    captureActive?: boolean
    routineRunning?: boolean
    routineName?: string | null
    routineStatus?: string | null
    routinePointIndex?: number | null
    userCoords?: string | null
  }) => void
  onDiscordRemoteAction: (
    handler: (payload: {
      requestId: string
      action: 'start-routine' | 'stop-routine' | 'keypress'
      payload?: { key?: string }
    }) => void | Promise<void>,
  ) => (() => void) | undefined
  reportDiscordRemoteActionResult: (payload: {
    requestId: string
    ok: boolean
    message: string
  }) => void
  sendDiscordScreenshot: (routineName?: string) => Promise<void>
  sendDiscordTestMessage: () => Promise<void>
  getDiscordStatus: () => Promise<{
    enabled: boolean
    connected: boolean
    botTag: string | null
    hasToken: boolean
    hasClientId: boolean
    hasOwnerId: boolean
  }>
  getDiscordConfig: () => Promise<{
    token: string
    clientId: string
    ownerId: string
  }>
  saveDiscordConfig: (config: {
    token: string
    clientId: string
    ownerId: string
  }) => Promise<{
    enabled: boolean
    connected: boolean
    botTag: string | null
    hasToken: boolean
    hasClientId: boolean
    hasOwnerId: boolean
  }>
  loadBotSettings: () => Promise<import('./botSettings').BotSettings>
  saveBotSettings: (
    settings: import('./botSettings').BotSettings,
  ) => Promise<{ savedAt: string }>
  getLieDetectorTemplateInfo: () => Promise<{
    hasTemplate: boolean
    width: number | null
    height: number | null
  }>
  getLieDetectorTemplateDataUrl: () => Promise<string | null>
  pickLieDetectorTemplate: () => Promise<{
    ok: boolean
    width: number | null
    height: number | null
    message?: string
  }>
  sendLieDetectorAlert: (matchScore?: number) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
