/** Node/Electron process.platform values used by Maple Bot. */
export type AppPlatform = 'darwin' | 'win32' | 'linux' | 'unknown'

export interface PlatformState {
  platform: AppPlatform
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  isElectron: boolean
}

export function createPlatformState(platform: AppPlatform): PlatformState {
  return {
    platform,
    isMac: platform === 'darwin',
    isWindows: platform === 'win32',
    isLinux: platform === 'linux',
    isElectron: platform !== 'unknown',
  }
}

export function normalizeAppPlatform(value: string | undefined): AppPlatform {
  if (value === 'darwin' || value === 'win32' || value === 'linux') {
    return value
  }
  return 'unknown'
}
