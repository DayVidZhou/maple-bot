import { createId } from './registry'

export const DEFAULT_ACTION_SECONDS = 0.3

export interface HotkeyActionEntry {
  id: string
  name: string
  buttonKey: string
  cooldownSeconds: number
  castTimeSeconds: number
}

export interface HotkeyConfig {
  id: string
  name: string
  moves: HotkeyActionEntry[]
  buffs: HotkeyActionEntry[]
}

export interface HotkeyActionTemplate {
  name: string
  suggestedKey?: string
}

export const PREDEFINED_MOVES: HotkeyActionTemplate[] = [
  { name: 'Attack', suggestedKey: 'ctrl' },
  { name: 'Jump', suggestedKey: 'alt' },
  { name: 'Dash', suggestedKey: 'r' },
  { name: 'Flash Jump', suggestedKey: 'd' },
  { name: 'Throwing Stars', suggestedKey: 'a' },
  { name: 'Multi-Star Throw', suggestedKey: 'shift' },
  { name: 'Large Shuriken', suggestedKey: 'space' },
  { name: 'Ghost Summon', suggestedKey: 'g' },
  { name: 'Pick Up', suggestedKey: 'x' },
  { name: 'Sit', suggestedKey: 'n' },
  { name: 'Speed Run', suggestedKey: 'z' },
  { name: 'Stand', suggestedKey: 'v' },
  { name: 'To The Map', suggestedKey: '1' },
  { name: 'To The Channel', suggestedKey: '2' },
  { name: 'To The Party', suggestedKey: '4' },
  { name: 'Move Menu', suggestedKey: 'tab' },
  { name: 'Quest', suggestedKey: 'q' },
  { name: 'World Map', suggestedKey: 'w' },
  { name: 'Equipment', suggestedKey: 'e' },
  { name: 'User List', suggestedKey: 'u' },
  { name: 'Item', suggestedKey: 'i' },
  { name: 'Party', suggestedKey: 'p' },
  { name: 'Set Key', suggestedKey: '\\' },
  { name: 'Ability', suggestedKey: 'f' },
  { name: 'Whisper', suggestedKey: 'h' },
  { name: 'Skill', suggestedKey: 'k' },
  { name: 'Helper', suggestedKey: 'l' },
  { name: 'Chat+', suggestedKey: ';' },
  { name: 'NPC Chat', suggestedKey: 'b' },
  { name: 'Mini Map', suggestedKey: 'm' },
]

export const PREDEFINED_BUFFS: HotkeyActionTemplate[] = [
  { name: 'Haste', suggestedKey: 's' },
  { name: 'Loot Coin', suggestedKey: 't' },
  { name: 'Coin Buff', suggestedKey: 'c' },
  { name: 'Healing', suggestedKey: '9' },
]

export function defaultHotkeyEntryName(
  type: 'move' | 'buff',
  listLength: number,
): string {
  return `${type}-${listLength + 1}`
}

export function createActionFromTemplate(
  template: HotkeyActionTemplate,
): HotkeyActionEntry {
  return {
    id: createId(),
    name: template.name,
    buttonKey: template.suggestedKey ?? '',
    cooldownSeconds: DEFAULT_ACTION_SECONDS,
    castTimeSeconds: DEFAULT_ACTION_SECONDS,
  }
}

export function createEmptyAction(name: string): HotkeyActionEntry {
  return {
    id: createId(),
    name,
    buttonKey: '',
    cooldownSeconds: DEFAULT_ACTION_SECONDS,
    castTimeSeconds: DEFAULT_ACTION_SECONDS,
  }
}

function createEmptyHotkeyConfig(name: string): HotkeyConfig {
  return {
    id: createId(),
    name,
    moves: PREDEFINED_MOVES.map(createActionFromTemplate),
    buffs: PREDEFINED_BUFFS.map(createActionFromTemplate),
  }
}

export function createHotkeyDraft(name: string): HotkeyConfig {
  const trimmed = name.trim() || 'Untitled Hotkey'
  return createEmptyHotkeyConfig(trimmed)
}

export { createId }
