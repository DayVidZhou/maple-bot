import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { PlatformState } from '../types/platform'
import { resolvePlatformState } from '../utils/resolvePlatform'

const PlatformContext = createContext<PlatformState | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => resolvePlatformState(), [])

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatformContext(): PlatformState {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatformContext must be used within PlatformProvider')
  }
  return context
}
