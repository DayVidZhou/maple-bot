import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  listOpenApplications: () => ipcRenderer.invoke('apps:list'),
  focusApplication: (name: string) => ipcRenderer.invoke('apps:focus', name),
  focusMapleStoryWorlds: () => ipcRenderer.invoke('apps:focus-maplestory'),
  tapKey: (key: string) => ipcRenderer.invoke('keyboard:tap', key),
  typeText: (text: string) => ipcRenderer.invoke('keyboard:type', text),
})
