import type { HotkeyListItem } from '../../types/registry'
import type { Move } from '../../types/routine'
import { formatMoveDirectionLabel } from '../../types/routine'
import { resolveMoveButtonKey } from '../../utils/resolveHotkeyAction'
import { MoveDurationDirectionFields } from './MoveDurationDirectionFields'
import './HotkeyMoveSelect.css'

interface SelectedMoveFieldsProps {
  move: Move
  hotkeys: HotkeyListItem[]
  onChange: (patch: Partial<Omit<Move, 'id'>>) => void
}

export function SelectedMoveFields({
  move,
  hotkeys,
  onChange,
}: SelectedMoveFieldsProps) {
  const buttonKey = resolveMoveButtonKey(move, hotkeys)

  return (
    <div className="routines-selected-move-fields">
      <label className="routines-name-field">
        <span>Key</span>
        <input
          type="text"
          readOnly
          value={buttonKey ?? 'Not configured'}
          className="routines-move-key-readonly"
        />
      </label>
      <MoveDurationDirectionFields
        holdDurationSeconds={move.holdDurationSeconds}
        direction={move.direction}
        onChange={onChange}
      />
      <p className="routines-hint routines-move-fields-hint">
        At this point: {buttonKey ? `hold ${buttonKey}` : 'configure key in hotkeys'}{' '}
        for {move.holdDurationSeconds}s
        {move.direction
          ? ` while holding ${formatMoveDirectionLabel(move.direction)}`
          : ''}
        .
      </p>
    </div>
  )
}
