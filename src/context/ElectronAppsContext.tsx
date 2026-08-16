import { createContext, useContext, type ReactNode } from 'react'
import { useOpenApplications } from '../hooks/useOpenApplications'

type ElectronAppsContextValue = ReturnType<typeof useOpenApplications>

const ElectronAppsContext = createContext<ElectronAppsContextValue | null>(
  null,
)

export function ElectronAppsProvider({ children }: { children: ReactNode }) {
  const value = useOpenApplications()

  return (
    <ElectronAppsContext.Provider value={value}>
      {children}
    </ElectronAppsContext.Provider>
  )
}

export function useElectronAppsContext(): ElectronAppsContextValue {
  const context = useContext(ElectronAppsContext)
  if (!context) {
    throw new Error(
      'useElectronAppsContext must be used within ElectronAppsProvider',
    )
  }
  return context
}
