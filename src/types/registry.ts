import type { HotkeyActionEntry } from './hotkey'
import type { FocusRegionSize } from './focusRegion'
import type { Move, RoutinePoint } from './routine'

export interface MinimapProfileListItem extends FocusRegionSize {
  id: string
  name: string
}

export interface RoutineListItem {
  id: string
  name: string
  hotkeyProfileId?: string | null
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
  type: 'routine' | 'hotkey' | 'minimap',
  listLength: number,
): string {
  return `${type}-${listLength + 1}`
}
