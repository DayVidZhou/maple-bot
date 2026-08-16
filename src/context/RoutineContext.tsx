import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useRoutine } from '../hooks/useRoutine'

type RoutineContextValue = ReturnType<typeof useRoutine> & {
  routinesOpen: boolean
  setRoutinesOpen: (open: boolean) => void
  openRoutines: () => void
}

const RoutineContext = createContext<RoutineContextValue | null>(null)

export function RoutineProvider({ children }: { children: ReactNode }) {
  const routineState = useRoutine()
  const [routinesOpen, setRoutinesOpen] = useState(false)

  const value: RoutineContextValue = {
    ...routineState,
    routinesOpen,
    setRoutinesOpen,
    openRoutines: () => setRoutinesOpen(true),
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
