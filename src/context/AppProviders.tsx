import type { ReactNode } from 'react'
import { ActivityLogProvider } from './ActivityLogContext'
import { ElectronAppsProvider } from './ElectronAppsContext'
import { FocusRegionProvider } from './FocusRegionContext'
import { PlatformProvider } from './PlatformContext'
import { RegistryProvider } from './RegistryContext'
import { HotkeyProvider } from './HotkeyContext'
import { RoutineProvider } from './RoutineContext'
import { RunRoutineProvider } from './RunRoutineContext'
import { ScreenCaptureProvider } from './ScreenCaptureContext'
import { DiscordStatusBridge } from '../components/DiscordStatusBridge/DiscordStatusBridge'
import { DiscordRemoteBridge } from '../components/DiscordRemoteBridge/DiscordRemoteBridge'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlatformProvider>
      <ScreenCaptureProvider>
        <ElectronAppsProvider>
          <RegistryProvider>
            <FocusRegionProvider>
              <ActivityLogProvider>
                <HotkeyProvider>
                  <RoutineProvider>
                    <RunRoutineProvider>
                      <DiscordStatusBridge />
                      <DiscordRemoteBridge />
                      {children}
                    </RunRoutineProvider>
                  </RoutineProvider>
                </HotkeyProvider>
              </ActivityLogProvider>
            </FocusRegionProvider>
          </RegistryProvider>
        </ElectronAppsProvider>
      </ScreenCaptureProvider>
    </PlatformProvider>
  )
}
