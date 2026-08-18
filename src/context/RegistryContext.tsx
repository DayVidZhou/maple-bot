import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRegistryPersistence } from '../hooks/useRegistryPersistence'
import {
  HOTKEY_SAVE_FILE,
  MINIMAP_SAVE_FILE,
  ROUTINE_SAVE_FILE,
} from '../types/registrySave'
import {
  DEFAULT_FOCUS_SIZE,
  type FocusRegionSize,
} from '../types/focusRegion'
import {
  createId,
  defaultRegistryName,
  type HotkeyListItem,
  type MinimapProfileListItem,
  type RoutineListItem,
} from '../types/registry'
import { normalizeRoutineListItem } from '../types/routine'
import { normalizeHotkeyListItem } from '../types/hotkey'
import {
  clampFocusRegionSize,
  createMinimapProfile,
  normalizeMinimapProfile,
} from '../utils/minimapProfile'

interface RegistryContextValue {
  routines: RoutineListItem[]
  hotkeys: HotkeyListItem[]
  minimapProfiles: MinimapProfileListItem[]
  selectedRoutineId: string | null
  selectedHotkeyId: string | null
  selectedMinimapProfileId: string | null
  focusSize: FocusRegionSize
  lastSavedAt: string | null
  routineSaveFile: string
  hotkeySaveFile: string
  minimapSaveFile: string
  setSelectedRoutineId: (id: string | null) => void
  setSelectedHotkeyId: (id: string | null) => void
  setSelectedMinimapProfileId: (id: string | null) => void
  setFocusSize: (size: FocusRegionSize) => void
  addRoutine: (routine: Omit<RoutineListItem, 'id'>) => void
  updateRoutine: (id: string, routine: Omit<RoutineListItem, 'id'>) => void
  addHotkey: (hotkey: Omit<HotkeyListItem, 'id'>) => void
  updateHotkey: (id: string, hotkey: Omit<HotkeyListItem, 'id'>) => void
  addMinimapProfile: (name: string) => void
  removeSelectedRoutine: () => void
  removeSelectedHotkey: () => void
  removeSelectedMinimapProfile: () => void
}

