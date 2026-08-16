export interface ElectronAPI {
  listOpenApplications: () => Promise<string[]>
  focusApplication: (name: string) => Promise<void>
  focusMapleStoryWorlds: () => Promise<void>
  tapKey: (key: string) => Promise<void>
  typeText: (text: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
