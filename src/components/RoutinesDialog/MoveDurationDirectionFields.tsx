import {
  type MoveDirection,
  type MoveDefaults,
  DEFAULT_MOVE_DEFAULTS,
} from '../../types/routine'
import './HotkeyMoveSelect.css'

export type { MoveDefaults }
export { DEFAULT_MOVE_DEFAULTS }

interface MoveDurationDirectionFieldsProps {
  holdDurationSeconds: number
  direction: MoveDirection | null
  onChange: (patch: Partial<MoveDefaults>) => void
  disabled?: boolean
}

export function MoveDurationDirectionFields({
  holdDurationSeconds,
  direction,
  onChange,
  disabled = false,
}: MoveDurationDirectionFieldsProps) {
  return (
    <div className="routines-move-defaults-fields">
      <label className="routines-name-field">
        <span>Hold duration (s)</span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={holdDurationSeconds}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              holdDurationSeconds: Number.parseFloat(event.target.value) || 0,
            })
          }
        />
      </label>
      <label className="routines-name-field">
        <span>Direction</span>
        <select
          value={direction ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const value = event.target.value
            onChange({
              direction:
                value === 'left' || value === 'right' ? value : null,
            })
          }}
          className="hotkey-move-select-input routines-move-direction-select"
        >
          <option value="">None</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  )
}
