import { useCallback, useState } from 'react'
import { useActivityLogOptional } from '../context/ActivityLogContext'

async function withKeyboard<T>(
  action: (api: NonNullable<Window['electronAPI']>) => Promise<T>,
  setError: (message: string | null) => void,
  setIsSending: (value: boolean) => void,
): Promise<T | undefined> {
  if (!window.electronAPI) {
    setError('Keyboard control requires the Electron app')
    return undefined
  }

  setError(null)
  setIsSending(true)

  try {
    return await action(window.electronAPI)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to send keyboard input'
    setError(message)
    return undefined
  } finally {
    setIsSending(false)
  }
}

export function useKeyboard() {
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const activityLog = useActivityLogOptional()

  const isAvailable = typeof window.electronAPI !== 'undefined'

  const tapKey = useCallback(
    async (key: string) => {
      const result = await withKeyboard(
        (api) => api.tapKey(key),
        setError,
        setIsSending,
      )
      if (result !== undefined) {
        activityLog?.logKeyboardEvent('tap', key)
      }
    },
    [activityLog],
  )

  const pressKey = useCallback(
    async (key: string) => {
      if (!window.electronAPI) {
        setError('Keyboard control requires the Electron app')
        return
      }

      setError(null)
      try {
        await window.electronAPI.pressKey(key)
        activityLog?.logKeyboardEvent('press', key)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to press key'
        setError(message)
      }
    },
    [activityLog],
  )

  const releaseKey = useCallback(
    async (key: string) => {
      if (!window.electronAPI) {
        setError('Keyboard control requires the Electron app')
        return
      }

      setError(null)
      try {
        await window.electronAPI.releaseKey(key)
        activityLog?.logKeyboardEvent('release', key)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to release key'
        setError(message)
      }
    },
    [activityLog],
  )

  const typeText = useCallback(async (text: string) => {
    await withKeyboard((api) => api.typeText(text), setError, setIsSending)
  }, [])

  return {
    isAvailable,
    isSending,
    error,
    tapKey,
    pressKey,
    releaseKey,
    typeText,
  }
}
