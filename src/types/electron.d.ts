import type { HotkeyListItem, RoutineListItem } from './registry'

export interface ElectronAPI {
  listOpenApplications: () => Promise<string[]>
  focusApplication: (name: string) => Promise<void>
  focusMapleStoryWorlds: () => Promise<void>
  loadRegistryRoutines: () => Promise<RoutineListItem[]>
  saveRegistryRoutines: (items: RoutineListItem[]) => Promise<{ savedAt: string }>
  loadRegistryHotkeys: () => Promise<HotkeyListItem[]>
  saveRegistryHotkeys: (items: HotkeyListItem[]) => Promise<{ savedAt: string }>
  tapKey: (key: string) => Promise<void>
  typeText: (text: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
