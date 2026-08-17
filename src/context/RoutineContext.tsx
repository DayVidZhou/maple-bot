import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useRoutine } from '../hooks/useRoutine'
import type { RoutineListItem } from '../types/registry'

type RoutineHookValue = ReturnType<typeof useRoutine>

type RoutineContextValue = RoutineHookValue & {
  routinesOpen: boolean
  editingRoutineId: string | null
  setRoutinesOpen: (open: boolean) => void
  openRoutines: () => void
  startNewRoutineDraft: (name: string) => void
  startEditRoutineDraft: (routine: RoutineListItem) => void
  discardDraft: () => void
  markDraftSaved: () => void
}

const RoutineContext = createContext<RoutineContextValue | null>(null)

export function RoutineProvider({ children }: { children: ReactNode }) {
  const {
    resetRoutine,
    startNewRoutine,
    loadRoutine,
    ...routineState
  } = useRoutine()
  const [routinesOpen, setRoutinesOpenState] = useState(false)
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)

  const closeEditor = useCallback(() => {
    resetRoutine()
    setEditingRoutineId(null)
  }, [resetRoutine])

  const setRoutinesOpen = useCallback(
    (open: boolean) => {
      if (!open) closeEditor()
      setRoutinesOpenState(open)
    },
    [closeEditor],
  )

  const startNewRoutineDraft = useCallback(
    (name: string) => {
      startNewRoutine(name)
      setEditingRoutineId(null)
      setRoutinesOpenState(true)
    },
    [startNewRoutine],
  )

  const startEditRoutineDraft = useCallback(
    (routine: RoutineListItem) => {
      loadRoutine({
        ...routine,
        points: routine.points ?? [],
        moves: routine.moves ?? [],
      })
      setEditingRoutineId(routine.id)
      setRoutinesOpenState(true)
    },
    [loadRoutine],
  )

  const discardDraft = useCallback(() => {
    closeEditor()
  }, [closeEditor])

  const markDraftSaved = useCallback(() => {
    setEditingRoutineId(null)
  }, [])

  const value: RoutineContextValue = {
    ...routineState,
    resetRoutine,
    startNewRoutine,
    loadRoutine,
    routinesOpen,
    editingRoutineId,
    setRoutinesOpen,
    openRoutines: () => setRoutinesOpenState(true),
    startNewRoutineDraft,
    startEditRoutineDraft,
    discardDraft,
    markDraftSaved,
  }

  return (
    <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>
  )
}

export function useRoutineContext(): RoutineContextValue {
  const context = useContext(RoutineContext)
  if (!context) {
    throw new Error('useRoutineContext must be used within RoutineProvider')
  }
  return context
}
