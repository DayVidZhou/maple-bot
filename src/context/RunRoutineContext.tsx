import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { useActivityLogContext } from './ActivityLogContext'
import type { Coordinates } from '../types/coordinates'
import type { BuffStatusRow } from '../types/buffStatus'
import { buffStatusFromEntry } from '../types/buffStatus'
import type { RoutineListItem } from '../types/registry'
import type { RoutinePoint } from '../types/routine'
import type { User } from '../types/user'
import { USER_NOT_FOUND } from '../types/user'
import {
  RoutineRunAbortError,
  runRoutineLoop,
  type RoutineRunnerKeyboard,
} from '../utils/routineRunner'
import { BuffRunner } from '../utils/buffRunner'
import { resolveProfileBuffs } from '../utils/resolveHotkeyAction'
import { activityLogCoordContextRef, activityLogPositions, appendCoordDelta } from '../utils/activityLogCoords'
import { requestUserTrackingReset } from '../utils/userTrackingReset'
import {
  pointToMinimapCoord,
  userToMinimapCoord,
} from '../utils/userCoords'
import { useRegistryContext } from './RegistryContext'
import { useScreenCaptureContext } from './ScreenCaptureContext'

interface UserTracker {
  user: User
  cropWidth: number
  cropHeight: number
}

interface RunRoutineContextValue {
  isRunning: boolean
  status: string
  error: string | null
  currentPointIndex: number | null
  selectedRoutine: RoutineListItem | null
  buffStatuses: BuffStatusRow[]
  hotkeyProfileName: string | null
  canRun: boolean
  canLogUserLocation: boolean
  updateUserTracker: (tracker: UserTracker) => void
  logUserLocation: () => void
  startRun: () => Promise<void>
  stopRun: () => void
}

const RunRoutineContext = createContext<RunRoutineContextValue | null>(null)

const ROUTINE_DISCORD_SCREENSHOT_INTERVAL_MS = 30_000