const RegistryContext = createContext<RegistryContextValue | null>(null)

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [hotkeys, setHotkeys] = useState<HotkeyListItem[]>([])
  const [minimapProfiles, setMinimapProfiles] = useState<MinimapProfileListItem[]>(
    [],
  )
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  )
  const [selectedHotkeyId, setSelectedHotkeyId] = useState<string | null>(
    null,
  )
  const [selectedMinimapProfileId, setSelectedMinimapProfileId] = useState<
    string | null
  >(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const focusSize = useMemo(() => {
    const profile = minimapProfiles.find(
      (item) => item.id === selectedMinimapProfileId,
    )
    if (!profile) return DEFAULT_FOCUS_SIZE

    return {
      widthPercent: profile.widthPercent,
      heightPercent: profile.heightPercent,
    }
  }, [minimapProfiles, selectedMinimapProfileId])

  const handleLoad = useCallback(
    (data: {
      routines: RoutineListItem[]
      hotkeys: HotkeyListItem[]
      minimapProfiles: MinimapProfileListItem[]
    }) => {
      const loadedRoutines = data.routines.map((routine) =>
        normalizeRoutineListItem(routine),
      )
      const loadedHotkeys = data.hotkeys.map((hotkey) =>
        normalizeHotkeyListItem(hotkey),
      )

      setRoutines(loadedRoutines)
      setHotkeys(loadedHotkeys)
      setSelectedRoutineId(loadedRoutines[0]?.id ?? null)
      setSelectedHotkeyId(loadedHotkeys[0]?.id ?? null)

      const loadedProfiles = data.minimapProfiles.map(normalizeMinimapProfile)
      const profiles =
        loadedProfiles.length > 0
          ? loadedProfiles
          : [createMinimapProfile(defaultRegistryName('minimap', 0))]

      setMinimapProfiles(profiles)
      setSelectedMinimapProfileId(profiles[0]?.id ?? null)
    },
    [],
  )

  useRegistryPersistence({
    routines,
    hotkeys,
    minimapProfiles,
    onLoad: handleLoad,
    onSavedAtChange: setLastSavedAt,
  })

  const setFocusSize = useCallback(
    (size: FocusRegionSize) => {
      if (!selectedMinimapProfileId) return

      const next = clampFocusRegionSize(size)
      setMinimapProfiles((current) =>
        current.map((profile) =>
          profile.id === selectedMinimapProfileId
            ? {
                ...profile,
                widthPercent: next.widthPercent,
                heightPercent: next.heightPercent,
              }
            : profile,
        ),
      )
    },
    [selectedMinimapProfileId],
  )

  const addRoutine = useCallback((routine: Omit<RoutineListItem, 'id'>) => {
    const trimmed = routine.name.trim()
    if (!trimmed) return

    const item: RoutineListItem = {
      id: createId(),
      name: trimmed,
      hotkeyProfileId: routine.hotkeyProfileId,
      points: routine.points,
    }
    setRoutines((current) => [...current, item])
    setSelectedRoutineId(item.id)
  }, [])

  const updateRoutine = useCallback(
    (id: string, routine: Omit<RoutineListItem, 'id'>) => {
      const trimmed = routine.name.trim()
      if (!trimmed) return

      setRoutines((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                name: trimmed,
                hotkeyProfileId: routine.hotkeyProfileId,
                points: routine.points,
              }
            : item,
        ),
      )
      setSelectedRoutineId(id)
    },
    [],
  )

  const addHotkey = useCallback((hotkey: Omit<HotkeyListItem, 'id'>) => {
    const trimmed = hotkey.name.trim()
    if (!trimmed) return

    const item: HotkeyListItem = {
      id: createId(),
      name: trimmed,
      moves: hotkey.moves,
      buffs: hotkey.buffs,
      attacks: hotkey.attacks,
    }
    setHotkeys((current) => [...current, item])
    setSelectedHotkeyId(item.id)
  }, [])

  const updateHotkey = useCallback(
    (id: string, hotkey: Omit<HotkeyListItem, 'id'>) => {
      const trimmed = hotkey.name.trim()
      if (!trimmed) return

      setHotkeys((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                name: trimmed,
                moves: hotkey.moves,
                buffs: hotkey.buffs,
                attacks: hotkey.attacks,
              }
            : item,
        ),
      )
      setSelectedHotkeyId(id)
    },
    [],
  )

  const addMinimapProfile = useCallback(
    (name: string) => {
      const item = createMinimapProfile(name, focusSize)
      setMinimapProfiles((current) => [...current, item])
      setSelectedMinimapProfileId(item.id)
    },
    [focusSize],
  )

  const removeSelectedRoutine = useCallback(() => {
    if (!selectedRoutineId) return

    setRoutines((current) => {
      const index = current.findIndex((item) => item.id === selectedRoutineId)
      if (index === -1) return current

      const next = current.filter((item) => item.id !== selectedRoutineId)
      const fallback =
        next[Math.min(index, next.length - 1)]?.id ?? next[0]?.id ?? null
      setSelectedRoutineId(fallback)
      return next
    })
  }, [selectedRoutineId])

  const removeSelectedHotkey = useCallback(() => {
    if (!selectedHotkeyId) return

    setHotkeys((current) => {
      const index = current.findIndex((item) => item.id === selectedHotkeyId)
      if (index === -1) return current

      const next = current.filter((item) => item.id !== selectedHotkeyId)
      const fallback =
        next[Math.min(index, next.length - 1)]?.id ?? next[0]?.id ?? null
      setSelectedHotkeyId(fallback)
      return next
    })
  }, [selectedHotkeyId])

  const removeSelectedMinimapProfile = useCallback(() => {
    if (!selectedMinimapProfileId) return

    setMinimapProfiles((current) => {
      const index = current.findIndex(
        (item) => item.id === selectedMinimapProfileId,
      )
      if (index === -1) return current

      const next = current.filter((item) => item.id !== selectedMinimapProfileId)
      const fallback =
        next[Math.min(index, next.length - 1)]?.id ?? next[0]?.id ?? null
      setSelectedMinimapProfileId(fallback)
      return next
    })
  }, [selectedMinimapProfileId])

  return (
    <RegistryContext.Provider
      value={{
        routines,
        hotkeys,
        minimapProfiles,
        selectedRoutineId,
        selectedHotkeyId,
        selectedMinimapProfileId,
        focusSize,
        lastSavedAt,
        routineSaveFile: ROUTINE_SAVE_FILE,
        hotkeySaveFile: HOTKEY_SAVE_FILE,
        minimapSaveFile: MINIMAP_SAVE_FILE,
        setSelectedRoutineId,
        setSelectedHotkeyId,
        setSelectedMinimapProfileId,
        setFocusSize,
        addRoutine,
        updateRoutine,
        addHotkey,
        updateHotkey,
        addMinimapProfile,
        removeSelectedRoutine,
        removeSelectedHotkey,
        removeSelectedMinimapProfile,
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
