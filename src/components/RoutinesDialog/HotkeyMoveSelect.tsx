import { useEffect, useMemo, useState } from 'react'
import type { HotkeyListItem } from '../../types/registry'
import type { Move } from '../../types/routine'
import { formatMoveDirectionLabel } from '../../types/routine'
import {
  buildHotkeyMoveOptions,
  findHotkeyMoveOption,
  groupHotkeyMoveOptions,
  MOVE_CATEGORY_LABELS,
} from '../../utils/hotkeyMoveOptions'
import type { HotkeyMoveOption } from '../../utils/hotkeyMoveOptions'
import { resolveMoveButtonKey } from '../../utils/resolveHotkeyAction'
import {
  DEFAULT_MOVE_DEFAULTS,
  type MoveDefaults,
} from '../../types/routine'
import { MoveDurationDirectionFields } from './MoveDurationDirectionFields'
import './HotkeyMoveSelect.css'

interface HotkeyMoveSelectProps {
  hotkeys: HotkeyListItem[]
  profileId: string | null
  onAdd: (option: HotkeyMoveOption, defaults: MoveDefaults) => void
  disabled?: boolean
}

export function HotkeyMoveSelect({
  hotkeys,
  profileId,
  onAdd,
  disabled = false,
}: HotkeyMoveSelectProps) {
  const [selectedKey, setSelectedKey] = useState('')
  const [moveDefaults, setMoveDefaults] = useState<MoveDefaults>(
    DEFAULT_MOVE_DEFAULTS,
  )

  useEffect(() => {
    setSelectedKey('')
  }, [profileId])

  const options = useMemo(
    () => buildHotkeyMoveOptions(hotkeys, profileId),
    [hotkeys, profileId],
  )
  const groupedOptions = useMemo(
    () => groupHotkeyMoveOptions(options),
    [options],
  )

  const resetMoveDefaults = () => {
    setMoveDefaults(DEFAULT_MOVE_DEFAULTS)
  }

  const handleAdd = () => {
    const option = findHotkeyMoveOption(options, selectedKey)
    if (!option) return

    onAdd(option, moveDefaults)
    setSelectedKey('')
    resetMoveDefaults()
  }

  if (disabled) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        Select a point before adding moves.
      </p>
    )
  }

  if (hotkeys.length === 0) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        Create a hotkey profile first to add moves.
      </p>
    )
  }

  if (!profileId) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        Select a hotkey profile in the sidebar to add moves.
      </p>
    )
  }

  if (options.length === 0) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        No actions configured in this profile yet.
      </p>
    )
  }

  return (
    <div className="hotkey-move-select-block">
      <div className="hotkey-move-select">
        <select
          value={selectedKey}
          onChange={(event) => setSelectedKey(event.target.value)}
          className="hotkey-move-select-input"
        >
          <option value="">Select move…</option>
          {groupedOptions.map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary hotkey-move-select-add"
          onClick={handleAdd}
          disabled={!selectedKey}
        >
          Add
        </button>
      </div>
      <MoveDurationDirectionFields
        holdDurationSeconds={moveDefaults.holdDurationSeconds}
        direction={moveDefaults.direction}
        onChange={(patch) =>
          setMoveDefaults((current) => ({ ...current, ...patch }))
        }
      />
    </div>
  )
}

function buildMoveBaseLabel(
  move: Move,
  hotkeys: HotkeyListItem[],
  profileId?: string | null,
): string {
  const hotkey = move.hotkeyId
    ? hotkeys.find((item) => item.id === move.hotkeyId)
    : undefined
  const categoryLabel = move.category
    ? MOVE_CATEGORY_LABELS[move.category]
    : null
  const showProfileName = !profileId || move.hotkeyId !== profileId

  if (hotkey && showProfileName) {
    return categoryLabel
      ? `${move.name} · ${hotkey.name} (${categoryLabel})`
      : `${move.name} · ${hotkey.name}`
  }

  return categoryLabel ? `${move.name} (${categoryLabel})` : move.name
}

export function formatRoutineMoveLabel(
  move: Move,
  hotkeys: HotkeyListItem[],
  profileId?: string | null,
  profileMoves?: Move[],
): string {
  const baseLabel = buildMoveBaseLabel(move, hotkeys, profileId)
  const buttonKey = resolveMoveButtonKey(move, hotkeys) ?? 'no key'
  const directionLabel = formatMoveDirectionLabel(move.direction)

  if (!profileMoves) {
    return `${baseLabel} · ${buttonKey} · ${move.holdDurationSeconds}s · ${directionLabel}`
  }

  const sameActionMoves = profileMoves.filter(
    (candidate) =>
      candidate.hotkeyId === move.hotkeyId &&
      candidate.hotkeyActionId === move.hotkeyActionId,
  )
  const duplicateIndex = sameActionMoves.findIndex(
    (candidate) => candidate.id === move.id,
  )
  const duplicateSuffix =
    sameActionMoves.length > 1 && duplicateIndex >= 0
      ? ` #${duplicateIndex + 1}`
      : ''

  return `${baseLabel}${duplicateSuffix} · ${buttonKey} · ${move.holdDurationSeconds}s · ${directionLabel}`
}

export function filterMovesForProfile(
  moves: Move[],
  profileId: string | null,
): Move[] {
  if (!profileId) return moves
  return moves.filter((move) => move.hotkeyId === profileId)
}
