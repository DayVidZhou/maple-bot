import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { useActivityLogContext } from './ActivityLogContext'
import type { Coordinates } from '../types/coordinates'
import type { RoutineListItem } from '../types/registry'
import type { RoutinePoint } from '../types/routine'
import type { User } from '../types/user'
import { USER_NOT_FOUND } from '../types/user'
import {
  RoutineRunAbortError,
  runRoutineLoop,
  type RoutineRunnerKeyboard,
} from '../utils/routineRunner'
import { activityLogCoordContextRef } from '../utils/activityLogCoords'
import { userToNormalized } from '../utils/userCoords'
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
  canRun: boolean
  updateUserTracker: (tracker: UserTracker) => void
  startRun: () => Promise<void>
  stopRun: () => void
}

const RunRoutineContext = createContext<RunRoutineContextValue | null>(null)

export function RunRoutineProvider({ children }: { children: ReactNode }) {
  const { routines, hotkeys, selectedRoutineId } = useRegistryContext()
  const { isCapturing } = useScreenCaptureContext()
  const { pressKey, releaseKey, tapKey, isAvailable } = useKeyboard()
  const { logActivity, clearLog } = useActivityLogContext()

  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready')
  const [error, setError] = useState<string | null>(null)
  const [currentPointIndex, setCurrentPointIndex] = useState<number | null>(
    null,
  )

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
    activityLogCoordContextRef.current = {
      user: userToNormalized(user, cropWidth, cropHeight),
      point: currentPointRef.current,
    }
  }, [])

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedRoutineId) ?? null,
    [routines, selectedRoutineId],
  )

  const canRun = Boolean(
    isAvailable &&
      isCapturing &&
      selectedRoutine &&
      selectedRoutine.points.length > 0,
  )

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

    try {
      await runRoutineLoop(selectedRoutine, hotkeys, {
        keyboard,
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
        getUserNormalized: (): Coordinates | null => {
          const { user, cropWidth, cropHeight } = trackerRef.current
          return userToNormalized(user, cropWidth, cropHeight)
        },
        getCropSize: () => {
          const { cropWidth, cropHeight } = trackerRef.current
          if (cropWidth <= 0 || cropHeight <= 0) return null
          return { width: cropWidth, height: cropHeight }
        },
        shouldAbort: () => abortRef.current,
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
      await releaseAllHeldKeys()
      abortRef.current = false
      setIsRunning(false)
      setCurrentPointIndex(null)
      currentPointRef.current = null
      activityLogCoordContextRef.current = { user: null, point: null }
    }
  }, [
    canRun,
    clearLog,
    hotkeys,
    logActivity,
    releaseAllHeldKeys,
    selectedRoutine,
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
    canRun,
    updateUserTracker,
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
