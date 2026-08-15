export interface ElectronAPI {
  tapKey: (key: string) => Promise<void>
  typeText: (text: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
