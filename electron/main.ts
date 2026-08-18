import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  focusApplication,
  getOpenApplicationNames,
  isApplicationFocused,
  MAPLESTORY_WORLDS_APP_NAME,
} from './apps'
import { pressKey, releaseKey, tapKey, typeText } from './keyboard'
import { createRegistrySaveHandlers } from './registrySave'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep timers and capture processing alive while MapleStory has focus.
      backgroundThrottling: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function registerDisplayMediaHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      callback({})
    },
    { useSystemPicker: true },
  )
}

function registerIpcHandlers() {
  const registrySave = createRegistrySaveHandlers(process.env.APP_ROOT!)

  ipcMain.handle('registry:load-routines', () => registrySave.loadRoutines())

  ipcMain.handle('registry:save-routines', (_event, items) =>
    registrySave.saveRoutines(items),
  )

  ipcMain.handle('registry:load-hotkeys', () => registrySave.loadHotkeys())

  ipcMain.handle('registry:save-hotkeys', (_event, items) =>
    registrySave.saveHotkeys(items),
  )

  ipcMain.handle('registry:load-minimaps', () => registrySave.loadMinimaps())

  ipcMain.handle('registry:save-minimaps', (_event, items) =>
    registrySave.saveMinimaps(items),
  )

  ipcMain.handle('apps:list', async () => {
    const names = await getOpenApplicationNames()
    console.log('Open applications:')
    for (const name of names) {
      console.log(name)
    }
    return names
  })

  ipcMain.handle('apps:focus', async (_event, name: string) => {
    await focusApplication(name)
  })

  ipcMain.handle('apps:focus-maplestory', async () => {
    await focusApplication(MAPLESTORY_WORLDS_APP_NAME)
  })

  ipcMain.handle('apps:is-maplestory-focused', async () => {
    return isApplicationFocused(MAPLESTORY_WORLDS_APP_NAME)
  })

  ipcMain.handle('keyboard:press', async (_event, key: string) => {
    await pressKey(key)
  })

  ipcMain.handle('keyboard:release', async (_event, key: string) => {
    await releaseKey(key)
  })

  ipcMain.handle('keyboard:tap', async (_event, key: string) => {
    await tapKey(key)
  })

  ipcMain.handle('keyboard:type', async (_event, text: string) => {
    await typeText(text)
  })
}

app.whenReady().then(() => {
  registerDisplayMediaHandler()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
