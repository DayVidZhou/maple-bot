import type { ReactNode } from 'react'
import { ElectronAppsProvider } from './ElectronAppsContext'
import { FocusRegionProvider } from './FocusRegionContext'
import { RoutineProvider } from './RoutineContext'
import { ScreenCaptureProvider } from './ScreenCaptureContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ScreenCaptureProvider>
      <FocusRegionProvider>
        <ElectronAppsProvider>
          <RoutineProvider>{children}</RoutineProvider>
        </ElectronAppsProvider>
      </FocusRegionProvider>
    </ScreenCaptureProvider>
  )
}
