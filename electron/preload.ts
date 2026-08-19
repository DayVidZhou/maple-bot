import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => process.platform,
  listOpenApplications: () => ipcRenderer.invoke('apps:list'),
  focusApplication: (name: string) => ipcRenderer.invoke('apps:focus', name),
  focusMapleStoryWorlds: () => ipcRenderer.invoke('apps:focus-maplestory'),
  isMapleStoryWorldsFocused: () =>
    ipcRenderer.invoke('apps:is-maplestory-focused'),
  loadRegistryRoutines: () => ipcRenderer.invoke('registry:load-routines'),
  saveRegistryRoutines: (items: unknown) =>
    ipcRenderer.invoke('registry:save-routines', items),
  loadRegistryHotkeys: () => ipcRenderer.invoke('registry:load-hotkeys'),
  saveRegistryHotkeys: (items: unknown) =>
    ipcRenderer.invoke('registry:save-hotkeys', items),
  loadRegistryMinimaps: () => ipcRenderer.invoke('registry:load-minimaps'),
  saveRegistryMinimaps: (items: unknown) =>
    ipcRenderer.invoke('registry:save-minimaps', items),
  pressKey: (key: string) => ipcRenderer.invoke('keyboard:press', key),
  releaseKey: (key: string) => ipcRenderer.invoke('keyboard:release', key),
  tapKey: (key: string) => ipcRenderer.invoke('keyboard:tap', key),
  typeText: (text: string) => ipcRenderer.invoke('keyboard:type', text),
  reportDiscordStatus: (patch: {
    captureActive?: boolean
    routineRunning?: boolean
    routineName?: string | null
    routineStatus?: string | null
    routinePointIndex?: number | null
    userCoords?: string | null
  }) => {
    ipcRenderer.send('discord:report-status', patch)
  },
  sendDiscordScreenshot: (routineName?: string) =>
    ipcRenderer.invoke('discord:send-screenshot', routineName),
  sendDiscordTestMessage: () => ipcRenderer.invoke('discord:send-test-message'),
  getDiscordStatus: () => ipcRenderer.invoke('discord:get-status'),
  getDiscordConfig: () => ipcRenderer.invoke('discord:get-config'),
  saveDiscordConfig: (config: {
    token: string
    clientId: string
    ownerId: string
  }) => ipcRenderer.invoke('discord:save-config', config),
})
