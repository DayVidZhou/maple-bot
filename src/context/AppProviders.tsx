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
import { BotSettingsProvider } from './BotSettingsContext'
import { DiscordStatusBridge } from '../components/DiscordStatusBridge/DiscordStatusBridge'
import { DiscordRemoteBridge } from '../components/DiscordRemoteBridge/DiscordRemoteBridge'
import { LieDetectorMonitor } from '../components/LieDetectorMonitor/LieDetectorMonitor'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlatformProvider>
      <ScreenCaptureProvider>
        <ElectronAppsProvider>
          <RegistryProvider>
            <FocusRegionProvider>
              <ActivityLogProvider>
                <BotSettingsProvider>
                  <HotkeyProvider>
                    <RoutineProvider>
                      <RunRoutineProvider>
                        <LieDetectorMonitor />
                        <DiscordStatusBridge />
                        <DiscordRemoteBridge />
                        {children}
                      </RunRoutineProvider>
                    </RoutineProvider>
                  </HotkeyProvider>
                </BotSettingsProvider>
              </ActivityLogProvider>
            </FocusRegionProvider>
          </RegistryProvider>
        </ElectronAppsProvider>
      </ScreenCaptureProvider>
    </PlatformProvider>
  )
}
