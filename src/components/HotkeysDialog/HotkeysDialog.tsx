import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import type { HotkeyActionEntry } from '../../types/hotkey'
import { useRegistryContext } from '../../context/RegistryContext'
import { useHotkeyContext } from '../../context/HotkeyContext'
import { toRegistryHotkey } from '../../hooks/useHotkey'
import { ActionEntryFields } from './ActionEntryFields'
import './HotkeysDialog.css'

interface HotkeySectionProps {
  title: string
  addLabel: string
  entries: HotkeyActionEntry[]
  capturingEntryId: string | null
  onAdd: () => void
  onChange: (id: string, patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => void
  onRemove: (id: string) => void
  onStartCapture: (id: string) => void
  onStopCapture: () => void
}

function HotkeySection({
  title,
  addLabel,
  entries,
  capturingEntryId,
  onAdd,
  onChange,
  onRemove,
  onStartCapture,
  onStopCapture,
}: HotkeySectionProps) {
  return (
    <section className="hotkeys-list-panel">
      <div className="hotkeys-list-header">
        <h3>{title}</h3>
        <button
          type="button"
          className="btn btn-secondary hotkeys-add-entry"
          onClick={onAdd}
        >
          {addLabel}
        </button>
      </div>
      <div className="hotkeys-entry-list">
        {entries.map((entry) => (
          <ActionEntryFields
            key={entry.id}
            entry={entry}
            isCapturing={capturingEntryId === entry.id}
            captureDisabled={
              capturingEntryId !== null && capturingEntryId !== entry.id
            }
            onChange={(patch) => onChange(entry.id, patch)}
            onRemove={() => onRemove(entry.id)}
            onStartCapture={() => onStartCapture(entry.id)}
            onStopCapture={onStopCapture}
          />
        ))}
      </div>
    </section>
  )
}

export function HotkeysDialog() {
  const { addHotkey, updateHotkey } = useRegistryContext()
  const {
    hotkeysOpen,
    setHotkeysOpen,
    editingHotkeyId,
    hotkey,
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
    resetHotkey,
    markDraftSaved,
  } = useHotkeyContext()
  const [capturingEntryId, setCapturingEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (!hotkeysOpen) setCapturingEntryId(null)
  }, [hotkeysOpen])

  const handleSave = () => {
    const payload = toRegistryHotkey(hotkey)
    if (editingHotkeyId) {
      updateHotkey(editingHotkeyId, payload)
    } else {
      addHotkey(payload)
    }
    markDraftSaved()
    setCapturingEntryId(null)
    resetHotkey()
    setHotkeysOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setCapturingEntryId(null)
    setHotkeysOpen(open)
  }

  return (
    <Dialog.Root open={hotkeysOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="hotkeys-dialog-overlay" />
        <Dialog.Content className="hotkeys-dialog">
          <div className="hotkeys-dialog-header">
            <Dialog.Title className="hotkeys-dialog-title">Hotkeys</Dialog.Title>
            <Dialog.Close className="hotkeys-dialog-close" aria-label="Close">
              ×
            </Dialog.Close>
          </div>

          <div className="hotkeys-dialog-body">
            <label className="hotkeys-name-field">
              <span>Hotkey name</span>
              <input
                type="text"
                value={hotkey.name}
                onChange={(event) => setHotkeyName(event.target.value)}
              />
            </label>

            <p className="hotkeys-hint">
              Configure optional regular moves, buffs, and attacks from your key
              setup. Button, cooldown, and cast time can be left blank for entries
              you do not use.
            </p>

            <div className="hotkeys-lists">
              <HotkeySection
                title="Regular"
                addLabel="Add Regular"
                entries={hotkey.moves}
                capturingEntryId={capturingEntryId}
                onAdd={addMove}
                onChange={updateMove}
                onRemove={removeMove}
                onStartCapture={setCapturingEntryId}
                onStopCapture={() => setCapturingEntryId(null)}
              />
              <HotkeySection
                title="Buffs"
                addLabel="Add Buff"
                entries={hotkey.buffs}
                capturingEntryId={capturingEntryId}
                onAdd={addBuff}
                onChange={updateBuff}
                onRemove={removeBuff}
                onStartCapture={setCapturingEntryId}
                onStopCapture={() => setCapturingEntryId(null)}
              />
              <HotkeySection
                title="Attacks"
                addLabel="Add Attack"
                entries={hotkey.attacks}
                capturingEntryId={capturingEntryId}
                onAdd={addAttack}
                onChange={updateAttack}
                onRemove={removeAttack}
                onStartCapture={setCapturingEntryId}
                onStopCapture={() => setCapturingEntryId(null)}
              />
            </div>
          </div>

          <div className="hotkeys-dialog-footer">
            <button
              type="button"
              className="btn btn-primary hotkeys-save-btn"
              onClick={handleSave}
            >
              Save {editingHotkeyId ? 'Changes' : 'Hotkey'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
