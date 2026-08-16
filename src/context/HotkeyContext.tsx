import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useHotkey } from '../hooks/useHotkey'

type HotkeyHookValue = ReturnType<typeof useHotkey>

type HotkeyContextValue = HotkeyHookValue & {
  hotkeysOpen: boolean
  isDraft: boolean
  setHotkeysOpen: (open: boolean) => void
  startNewHotkeyDraft: (name: string) => void
  markDraftSaved: () => void
}

const HotkeyContext = createContext<HotkeyContextValue | null>(null)

export function HotkeyProvider({ children }: { children: ReactNode }) {
  const {
    resetHotkey,
    startNewHotkey,
    ...hotkeyState
  } = useHotkey()
  const [hotkeysOpen, setHotkeysOpenState] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const setHotkeysOpen = useCallback(
    (open: boolean) => {
      if (!open && isDraft) {
        resetHotkey()
        setIsDraft(false)
      }
      setHotkeysOpenState(open)
    },
    [isDraft, resetHotkey],
  )

  const startNewHotkeyDraft = useCallback(
    (name: string) => {
      startNewHotkey(name)
      setIsDraft(true)
      setHotkeysOpenState(true)
    },
    [startNewHotkey],
  )

  const markDraftSaved = useCallback(() => {
    setIsDraft(false)
  }, [])

  const value: HotkeyContextValue = {
    ...hotkeyState,
    resetHotkey,
    startNewHotkey,
    hotkeysOpen,
    isDraft,
    setHotkeysOpen,
    startNewHotkeyDraft,
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
