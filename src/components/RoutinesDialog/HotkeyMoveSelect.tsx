import { useMemo, useState } from 'react'
import type { HotkeyListItem } from '../../types/registry'
import type { Move } from '../../types/routine'
import {
  buildHotkeyMoveOptions,
  findHotkeyMoveOption,
  groupHotkeyMoveOptions,
  MOVE_CATEGORY_LABELS,
} from '../../utils/hotkeyMoveOptions'
import type { HotkeyMoveOption } from '../../utils/hotkeyMoveOptions'
import './HotkeyMoveSelect.css'

interface HotkeyMoveSelectProps {
  hotkeys: HotkeyListItem[]
  existingMoves: Move[]
  onAdd: (option: HotkeyMoveOption) => void
}

export function HotkeyMoveSelect({
  hotkeys,
  existingMoves,
  onAdd,
}: HotkeyMoveSelectProps) {
  const [selectedKey, setSelectedKey] = useState('')

  const options = useMemo(() => buildHotkeyMoveOptions(hotkeys), [hotkeys])
  const groupedOptions = useMemo(
    () => groupHotkeyMoveOptions(options),
    [options],
  )

  const usedKeys = useMemo(
    () =>
      new Set(
        existingMoves
          .filter((move) => move.hotkeyId && move.hotkeyActionId)
          .map((move) => `${move.hotkeyId}:${move.hotkeyActionId}`),
      ),
    [existingMoves],
  )

  const handleAdd = () => {
    const option = findHotkeyMoveOption(options, selectedKey)
    if (!option || usedKeys.has(option.key)) return

    onAdd(option)
    setSelectedKey('')
  }

  if (hotkeys.length === 0) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        Create a hotkey list first to add moves.
      </p>
    )
  }

  if (options.length === 0) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        No hotkey actions available yet.
      </p>
    )
  }

  return (
    <div className="hotkey-move-select">
      <select
        value={selectedKey}
        onChange={(event) => setSelectedKey(event.target.value)}
        className="hotkey-move-select-input"
      >
        <option value="">Select hotkey…</option>
        {groupedOptions.map((group) => (
          <optgroup key={group.category} label={group.label}>
            {group.options.map((option) => (
              <option
                key={option.key}
                value={option.key}
                disabled={usedKeys.has(option.key)}
              >
                {option.label}
                {usedKeys.has(option.key) ? ' (added)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-primary hotkey-move-select-add"
        onClick={handleAdd}
        disabled={!selectedKey || usedKeys.has(selectedKey)}
      >
        Add
      </button>
    </div>
  )
}

export function formatRoutineMoveLabel(
  move: Move,
  hotkeys: HotkeyListItem[],
): string {
  const hotkey = move.hotkeyId
    ? hotkeys.find((item) => item.id === move.hotkeyId)
    : undefined
  const categoryLabel = move.category
    ? MOVE_CATEGORY_LABELS[move.category]
    : null

  if (hotkey) {
    return categoryLabel
      ? `${move.name} · ${hotkey.name} (${categoryLabel})`
      : `${move.name} · ${hotkey.name}`
  }

  return move.name
}
