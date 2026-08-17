import type { HotkeyListItem, MinimapProfileListItem, RoutineListItem } from '../types/registry'

export const ROUTINE_SAVE_FILE = '.routine-save-file.ts'
export const HOTKEY_SAVE_FILE = '.hotkey-save-file.ts'
export const MINIMAP_SAVE_FILE = '.minimap-save-file.ts'

export const REGISTRY_SAVE_VERSION = 1

export interface RegistrySaveFile<T> {
  version: typeof REGISTRY_SAVE_VERSION
  savedAt: string
  items: T[]
}

export type RoutineSaveFile = RegistrySaveFile<RoutineListItem>
export type HotkeySaveFile = RegistrySaveFile<HotkeyListItem>
export type MinimapSaveFile = RegistrySaveFile<MinimapProfileListItem>
