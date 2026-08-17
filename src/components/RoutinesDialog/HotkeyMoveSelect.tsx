import { useEffect, useMemo, useState } from 'react'
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
  profileId: string | null
  onAdd: (option: HotkeyMoveOption) => void
}

export function HotkeyMoveSelect({
  hotkeys,
  profileId,
  onAdd,
}: HotkeyMoveSelectProps) {
  const [selectedKey, setSelectedKey] = useState('')

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

  const handleAdd = () => {
    const option = findHotkeyMoveOption(options, selectedKey)
    if (!option) return

    onAdd(option)
    setSelectedKey('')
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
        Select a hotkey profile to add moves.
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

  if (!profileMoves) {
    return `${baseLabel} · ${move.holdDurationSeconds}s · ${move.direction}`
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

  return `${baseLabel}${duplicateSuffix} · ${move.holdDurationSeconds}s · ${move.direction}`
}

interface HotkeyProfileSelectProps {
  hotkeys: HotkeyListItem[]
  profileId: string | null
  onChange: (profileId: string | null) => void
}

export function HotkeyProfileSelect({
  hotkeys,
  profileId,
  onChange,
}: HotkeyProfileSelectProps) {
  if (hotkeys.length === 0) {
    return (
      <p className="routines-hint hotkey-move-select-empty">
        Create a hotkey profile in the sidebar first.
      </p>
    )
  }

  return (
    <label className="routines-name-field hotkey-profile-select">
      <span>Hotkey profile</span>
      <select
        value={profileId ?? ''}
        onChange={(event) =>
          onChange(event.target.value ? event.target.value : null)
        }
        className="hotkey-move-select-input hotkey-profile-select-input"
      >
        <option value="">Select profile…</option>
        {hotkeys.map((hotkey) => (
          <option key={hotkey.id} value={hotkey.id}>
            {hotkey.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function filterMovesForProfile(
  moves: Move[],
  profileId: string | null,
): Move[] {
  if (!profileId) return moves
  return moves.filter((move) => move.hotkeyId === profileId)
}
