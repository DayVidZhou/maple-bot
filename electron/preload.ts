import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
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
})
