import * as Dialog from '@radix-ui/react-dialog'
import { useRegistryContext } from '../../context/RegistryContext'
import { useHotkeyContext } from '../../context/HotkeyContext'
import { toRegistryHotkey } from '../../hooks/useHotkey'
import { ActionEntryFields } from './ActionEntryFields'
import './HotkeysDialog.css'

export function HotkeysDialog() {
  const { addHotkey } = useRegistryContext()
  const {
    hotkeysOpen,
    setHotkeysOpen,
    hotkey,
    setHotkeyName,
    addMove,
    addBuff,
    updateMove,
    updateBuff,
    removeMove,
    removeBuff,
    resetHotkey,
    markDraftSaved,
  } = useHotkeyContext()

  const handleSave = () => {
    addHotkey(toRegistryHotkey(hotkey))
    markDraftSaved()
    resetHotkey()
    setHotkeysOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
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
              Configure any optional moves and buffs from your key setup. Button,
              cooldown, and cast time can be left blank for entries you do not use.
            </p>

            <div className="hotkeys-lists">
              <section className="hotkeys-list-panel">
                <div className="hotkeys-list-header">
                  <h3>Moves</h3>
                  <button
                    type="button"
                    className="btn btn-secondary hotkeys-add-entry"
                    onClick={addMove}
                  >
                    Add Move
                  </button>
                </div>
                <div className="hotkeys-entry-list">
                  {hotkey.moves.map((entry) => (
                    <ActionEntryFields
                      key={entry.id}
                      entry={entry}
                      onChange={(patch) => updateMove(entry.id, patch)}
                      onRemove={() => removeMove(entry.id)}
                    />
                  ))}
                </div>
              </section>

              <section className="hotkeys-list-panel">
                <div className="hotkeys-list-header">
                  <h3>Buffs</h3>
                  <button
                    type="button"
                    className="btn btn-secondary hotkeys-add-entry"
                    onClick={addBuff}
                  >
                    Add Buff
                  </button>
                </div>
                <div className="hotkeys-entry-list">
                  {hotkey.buffs.map((entry) => (
                    <ActionEntryFields
                      key={entry.id}
                      entry={entry}
                      onChange={(patch) => updateBuff(entry.id, patch)}
                      onRemove={() => removeBuff(entry.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="hotkeys-dialog-footer">
            <button
              type="button"
              className="btn btn-primary hotkeys-save-btn"
              onClick={handleSave}
            >
              Save Hotkey
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
