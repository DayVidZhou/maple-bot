import { createContext, useContext, type ReactNode } from 'react'
import type { FocusRegionSize } from '../types/focusRegion'
import { useRegistryContext } from './RegistryContext'

interface FocusRegionContextValue {
  focusSize: FocusRegionSize
  setFocusSize: (size: FocusRegionSize) => void
  selectedMinimapProfileId: string | null
}

const FocusRegionContext = createContext<FocusRegionContextValue | null>(null)

export function FocusRegionProvider({ children }: { children: ReactNode }) {
  const { focusSize, setFocusSize, selectedMinimapProfileId } =
    useRegistryContext()

  return (
    <FocusRegionContext.Provider
      value={{ focusSize, setFocusSize, selectedMinimapProfileId }}
    >
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
