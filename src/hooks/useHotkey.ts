import { useCallback, useState } from 'react'
import {
  createHotkeyDraft,
  createEmptyAction,
  defaultHotkeyEntryName,
  type HotkeyActionEntry,
  type HotkeyConfig,
} from '../types/hotkey'

function updateEntryList(
  entries: HotkeyActionEntry[],
  id: string,
  patch: Partial<Omit<HotkeyActionEntry, 'id'>>,
): HotkeyActionEntry[] {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, ...patch } : entry,
  )
}

export function useHotkey() {
  const [hotkey, setHotkey] = useState<HotkeyConfig>(() =>
    createHotkeyDraft('Untitled Hotkey'),
  )

  const resetHotkey = useCallback(() => {
    setHotkey(createHotkeyDraft('Untitled Hotkey'))
  }, [])

  const startNewHotkey = useCallback((name: string) => {
    setHotkey(createHotkeyDraft(name))
  }, [])

  const loadHotkey = useCallback((item: HotkeyConfig) => {
    setHotkey({
      id: item.id,
      name: item.name,
      moves: item.moves,
      buffs: item.buffs,
      attacks: item.attacks,
    })
  }, [])

  const setHotkeyName = useCallback((name: string) => {
    setHotkey((current) => ({
      ...current,
      name: name.trim() || current.name,
    }))
  }, [])

  const addMove = useCallback(() => {
    setHotkey((current) => ({
      ...current,
      moves: [
        ...current.moves,
        createEmptyAction(
          defaultHotkeyEntryName('move', current.moves.length),
        ),
      ],
    }))
  }, [])

  const addBuff = useCallback(() => {
    setHotkey((current) => ({
      ...current,
      buffs: [
        ...current.buffs,
        createEmptyAction(
          defaultHotkeyEntryName('buff', current.buffs.length),
        ),
      ],
    }))
  }, [])

  const addAttack = useCallback(() => {
    setHotkey((current) => ({
      ...current,
      attacks: [
        ...current.attacks,
        createEmptyAction(
          defaultHotkeyEntryName('attack', current.attacks.length),
        ),
      ],
    }))
  }, [])

  const updateMove = useCallback(
    (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => {
      setHotkey((current) => ({
        ...current,
        moves: updateEntryList(current.moves, id, patch),
      }))
    },
    [],
  )

  const updateBuff = useCallback(
    (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => {
      setHotkey((current) => ({
        ...current,
        buffs: updateEntryList(current.buffs, id, patch),
      }))
    },
    [],
  )

  const updateAttack = useCallback(
    (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => {
      setHotkey((current) => ({
        ...current,
        attacks: updateEntryList(current.attacks, id, patch),
      }))
    },
    [],
  )

  const removeMove = useCallback((id: string) => {
    setHotkey((current) => ({
      ...current,
      moves: current.moves.filter((entry) => entry.id !== id),
    }))
  }, [])

  const removeBuff = useCallback((id: string) => {
    setHotkey((current) => ({
      ...current,
      buffs: current.buffs.filter((entry) => entry.id !== id),
    }))
  }, [])

  const removeAttack = useCallback((id: string) => {
    setHotkey((current) => ({
      ...current,
      attacks: current.attacks.filter((entry) => entry.id !== id),
    }))
  }, [])

  return {
    hotkey,
    resetHotkey,
    startNewHotkey,
    loadHotkey,
    setHotkeyName,
    addMove,
    addBuff,
    addAttack,
    updateMove,
    updateBuff,
    updateAttack,
    removeMove,
    removeBuff,
    removeAttack,
  }
}

export function toRegistryHotkey(hotkey: HotkeyConfig) {
  return {
    name: hotkey.name,
    moves: hotkey.moves,
    buffs: hotkey.buffs,
    attacks: hotkey.attacks,
  }
}
