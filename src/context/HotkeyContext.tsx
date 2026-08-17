import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useHotkey } from '../hooks/useHotkey'
import { normalizeHotkeyListItem } from '../types/hotkey'
import type { HotkeyListItem } from '../types/registry'

type HotkeyHookValue = ReturnType<typeof useHotkey>

type HotkeyContextValue = HotkeyHookValue & {
  hotkeysOpen: boolean
  editingHotkeyId: string | null
  setHotkeysOpen: (open: boolean) => void
  startNewHotkeyDraft: (name: string) => void
  startEditHotkeyDraft: (hotkey: HotkeyListItem) => void
  markDraftSaved: () => void
}

const HotkeyContext = createContext<HotkeyContextValue | null>(null)

export function HotkeyProvider({ children }: { children: ReactNode }) {
  const {
    resetHotkey,
    startNewHotkey,
    loadHotkey,
    ...hotkeyState
  } = useHotkey()
  const [hotkeysOpen, setHotkeysOpenState] = useState(false)
  const [editingHotkeyId, setEditingHotkeyId] = useState<string | null>(null)

  const closeEditor = useCallback(() => {
    resetHotkey()
    setEditingHotkeyId(null)
  }, [resetHotkey])

  const setHotkeysOpen = useCallback(
    (open: boolean) => {
      if (!open) closeEditor()
      setHotkeysOpenState(open)
    },
    [closeEditor],
  )

  const startNewHotkeyDraft = useCallback(
    (name: string) => {
      startNewHotkey(name)
      setEditingHotkeyId(null)
      setHotkeysOpenState(true)
    },
    [startNewHotkey],
  )

  const startEditHotkeyDraft = useCallback(
    (hotkey: HotkeyListItem) => {
      loadHotkey(normalizeHotkeyListItem(hotkey))
      setEditingHotkeyId(hotkey.id)
      setHotkeysOpenState(true)
    },
    [loadHotkey],
  )

  const markDraftSaved = useCallback(() => {
    setEditingHotkeyId(null)
  }, [])

  const value: HotkeyContextValue = {
    ...hotkeyState,
    resetHotkey,
    startNewHotkey,
    loadHotkey,
    hotkeysOpen,
    editingHotkeyId,
    setHotkeysOpen,
    startNewHotkeyDraft,
    startEditHotkeyDraft,
    markDraftSaved,
  }

  return (
    <HotkeyContext.Provider value={value}>{children}</HotkeyContext.Provider>
  )
}

export function useHotkeyContext(): HotkeyContextValue {
  const context = useContext(HotkeyContext)
  if (!context) {
    throw new Error('useHotkeyContext must be used within HotkeyProvider')
  }
  return context
}
