import { useCallback, useState } from 'react'

export function useOpenApplications() {
  const [isListing, setIsListing] = useState(false)
  const [isFocusingMapleStory, setIsFocusingMapleStory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAvailable = typeof window.electronAPI !== 'undefined'

  const listOpenApplications = useCallback(async () => {
    if (!window.electronAPI) {
      setError('Listing applications requires the Electron app')
      return
    }

    setError(null)
    setIsListing(true)

    try {
      const names = await window.electronAPI.listOpenApplications()
      console.log('Open applications:')
      for (const name of names) {
        console.log(name)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to list open applications'
      setError(message)
      console.error(message)
    } finally {
      setIsListing(false)
    }
  }, [])

  const focusMapleStoryWorlds = useCallback(async () => {
    if (!window.electronAPI) {
      setError('Focusing applications requires the Electron app')
      return
    }

    setError(null)
    setIsFocusingMapleStory(true)

    try {
      await window.electronAPI.focusMapleStoryWorlds()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to focus MapleStory Worlds'
      setError(message)
      console.error(message)
    } finally {
      setIsFocusingMapleStory(false)
    }
  }, [])

  return {
    isAvailable,
    isListing,
    isFocusingMapleStory,
    error,
    listOpenApplications,
    focusMapleStoryWorlds,
  }
}
