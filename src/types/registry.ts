import type { HotkeyActionEntry } from './hotkey'
import type { Move, RoutinePoint } from './routine'

export interface RoutineListItem {
  id: string
  name: string
  points: RoutinePoint[]
  moves: Move[]
}

export interface HotkeyListItem {
  id: string
  name: string
  moves: HotkeyActionEntry[]
  buffs: HotkeyActionEntry[]
  attacks: HotkeyActionEntry[]
}

export function createId(): string {
  return crypto.randomUUID()
}

export function defaultRegistryName(
  type: 'routine' | 'hotkey',
  listLength: number,
): string {
  return `${type}-${listLength + 1}`
}
