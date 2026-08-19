import {
  createPlatformState,
  normalizeAppPlatform,
  type PlatformState,
} from '../types/platform'

function detectPlatformFromUserAgent(): string | undefined {
  if (typeof navigator === 'undefined') return undefined

  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()

  if (platform.includes('mac') || userAgent.includes('mac os')) {
    return 'darwin'
  }
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'win32'
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux'
  }

  return undefined
}

export function resolvePlatformState(): PlatformState {
  const fromElectron = window.electronAPI?.getPlatform?.()
  const platform = normalizeAppPlatform(
    fromElectron ?? detectPlatformFromUserAgent(),
  )
  return createPlatformState(platform)
}
