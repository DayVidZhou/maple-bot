import type { HotkeyActionEntry } from '../../types/hotkey'
import './HotkeysDialog.css'

interface ActionEntryFieldsProps {
  entry: HotkeyActionEntry
  onChange: (patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => void
  onRemove: () => void
}

export function ActionEntryFields({
  entry,
  onChange,
  onRemove,
}: ActionEntryFieldsProps) {
  return (
    <div className="hotkey-action-entry">
      <label className="hotkey-action-field">
        <span>Name</span>
        <input
          type="text"
          value={entry.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label className="hotkey-action-field">
        <span>Button</span>
        <input
          type="text"
          value={entry.buttonKey}
          placeholder="e.g. ctrl, space, 1"
          onChange={(event) => onChange({ buttonKey: event.target.value })}
        />
      </label>
      <label className="hotkey-action-field hotkey-action-field--time">
        <span>Cooldown (s)</span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={entry.cooldownSeconds}
          onChange={(event) =>
            onChange({
              cooldownSeconds: Number.parseFloat(event.target.value) || 0,
            })
          }
        />
      </label>
      <label className="hotkey-action-field hotkey-action-field--time">
        <span>Cast time (s)</span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={entry.castTimeSeconds}
          onChange={(event) =>
            onChange({
              castTimeSeconds: Number.parseFloat(event.target.value) || 0,
            })
          }
        />
      </label>
      <button
        type="button"
        className="btn btn-secondary hotkey-action-remove"
        onClick={onRemove}
        aria-label={`Remove ${entry.name}`}
      >
        Remove
      </button>
    </div>
  )
}
