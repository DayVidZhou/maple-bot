import type { HotkeyActionEntry } from '../types/hotkey'
import type { HotkeyListItem } from '../types/registry'
import type { Move } from '../types/routine'

function findActionInProfile(
  profile: HotkeyListItem,
  actionId: string,
): HotkeyActionEntry | null {
  const all = [...profile.moves, ...profile.buffs, ...profile.attacks]
  return all.find((entry) => entry.id === actionId) ?? null
}

export function resolveMoveAction(
  move: Move,
  hotkeys: HotkeyListItem[],
): HotkeyActionEntry | null {
  if (!move.hotkeyId || !move.hotkeyActionId) return null

  const profile = hotkeys.find((hotkey) => hotkey.id === move.hotkeyId)
  if (!profile) return null

  return findActionInProfile(profile, move.hotkeyActionId)
}

export function resolveMoveButtonKey(
  move: Move,
  hotkeys: HotkeyListItem[],
): string | null {
  const action = resolveMoveAction(move, hotkeys)
  return action?.buttonKey?.trim() || null
}

export function resolveHotkeyProfile(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): HotkeyListItem | null {
  if (!profileId) return null
  return hotkeys.find((hotkey) => hotkey.id === profileId) ?? null
}

function findJumpAction(profile: HotkeyListItem): HotkeyActionEntry | null {
  return (
    profile.moves.find(
      (entry) => entry.name.trim().toLowerCase() === 'jump',
    ) ?? null
  )
}

export function resolveJumpKey(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): string | null {
  const profile = resolveHotkeyProfile(hotkeys, profileId)
  if (!profile) return null

  const jump = findJumpAction(profile)
  return jump?.buttonKey?.trim() || null
}

export function describeJumpKeyError(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): string {
  const profile = resolveHotkeyProfile(hotkeys, profileId)

  if (!profile) {
    return 'Select a hotkey profile in the sidebar and configure Jump.'
  }

  const jump = findJumpAction(profile)
  if (!jump) {
    return `Hotkey profile "${profile.name}" is missing a Jump action.`
  }

  if (!jump.buttonKey?.trim()) {
    return `Set a button key for Jump in hotkey profile "${profile.name}" and save.`
  }

  return 'Configure a Jump key in the selected hotkey profile.'
}

export function resolveProfileBuffs(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): HotkeyActionEntry[] {
  const profile = resolveHotkeyProfile(hotkeys, profileId)
  return profile?.buffs ?? []
}
