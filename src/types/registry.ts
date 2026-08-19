import type { HotkeyActionEntry } from './hotkey'
import type { FocusRegionSize } from './focusRegion'
import type { RoutinePoint } from './routine'

export interface MinimapProfileListItem extends FocusRegionSize {
  id: string
  name: string
}

export interface RoutineListItem {
  id: string
  name: string
  points: RoutinePoint[]
  /** DM a screenshot every 30s while this routine runs (requires Discord bot). */
  sendDiscordScreenshots?: boolean
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
