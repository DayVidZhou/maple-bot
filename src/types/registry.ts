import type { HotkeyActionEntry } from './hotkey'

export interface RoutineListItem {
  id: string
  name: string
}

export interface HotkeyListItem {
  id: string
  name: string
  moves: HotkeyActionEntry[]
  buffs: HotkeyActionEntry[]
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
