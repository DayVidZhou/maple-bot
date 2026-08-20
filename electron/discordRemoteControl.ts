import type { BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'

export type DiscordRemoteAction = 'start-routine' | 'stop-routine'

export interface DiscordRemoteActionResult {
  ok: boolean
  message: string
}

interface PendingRequest {
  resolve: (result: DiscordRemoteActionResult) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

const REMOTE_ACTION_TIMEOUT_MS = 15_000

const pendingRequests = new Map<string, PendingRequest>()

export function resolveDiscordRemoteAction(
  requestId: string,
  result: DiscordRemoteActionResult,
): void {
  const entry = pendingRequests.get(requestId)
  if (!entry) return

  clearTimeout(entry.timeout)
  pendingRequests.delete(requestId)
  entry.resolve(result)
}

export function requestDiscordRemoteAction(
  window: BrowserWindow | null,
  action: DiscordRemoteAction,
): Promise<DiscordRemoteActionResult> {
  if (!window || window.isDestroyed()) {
    return Promise.resolve({
      ok: false,
      message: 'Maple Bot window is not open',
    })
  }

  return new Promise((resolve, reject) => {
    const requestId = randomUUID()
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('App did not respond — is Maple Bot running?'))
    }, REMOTE_ACTION_TIMEOUT_MS)

    pendingRequests.set(requestId, { resolve, reject, timeout })
    window.webContents.send('discord:remote-action', { requestId, action })
  })
}
