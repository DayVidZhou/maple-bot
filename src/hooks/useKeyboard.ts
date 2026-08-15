import { useCallback, useState } from 'react'

export function useKeyboard() {
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const isAvailable = typeof window.electronAPI !== 'undefined'

  const tapKey = useCallback(async (key: string) => {
    if (!window.electronAPI) {
      setError('Keyboard control requires the Electron app')
      return
    }

    setError(null)
    setIsSending(true)

    try {
      await window.electronAPI.tapKey(key)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send key press'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }, [])

  const typeText = useCallback(async (text: string) => {
    if (!window.electronAPI) {
      setError('Keyboard control requires the Electron app')
      return
    }

    setError(null)
    setIsSending(true)

    try {
      await window.electronAPI.typeText(text)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to type text'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }, [])

  return {
    isAvailable,
    isSending,
    error,
    tapKey,
    typeText,
  }
}
