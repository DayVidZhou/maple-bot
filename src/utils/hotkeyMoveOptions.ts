import type { HotkeyActionEntry } from '../types/hotkey'
import type { HotkeyListItem } from '../types/registry'
import type { MoveCategory } from '../types/routine'

export interface HotkeyMoveOption {
  key: string
  hotkeyId: string
  hotkeyName: string
  action: HotkeyActionEntry
  category: MoveCategory
  label: string
}

const CATEGORY_ORDER: MoveCategory[] = ['move', 'buff', 'attack']

export const MOVE_CATEGORY_LABELS: Record<MoveCategory, string> = {
  move: 'Regular',
  buff: 'Buffs',
  attack: 'Attacks',
}

export function hotkeyActionKey(hotkeyId: string, actionId: string): string {
  return `${hotkeyId}:${actionId}`
}

export function formatHotkeyActionOptionLabel(
  hotkeyName: string,
  action: HotkeyActionEntry,
): string {
  const keyLabel = action.buttonKey ? ` (${action.buttonKey})` : ''
  return `${hotkeyName} · ${action.name}${keyLabel}`
}

export function buildHotkeyMoveOptions(
  hotkeys: HotkeyListItem[],
): HotkeyMoveOption[] {
  const options: HotkeyMoveOption[] = []

  for (const hotkey of hotkeys) {
    for (const action of hotkey.moves) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'move',
        label: formatHotkeyActionOptionLabel(hotkey.name, action),
      })
    }

    for (const action of hotkey.buffs) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'buff',
        label: formatHotkeyActionOptionLabel(hotkey.name, action),
      })
    }

    for (const action of hotkey.attacks) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'attack',
        label: formatHotkeyActionOptionLabel(hotkey.name, action),
      })
    }
  }

  return options.sort((left, right) => {
    const categoryDiff =
      CATEGORY_ORDER.indexOf(left.category) -
      CATEGORY_ORDER.indexOf(right.category)
    if (categoryDiff !== 0) return categoryDiff
    return left.label.localeCompare(right.label)
  })
}

export function groupHotkeyMoveOptions(
  options: HotkeyMoveOption[],
): Array<{ category: MoveCategory; label: string; options: HotkeyMoveOption[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: MOVE_CATEGORY_LABELS[category],
    options: options.filter((option) => option.category === category),
  })).filter((group) => group.options.length > 0)
}

export function findHotkeyMoveOption(
  options: HotkeyMoveOption[],
  key: string,
): HotkeyMoveOption | undefined {
  return options.find((option) => option.key === key)
}
