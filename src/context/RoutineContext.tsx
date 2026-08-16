import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useRoutine } from '../hooks/useRoutine'

type RoutineHookValue = ReturnType<typeof useRoutine>

type RoutineContextValue = RoutineHookValue & {
  routinesOpen: boolean
  isDraft: boolean
  setRoutinesOpen: (open: boolean) => void
  openRoutines: () => void
  startNewRoutineDraft: (name: string) => void
  discardDraft: () => void
  markDraftSaved: () => void
}

const RoutineContext = createContext<RoutineContextValue | null>(null)

export function RoutineProvider({ children }: { children: ReactNode }) {
  const {
    resetRoutine,
    startNewRoutine,
    ...routineState
  } = useRoutine()
  const [routinesOpen, setRoutinesOpenState] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const setRoutinesOpen = useCallback(
    (open: boolean) => {
      if (!open && isDraft) {
        resetRoutine()
        setIsDraft(false)
      }
      setRoutinesOpenState(open)
    },
    [isDraft, resetRoutine],
  )

  const startNewRoutineDraft = useCallback(
    (name: string) => {
      startNewRoutine(name)
      setIsDraft(true)
      setRoutinesOpenState(true)
    },
    [startNewRoutine],
  )

  const discardDraft = useCallback(() => {
    resetRoutine()
    setIsDraft(false)
  }, [resetRoutine])

  const markDraftSaved = useCallback(() => {
    setIsDraft(false)
  }, [])

  const value: RoutineContextValue = {
    ...routineState,
    resetRoutine,
    startNewRoutine,
    routinesOpen,
    isDraft,
    setRoutinesOpen,
    openRoutines: () => setRoutinesOpenState(true),
    startNewRoutineDraft,
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
