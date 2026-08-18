import type { HotkeyActionEntry } from './hotkey'

export type BuffRuntimeState =
  | 'inactive'
  | 'ready'
  | 'casting'
  | 'cooldown'
  | 'queued'

export interface BuffStatusRow {
  id: string
  name: string
  buttonKey: string | null
  castTimeSeconds: number
  cooldownSeconds: number
  state: BuffRuntimeState
  /** Seconds remaining on cooldown; only set when state is cooldown. */
  cooldownRemainingSeconds: number | null
  /** 1-based position in the buff queue; only set when state is queued. */
  queuePosition: number | null
}

export function buffStatusFromEntry(
  entry: HotkeyActionEntry,
  overrides: Partial<Omit<BuffStatusRow, 'id' | 'name'>> = {},
): BuffStatusRow {
  const hasKey = Boolean(entry.buttonKey?.trim())
  return {
    id: entry.id,
    name: entry.name,
    buttonKey: entry.buttonKey?.trim() || null,
    castTimeSeconds: entry.castTimeSeconds,
    cooldownSeconds: entry.cooldownSeconds,
    state: hasKey ? 'ready' : 'inactive',
    cooldownRemainingSeconds: null,
    queuePosition: null,
    ...overrides,
  }
}

export function formatBuffStatusLabel(row: BuffStatusRow): string {
  switch (row.state) {
    case 'inactive':
      return 'No key'
    case 'ready':
      return 'Ready'
    case 'casting':
      return 'Casting…'
    case 'cooldown':
      return row.cooldownRemainingSeconds != null
        ? `Cooldown ${row.cooldownRemainingSeconds.toFixed(1)}s`
        : 'Cooldown'
    case 'queued':
      return row.queuePosition != null
        ? `Queued #${row.queuePosition}`
        : 'Queued'
    default:
      return '—'
  }
}
