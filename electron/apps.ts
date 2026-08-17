import { desktopCapturer } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const MAPLESTORY_WORLDS_APP_NAME = 'MapleStory Worlds'

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function getOpenApplicationNames(): Promise<string[]> {
  if (process.platform === 'darwin') {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      'tell application "System Events" to get name of every application process whose visible is true',
    ])
    return stdout.trim().split(', ').filter(Boolean)
  }

  const sources = await desktopCapturer.getSources({
    types: ['window'],
    fetchWindowIcons: false,
  })
  return sources.map((source) => source.name).filter(Boolean)
}

export async function focusApplication(name: string): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('Focusing applications is only supported on macOS')
  }

  const escapedName = escapeAppleScriptString(name)
  await execFileAsync('osascript', [
    '-e',
    `tell application "${escapedName}" to activate`,
  ])
}

export async function getFrontmostApplicationName(): Promise<string | null> {
  if (process.platform !== 'darwin') {
    return null
  }

  const { stdout } = await execFileAsync('osascript', [
    '-e',
    'tell application "System Events" to get name of first application process whose frontmost is true',
  ])

  const name = stdout.trim()
  return name || null
}

export async function isApplicationFocused(name: string): Promise<boolean> {
  const frontmost = await getFrontmostApplicationName()
  return frontmost === name
}
