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

export function resolveJumpKey(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): string | null {
  const profile = resolveHotkeyProfile(hotkeys, profileId)
  if (!profile) return null

  const jump = profile.moves.find(
    (entry) => entry.name.trim().toLowerCase() === 'jump',
  )
  return jump?.buttonKey?.trim() || null
}

export function resolveRoutineBuffs(
  hotkeys: HotkeyListItem[],
  profileId: string | null,
): HotkeyActionEntry[] {
  const profile = resolveHotkeyProfile(hotkeys, profileId)
  return profile?.buffs ?? []
}
