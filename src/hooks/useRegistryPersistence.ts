import { useEffect, useState } from 'react'
import type { HotkeyListItem, RoutineListItem } from '../types/registry'

interface UseRegistryPersistenceOptions {
  routines: RoutineListItem[]
  hotkeys: HotkeyListItem[]
  onLoad: (data: {
    routines: RoutineListItem[]
    hotkeys: HotkeyListItem[]
  }) => void
  onSavedAtChange: (savedAt: string | null) => void
}

export function useRegistryPersistence({
  routines,
  hotkeys,
  onLoad,
  onSavedAtChange,
}: UseRegistryPersistenceOptions) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function loadSavedRegistry() {
      if (!window.electronAPI) {
        setIsLoaded(true)
        return
      }

      try {
        const [loadedRoutines, loadedHotkeys] = await Promise.all([
          window.electronAPI.loadRegistryRoutines(),
          window.electronAPI.loadRegistryHotkeys(),
        ])

        onLoad({ routines: loadedRoutines, hotkeys: loadedHotkeys })
      } catch (error) {
        console.error('Failed to load registry save files:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    void loadSavedRegistry()
  }, [onLoad])

  useEffect(() => {
    if (!isLoaded || !window.electronAPI) return

    void window.electronAPI
      .saveRegistryRoutines(routines)
      .then((result) => onSavedAtChange(result.savedAt))
      .catch((error) => {
        console.error('Failed to save routine list:', error)
      })
  }, [routines, isLoaded, onSavedAtChange])

  useEffect(() => {
    if (!isLoaded || !window.electronAPI) return

    void window.electronAPI
      .saveRegistryHotkeys(hotkeys)
      .then((result) => onSavedAtChange(result.savedAt))
      .catch((error) => {
        console.error('Failed to save hotkey list:', error)
      })
  }, [hotkeys, isLoaded, onSavedAtChange])
}
