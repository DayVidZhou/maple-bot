import type { ReactNode } from 'react'
import { ElectronAppsProvider } from './ElectronAppsContext'
import { FocusRegionProvider } from './FocusRegionContext'
import { RegistryProvider } from './RegistryContext'
import { HotkeyProvider } from './HotkeyContext'
import { RoutineProvider } from './RoutineContext'
import { ScreenCaptureProvider } from './ScreenCaptureContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ScreenCaptureProvider>
      <FocusRegionProvider>
        <ElectronAppsProvider>
          <RegistryProvider>
            <HotkeyProvider>
              <RoutineProvider>{children}</RoutineProvider>
            </HotkeyProvider>
          </RegistryProvider>
        </ElectronAppsProvider>
      </FocusRegionProvider>
    </ScreenCaptureProvider>
  )
}
