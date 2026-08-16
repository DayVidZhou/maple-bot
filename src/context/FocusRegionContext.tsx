import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  DEFAULT_FOCUS_SIZE,
  type FocusRegionSize,
} from '../types/focusRegion'

interface FocusRegionContextValue {
  focusSize: FocusRegionSize
  setFocusSize: (size: FocusRegionSize) => void
}

const FocusRegionContext = createContext<FocusRegionContextValue | null>(null)

export function FocusRegionProvider({ children }: { children: ReactNode }) {
  const [focusSize, setFocusSize] =
    useState<FocusRegionSize>(DEFAULT_FOCUS_SIZE)

  return (
    <FocusRegionContext.Provider value={{ focusSize, setFocusSize }}>
      {children}
    </FocusRegionContext.Provider>
  )
}

export function useFocusRegionContext(): FocusRegionContextValue {
  const context = useContext(FocusRegionContext)
  if (!context) {
    throw new Error(
      'useFocusRegionContext must be used within FocusRegionProvider',
    )
  }
  return context
}
