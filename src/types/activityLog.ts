export type ActivityLogCategory = 'keyboard' | 'routine' | 'system'

export type KeyboardLogAction = 'press' | 'release' | 'tap'

export interface ActivityLogEntry {
  id: string
  timestamp: number
  category: ActivityLogCategory
  event: string
  key?: string
  userCoord?: string
  pointCoord?: string
  detail?: string
}

export type ActivityLogInput = Omit<ActivityLogEntry, 'id' | 'timestamp'>

export const MAX_ACTIVITY_LOG_ENTRIES = 500

export function formatActivityLogTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

export function keyboardEventLabel(action: KeyboardLogAction): string {
  switch (action) {
    case 'press':
      return 'Press key'
    case 'release':
      return 'Release key'
    case 'tap':
      return 'Tap key'
  }
}
