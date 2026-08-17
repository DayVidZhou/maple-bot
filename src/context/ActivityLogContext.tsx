import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import {
  keyboardEventLabel,
  MAX_ACTIVITY_LOG_ENTRIES,
  type ActivityLogEntry,
  type ActivityLogInput,
  type KeyboardLogAction,
} from '../types/activityLog'
import { activityLogPositionsFromContext } from '../utils/activityLogCoords'

interface ActivityLogContextValue {
  entries: ActivityLogEntry[]
  logActivity: (entry: ActivityLogInput) => void
  logKeyboardEvent: (action: KeyboardLogAction, key: string, detail?: string) => void
  clearLog: () => void
}

const ActivityLogContext = createContext<ActivityLogContextValue | null>(null)

function createEntry(input: ActivityLogInput): ActivityLogEntry {
  return {
    ...input,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
}

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])

  const logActivity = useCallback((entry: ActivityLogInput) => {
    setEntries((current) => {
      const next = [...current, createEntry(entry)]
      if (next.length <= MAX_ACTIVITY_LOG_ENTRIES) return next
      return next.slice(next.length - MAX_ACTIVITY_LOG_ENTRIES)
    })
  }, [])

  const logKeyboardEvent = useCallback(
    (action: KeyboardLogAction, key: string, detail?: string) => {
      logActivity({
        category: 'keyboard',
        event: keyboardEventLabel(action),
        key,
        detail,
        ...activityLogPositionsFromContext(),
      })
    },
    [logActivity],
  )

  const clearLog = useCallback(() => {
    setEntries([])
  }, [])

  return (
    <ActivityLogContext.Provider
      value={{ entries, logActivity, logKeyboardEvent, clearLog }}
    >
      {children}
    </ActivityLogContext.Provider>
  )
}

export function useActivityLogContext(): ActivityLogContextValue {
  const context = useContext(ActivityLogContext)
  if (!context) {
    throw new Error('useActivityLogContext must be used within ActivityLogProvider')
  }
  return context
}

export function useActivityLogOptional(): ActivityLogContextValue | null {
  return useContext(ActivityLogContext)
}
