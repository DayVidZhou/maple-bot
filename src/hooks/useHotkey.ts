import { useCallback, useState } from 'react'
import {
  createHotkeyDraft,
  createEmptyAction,
  defaultHotkeyEntryName,
  type HotkeyActionEntry,
  type HotkeyConfig,
} from '../types/hotkey'

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

  const updateMove = useCallback(
    (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => {
      setHotkey((current) => ({
        ...current,
        moves: current.moves.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      }))
    },
    [],
  )

  const updateBuff = useCallback(
    (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => {
      setHotkey((current) => ({
        ...current,
        buffs: current.buffs.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
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

  return {
    hotkey,
    resetHotkey,
    startNewHotkey,
    setHotkeyName,
    addMove,
    addBuff,
    updateMove,
    updateBuff,
    removeMove,
    removeBuff,
  }
}

export function toRegistryHotkey(hotkey: HotkeyConfig) {
  return {
    name: hotkey.name,
    moves: hotkey.moves,
    buffs: hotkey.buffs,
  }
}
