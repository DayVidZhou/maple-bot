import type { Move, MoveDirection } from '../../types/routine'
import './HotkeyMoveSelect.css'

interface SelectedMoveFieldsProps {
  move: Move
  onChange: (patch: Partial<Omit<Move, 'id'>>) => void
}

export function SelectedMoveFields({ move, onChange }: SelectedMoveFieldsProps) {
  return (
    <div className="routines-selected-move-fields">
      <label className="routines-name-field">
        <span>Hold duration (s)</span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={move.holdDurationSeconds}
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
          value={move.direction}
          onChange={(event) =>
            onChange({ direction: event.target.value as MoveDirection })
          }
          className="hotkey-move-select-input routines-move-direction-select"
        >
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </label>
    </div>
  )
}
