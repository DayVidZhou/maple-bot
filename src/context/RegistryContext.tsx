import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useRegistryPersistence } from '../hooks/useRegistryPersistence'
import {
  HOTKEY_SAVE_FILE,
  ROUTINE_SAVE_FILE,
} from '../types/registrySave'
import {
  createId,
  type HotkeyListItem,
  type RoutineListItem,
} from '../types/registry'

interface RegistryContextValue {
  routines: RoutineListItem[]
  hotkeys: HotkeyListItem[]
  selectedRoutineId: string | null
  selectedHotkeyId: string | null
  lastSavedAt: string | null
  routineSaveFile: string
  hotkeySaveFile: string
  setSelectedRoutineId: (id: string | null) => void
  setSelectedHotkeyId: (id: string | null) => void
  addRoutine: (name: string) => void
  addHotkey: (hotkey: Omit<HotkeyListItem, 'id'>) => void
  removeSelectedRoutine: () => void
  removeSelectedHotkey: () => void
}

const RegistryContext = createContext<RegistryContextValue | null>(null)

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [hotkeys, setHotkeys] = useState<HotkeyListItem[]>([])
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  )
  const [selectedHotkeyId, setSelectedHotkeyId] = useState<string | null>(
    null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const handleLoad = useCallback(
    (data: { routines: RoutineListItem[]; hotkeys: HotkeyListItem[] }) => {
      setRoutines(data.routines)
      setHotkeys(
        data.hotkeys.map((hotkey) => ({
          ...hotkey,
          moves: hotkey.moves ?? [],
          buffs: hotkey.buffs ?? [],
        })),
      )
    },
    [],
  )

  useRegistryPersistence({
    routines,
    hotkeys,
    onLoad: handleLoad,
    onSavedAtChange: setLastSavedAt,
  })

  const addRoutine = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return

    const item: RoutineListItem = { id: createId(), name: trimmed }
    setRoutines((current) => [...current, item])
    setSelectedRoutineId(item.id)
  }, [])

  const addHotkey = useCallback((hotkey: Omit<HotkeyListItem, 'id'>) => {
    const trimmed = hotkey.name.trim()
    if (!trimmed) return

    const item: HotkeyListItem = {
      id: createId(),
      name: trimmed,
      moves: hotkey.moves,
      buffs: hotkey.buffs,
    }
    setHotkeys((current) => [...current, item])
    setSelectedHotkeyId(item.id)
  }, [])

  const removeSelectedRoutine = useCallback(() => {
    setRoutines((current) =>
      current.filter((item) => item.id !== selectedRoutineId),
    )
    setSelectedRoutineId(null)
  }, [selectedRoutineId])

  const removeSelectedHotkey = useCallback(() => {
    setHotkeys((current) =>
      current.filter((item) => item.id !== selectedHotkeyId),
    )
    setSelectedHotkeyId(null)
  }, [selectedHotkeyId])

  return (
    <RegistryContext.Provider
      value={{
        routines,
        hotkeys,
        selectedRoutineId,
        selectedHotkeyId,
        lastSavedAt,
        routineSaveFile: ROUTINE_SAVE_FILE,
        hotkeySaveFile: HOTKEY_SAVE_FILE,
        setSelectedRoutineId,
        setSelectedHotkeyId,
        addRoutine,
        addHotkey,
        removeSelectedRoutine,
        removeSelectedHotkey,
      }}
    >
      {children}
    </RegistryContext.Provider>
  )
}

export function useRegistryContext(): RegistryContextValue {
  const context = useContext(RegistryContext)
  if (!context) {
    throw new Error('useRegistryContext must be used within RegistryProvider')
  }
  return context
}