export function RunRoutineProvider({ children }: { children: ReactNode }) {
  const { routines, hotkeys, selectedRoutineId, selectedHotkeyId } =
    useRegistryContext()
  const { isCapturing } = useScreenCaptureContext()
  const { pressKey, releaseKey, tapKey, isAvailable } = useKeyboard()
  const { logActivity, clearLog } = useActivityLogContext()

  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready')
  const [error, setError] = useState<string | null>(null)
  const [currentPointIndex, setCurrentPointIndex] = useState<number | null>(
    null,
  )
  const [buffStatuses, setBuffStatuses] = useState<BuffStatusRow[]>([])

  const buffRunnerRef = useRef<BuffRunner | null>(null)

  const abortRef = useRef(false)
  const abortReasonRef = useRef<string | null>(null)
  const heldKeysRef = useRef<Set<string>>(new Set())
  const trackerRef = useRef<UserTracker>({
    user: USER_NOT_FOUND,
    cropWidth: 0,
    cropHeight: 0,
  })
  const currentPointRef = useRef<RoutinePoint | null>(null)

  const syncActivityLogCoords = useCallback(() => {
    const { user, cropWidth, cropHeight } = trackerRef.current
    const minimapUser = userToMinimapCoord(user)
    const minimapPoint =
      currentPointRef.current && cropWidth > 0 && cropHeight > 0
        ? pointToMinimapCoord(
            currentPointRef.current,
            cropWidth,
            cropHeight,
          )
        : null

    activityLogCoordContextRef.current = {
      user: minimapUser,
      point: minimapPoint,
      pointName: currentPointRef.current?.name,
    }
  }, [])

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedRoutineId) ?? null,
    [routines, selectedRoutineId],
  )

  const linkedHotkeyProfile = useMemo(() => {
    if (!selectedHotkeyId) return null
    return hotkeys.find((hotkey) => hotkey.id === selectedHotkeyId) ?? null
  }, [hotkeys, selectedHotkeyId])

  const idleBuffStatuses = useMemo(
    () =>
      (linkedHotkeyProfile?.buffs ?? []).map((entry) => buffStatusFromEntry(entry)),
    [linkedHotkeyProfile],
  )

  useEffect(() => {
    if (!isRunning) {
      setBuffStatuses(idleBuffStatuses)
    }
  }, [idleBuffStatuses, isRunning])

  useEffect(() => {
    if (!isRunning || !buffRunnerRef.current) return

    const intervalId = window.setInterval(() => {
      const runner = buffRunnerRef.current
      if (!runner) return
      setBuffStatuses(runner.getSnapshot())
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [isRunning])

  const canRun = Boolean(
    isAvailable &&
      isCapturing &&
      selectedRoutine &&
      selectedRoutine.points.length > 0,
  )

  const canLogUserLocation = isCapturing

  const logUserLocation = useCallback(() => {
    const { user, cropWidth, cropHeight } = trackerRef.current
    const minimapUser = userToMinimapCoord(user)
    const targetPoint =
      currentPointRef.current ??
      (currentPointIndex != null && selectedRoutine
        ? selectedRoutine.points[currentPointIndex] ?? null
        : null) ??
      selectedRoutine?.points[0] ??
      null
    const minimapPoint =
      targetPoint && cropWidth > 0 && cropHeight > 0
        ? pointToMinimapCoord(targetPoint, cropWidth, cropHeight)
        : null

    logActivity({
      category: 'routine',
      event: 'User location',
      detail: appendCoordDelta(
        minimapUser ? 'Manual snapshot' : 'Manual snapshot (user not detected)',
        minimapUser,
        minimapPoint,
      ),
      ...activityLogPositions(minimapUser, minimapPoint, targetPoint?.name),
    })
  }, [currentPointIndex, logActivity, selectedRoutine])

  const updateUserTracker = useCallback(
    (tracker: UserTracker) => {
      trackerRef.current = tracker
      syncActivityLogCoords()
    },
    [syncActivityLogCoords],
  )

  const trackHeldKey = useCallback(
    async (action: 'press' | 'release', key: string) => {
      if (action === 'press') {
        heldKeysRef.current.add(key)
        await pressKey(key)
        return
      }

      heldKeysRef.current.delete(key)
      await releaseKey(key)
    },
    [pressKey, releaseKey],
  )

  const releaseAllHeldKeys = useCallback(async () => {
    const keys = [...heldKeysRef.current]
    heldKeysRef.current.clear()
    await Promise.all(keys.map((key) => releaseKey(key)))
  }, [releaseKey])

  const stopRun = useCallback(() => {
    abortRef.current = true
    abortReasonRef.current = 'Stopped by user'
    void releaseAllHeldKeys()
  }, [releaseAllHeldKeys])

  const startRun = useCallback(async () => {
    if (!selectedRoutine || !canRun) return

    abortRef.current = false
    abortReasonRef.current = null
    clearLog()
    setIsRunning(true)
    setError(null)
    setCurrentPointIndex(null)
    currentPointRef.current = null
    activityLogCoordContextRef.current = { user: null, point: null }
    setStatus('Starting routine...')
    logActivity({
      category: 'system',
      event: 'Run requested',
      detail: selectedRoutine.name,
    })

    const keyboard: RoutineRunnerKeyboard = {
      pressKey: (key) => trackHeldKey('press', key),
      releaseKey: (key) => trackHeldKey('release', key),
      tapKey,
    }

    const buffEntries = resolveProfileBuffs(hotkeys, selectedHotkeyId)
    const buffRunner = new BuffRunner(buffEntries, {
      keyboard,
      shouldAbort: () => abortRef.current,
      onActivityLog: logActivity,
      onStatus: setStatus,
      onBuffStatusChange: setBuffStatuses,
    })
    buffRunnerRef.current = buffRunner
    setBuffStatuses(buffRunner.getSnapshot())

    const trySendDiscordScreenshot = async () => {
      if (abortRef.current) return

      console.log('[discord] Routine screenshot tick requested', {
        routine: selectedRoutine.name,
      })

      if (!window.electronAPI?.sendDiscordScreenshot) {
        console.warn('[discord] Routine screenshot skipped — Electron API unavailable')
        logActivity({
          category: 'system',
          event: 'Discord screenshot failed',
          detail: 'Discord is not available',
        })
        return
      }

      try {
        await window.electronAPI.sendDiscordScreenshot(selectedRoutine.name)
        console.log('[discord] Routine screenshot sent', {
          routine: selectedRoutine.name,
        })
        logActivity({
          category: 'system',
          event: 'Discord screenshot',
          detail: `Sent · ${selectedRoutine.name}`,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Discord screenshot failed'
        console.error('[discord] Routine screenshot failed', {
          routine: selectedRoutine.name,
          error: message,
          err,
        })
        logActivity({
          category: 'system',
          event: 'Discord screenshot failed',
          detail: message,
        })
      }
    }

    let discordScreenshotIntervalId: ReturnType<typeof setInterval> | null =
      null
    if (selectedRoutine.sendDiscordScreenshots) {
      console.log('[discord] Routine screenshots enabled', {
        routine: selectedRoutine.name,
        intervalMs: ROUTINE_DISCORD_SCREENSHOT_INTERVAL_MS,
      })
      discordScreenshotIntervalId = setInterval(() => {
        void trySendDiscordScreenshot()
      }, ROUTINE_DISCORD_SCREENSHOT_INTERVAL_MS)
      logActivity({
        category: 'system',
        event: 'Discord screenshots enabled',
        detail: 'Every 30s while routine runs',
      })
      void trySendDiscordScreenshot()
    } else {
      console.log('[discord] Routine screenshots disabled for run', {
        routine: selectedRoutine.name,
      })
    }

    try {
      await runRoutineLoop(selectedRoutine, hotkeys, {
        keyboard,
        buffRunner,
        activeHotkeyProfileId: selectedHotkeyId,
        focusMapleStory: async () => {
          if (!window.electronAPI) {
            throw new Error('Keyboard control requires the Electron app')
          }
          await window.electronAPI.focusMapleStoryWorlds()
        },
        isMapleStoryFocused: async () => {
          if (!window.electronAPI) return false
          return window.electronAPI.isMapleStoryWorldsFocused()
        },
        getUserMinimapCoord: (): Coordinates | null => {
          return userToMinimapCoord(trackerRef.current.user)
        },
        getCropSize: () => {
          const { cropWidth, cropHeight } = trackerRef.current
          if (cropWidth <= 0 || cropHeight <= 0) return null
          return { width: cropWidth, height: cropHeight }
        },
        shouldAbort: () => abortRef.current,
        resetUserTracking: requestUserTrackingReset,
        onStatus: setStatus,
        onPointIndexChange: (index) => {
          setCurrentPointIndex(index)
          currentPointRef.current = selectedRoutine.points[index] ?? null
          syncActivityLogCoords()
        },
        onActivityLog: logActivity,
      })
    } catch (err) {
      if (!(err instanceof RoutineRunAbortError)) {
        const message =
          err instanceof Error ? err.message : 'Routine run failed'
        setError(message)
        setStatus(message)
        logActivity({
          category: 'system',
          event: 'Routine error',
          detail: message,
        })
      } else {
        setError(null)
        setStatus('Stopped')
        logActivity({
          category: 'routine',
          event: 'Routine stopped',
          detail: abortReasonRef.current ?? err.message,
        })
        abortReasonRef.current = null
      }
    } finally {
      if (discordScreenshotIntervalId) {
        console.log('[discord] Clearing routine screenshot interval')
        clearInterval(discordScreenshotIntervalId)
      }
      await releaseAllHeldKeys()
      abortRef.current = false
      buffRunnerRef.current = null
      setIsRunning(false)
      setCurrentPointIndex(null)
      currentPointRef.current = null
      activityLogCoordContextRef.current = { user: null, point: null }
      setBuffStatuses(idleBuffStatuses)
    }
  }, [
    canRun,
    clearLog,
    hotkeys,
    idleBuffStatuses,
    logActivity,
    releaseAllHeldKeys,
    selectedRoutine,
    selectedHotkeyId,
    syncActivityLogCoords,
    tapKey,
    trackHeldKey,
  ])

  const value: RunRoutineContextValue = {
    isRunning,
    status,
    error,
    currentPointIndex,
    selectedRoutine,
    buffStatuses,
    hotkeyProfileName: linkedHotkeyProfile?.name ?? null,
    canRun,
    canLogUserLocation,
    updateUserTracker,
    logUserLocation,
    startRun,
    stopRun,
  }

  return (
    <RunRoutineContext.Provider value={value}>
      {children}
    </RunRoutineContext.Provider>
  )
}

export function useRunRoutineContext(): RunRoutineContextValue {
  const context = useContext(RunRoutineContext)
  if (!context) {
    throw new Error('useRunRoutineContext must be used within RunRoutineProvider')
  }
  return context
}
