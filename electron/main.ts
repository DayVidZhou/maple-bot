import './env'
import { app, BrowserWindow, desktopCapturer, ipcMain, session } from 'electron'
import type { DesktopCapturerSource } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  focusApplication,
  getOpenApplicationNames,
  isApplicationFocused,
  MAPLESTORY_WORLDS_APP_NAME,
} from './apps'
import { updateAppDiscordStatus } from './appStatus'
import {
  startDiscordBot,
  stopDiscordBot,
  sendOwnerScreenshotDm,
  sendOwnerTestMessageDm,
  getDiscordConnectionStatus,
} from './discordBot'
import {
  loadEnvFile,
  readDiscordConfigFile,
  saveDiscordConfig,
  type DiscordEnvConfig,
} from './discordConfig'
import { pressKey, releaseKey, tapKey, typeText } from './keyboard'
import { createRegistrySaveHandlers } from './registrySave'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let mainWindow: BrowserWindow | null = null
let discordClient: Awaited<ReturnType<typeof startDiscordBot>> = null

async function restartDiscordBot(): Promise<void> {
  console.log('[discord] Restarting bot after config change')
  await stopDiscordBot(discordClient)
  discordClient = null
  await loadEnvFile()
  discordClient = await startDiscordBot({
    getPlatform: () => process.platform,
  })
  console.log('[discord] Bot restart finished', {
    connected: discordClient?.isReady?.() ?? false,
  })
}

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

async function pickDesktopCaptureSource(): Promise<DesktopCapturerSource | null> {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    fetchWindowIcons: false,
    thumbnailSize: { width: 0, height: 0 },
  })

  if (sources.length === 0) return null

  const mapleStory = sources.find((source) =>
    source.name.toLowerCase().includes('maplestory'),
  )
  if (mapleStory) return mapleStory

  return (
    sources.find((source) => source.id.startsWith('screen:')) ?? sources[0]
  )
}

function registerDisplayMediaHandler() {
  if (process.platform === 'darwin') {
    session.defaultSession.setDisplayMediaRequestHandler(
      (_request, callback) => {
        callback({})
      },
      { useSystemPicker: true },
    )
    return
  }

  // Windows/Linux: useSystemPicker + callback({}) often yields no video stream.
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    void pickDesktopCaptureSource()
      .then((source) => {
        if (source) {
          callback({ video: source })
          return
        }
        console.warn('No desktop capture sources available')
        callback({})
      })
      .catch((err) => {
        console.error('Desktop capture source lookup failed:', err)
        callback({})
      })
  })
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

  ipcMain.on('discord:report-status', (_event, patch) => {
    updateAppDiscordStatus(patch)
  })

  ipcMain.handle(
    'discord:send-screenshot',
    async (_event, routineName?: string) => {
      console.log('[discord] IPC send-screenshot', {
        routineName: typeof routineName === 'string' ? routineName : null,
      })
      try {
        await sendOwnerScreenshotDm(
          typeof routineName === 'string' ? routineName : undefined,
        )
      } catch (err) {
        console.error('[discord] IPC send-screenshot failed', err)
        throw err
      }
    },
  )

  ipcMain.handle('discord:send-test-message', async () => {
    console.log('[discord] IPC send-test-message')
    try {
      await sendOwnerTestMessageDm()
    } catch (err) {
      console.error('[discord] IPC send-test-message failed', err)
      throw err
    }
  })

  ipcMain.handle('discord:get-status', () => {
    const status = getDiscordConnectionStatus()
    console.log('[discord] IPC get-status', status)
    return status
  })

  ipcMain.handle('discord:get-config', async () => readDiscordConfigFile())

  ipcMain.handle('discord:save-config', async (_event, config: DiscordEnvConfig) => {
    console.log('[discord] IPC save-config', {
      hasToken: Boolean(config.token?.trim()),
      hasClientId: Boolean(config.clientId?.trim()),
      hasOwnerId: Boolean(config.ownerId?.trim()),
    })
    await saveDiscordConfig(config)
    await restartDiscordBot()
    return getDiscordConnectionStatus()
  })
}

app.whenReady().then(async () => {
  registerDisplayMediaHandler()
  registerIpcHandlers()
  createWindow()
  console.log('[discord] Launching bot from app ready')
  discordClient = await startDiscordBot({
    getPlatform: () => process.platform,
  })
  console.log('[discord] Bot launch finished', {
    connected: discordClient?.isReady?.() ?? false,
  })

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

app.on('before-quit', () => {
  void stopDiscordBot(discordClient)
})
