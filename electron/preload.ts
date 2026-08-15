import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  tapKey: (key: string) => ipcRenderer.invoke('keyboard:tap', key),
  typeText: (text: string) => ipcRenderer.invoke('keyboard:type', text),
})
