import { useEffect } from 'react'
import type { HotkeyActionEntry } from '../../types/hotkey'
import { formatButtonKeyLabel, formatKeyPress } from '../../utils/formatKeyPress'
import './HotkeysDialog.css'

interface ActionEntryFieldsProps {
  entry: HotkeyActionEntry
  isCapturing: boolean
  captureDisabled: boolean
  onChange: (patch: Partial<Omit<HotkeyActionEntry, 'id'>>) => void
  onRemove: () => void
  onStartCapture: () => void
  onStopCapture: () => void
}

export function ActionEntryFields({
  entry,
  isCapturing,
  captureDisabled,
  onChange,
  onRemove,
  onStartCapture,
  onStopCapture,
}: ActionEntryFieldsProps) {
  useEffect(() => {
    if (!isCapturing) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onStopCapture()
        return
      }

      const formatted = formatKeyPress(event)
      if (!formatted) return

      event.preventDefault()
      event.stopPropagation()
      onChange({ buttonKey: formatted })
      onStopCapture()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isCapturing, onChange, onStopCapture])

  const buttonLabel = isCapturing
    ? 'Press a key…'
    : formatButtonKeyLabel(entry.buttonKey)

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
      <div className="hotkey-action-field hotkey-action-field--button">
        <span>Button</span>
        <div className="hotkey-button-setter">
          <span
            className={`hotkey-button-value ${
              isCapturing ? 'hotkey-button-value--listening' : ''
            } ${!buttonLabel && !isCapturing ? 'hotkey-button-value--empty' : ''}`}
          >
            {buttonLabel}
          </span>
          <button
            type="button"
            className={`btn btn-secondary hotkey-button-set ${
              isCapturing ? 'hotkey-button-set--listening' : ''
            }`}
            onClick={isCapturing ? onStopCapture : onStartCapture}
            disabled={captureDisabled}
          >
            {isCapturing ? 'Cancel' : 'Set'}
          </button>
        </div>
      </div>
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
