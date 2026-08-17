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
  action: HotkeyActionEntry,
  options?: { hotkeyName?: string; includeProfileName?: boolean },
): string {
  const keyLabel = action.buttonKey ? ` (${action.buttonKey})` : ''
  if (options?.includeProfileName && options.hotkeyName) {
    return `${options.hotkeyName} · ${action.name}${keyLabel}`
  }
  return `${action.name}${keyLabel}`
}

export function buildHotkeyMoveOptions(
  hotkeys: HotkeyListItem[],
  profileId?: string | null,
): HotkeyMoveOption[] {
  const scopedHotkeys = profileId
    ? hotkeys.filter((hotkey) => hotkey.id === profileId)
    : hotkeys
  const includeProfileName = !profileId
  const options: HotkeyMoveOption[] = []

  for (const hotkey of scopedHotkeys) {
    for (const action of hotkey.moves) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'move',
        label: formatHotkeyActionOptionLabel(action, {
          hotkeyName: hotkey.name,
          includeProfileName,
        }),
      })
    }

    for (const action of hotkey.buffs) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'buff',
        label: formatHotkeyActionOptionLabel(action, {
          hotkeyName: hotkey.name,
          includeProfileName,
        }),
      })
    }

    for (const action of hotkey.attacks) {
      options.push({
        key: hotkeyActionKey(hotkey.id, action.id),
        hotkeyId: hotkey.id,
        hotkeyName: hotkey.name,
        action,
        category: 'attack',
        label: formatHotkeyActionOptionLabel(action, {
          hotkeyName: hotkey.name,
          includeProfileName,
        }),
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
