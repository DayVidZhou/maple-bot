import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useMemo, useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRegistryContext } from '../../context/RegistryContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { toRegistryRoutine } from '../../hooks/useRoutine'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import { formatPointCoord } from '../../types/routine'
import type { User } from '../../types/user'
import { USER_NOT_FOUND } from '../../types/user'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import {
  filterMovesForProfile,
  formatRoutineMoveLabel,
  HotkeyMoveSelect,
  HotkeyProfileSelect,
} from './HotkeyMoveSelect'
import { SelectedMoveFields } from './SelectedMoveFields'
import './RoutinesDialog.css'

export function RoutinesDialog() {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()
  const { addRoutine, updateRoutine, hotkeys } = useRegistryContext()
  const {
    routinesOpen,
    setRoutinesOpen,
    editingRoutineId,
    routine,
    selectedPointId,
    selectedMoveId,
    selectedPoint,
    selectedMove,
    setSelectedPointId,
    setSelectedMoveId,
    addPoint,
    deleteSelectedPoint,
    addMove,
    deleteSelectedMove,
    togglePointMove,
    resetRoutine,
    setRoutineName,
    setSelectedPointName,
    setHotkeyProfileId,
    updatePointPosition,
    updateSelectedMove,
    markDraftSaved,
  } = useRoutineContext()

  const [saveError, setSaveError] = useState<string | null>(null)
  const [user, setUser] = useState<User>(USER_NOT_FOUND)

  const profileMoves = useMemo(
    () => filterMovesForProfile(routine.moves, routine.hotkeyProfileId),
    [routine.moves, routine.hotkeyProfileId],
  )

  useEffect(() => {
    if (!routinesOpen || routine.hotkeyProfileId || hotkeys.length === 0) return
    setHotkeyProfileId(hotkeys[0].id)
  }, [routinesOpen, routine.hotkeyProfileId, hotkeys, setHotkeyProfileId])

  const canSave = routine.points.length >= 1

  const handleAddPoint = () => {
    if (user.isUserFound && videoRef.current) {
      const cropWidth = Math.floor(
        videoRef.current.videoWidth * (focusSize.widthPercent / 100),
      )
      const cropHeight = Math.floor(
        videoRef.current.videoHeight * (focusSize.heightPercent / 100),
      )

      if (cropWidth > 0 && cropHeight > 0) {
        addPoint({
          x: user.location.x / cropWidth,
          y: user.location.y / cropHeight,
        })
        return
      }
    }

    addPoint({ x: 0.5, y: 0.5 })
  }

  const handleSave = () => {
    if (!canSave) {
      setSaveError('Add at least one point before saving.')
      return
    }

    const payload = toRegistryRoutine(routine)
    if (editingRoutineId) {
      updateRoutine(editingRoutineId, payload)
    } else {
      addRoutine(payload)
    }
    markDraftSaved()
    resetRoutine()
    setSaveError(null)
    setRoutinesOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setSaveError(null)
    setRoutinesOpen(open)
  }

  return (
    <Dialog.Root open={routinesOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="routines-dialog-overlay" />
        <Dialog.Content className="routines-dialog">
          <div className="routines-dialog-header">
            <Dialog.Title className="routines-dialog-title">Routines</Dialog.Title>
            <Dialog.Close className="routines-dialog-close" aria-label="Close">
              ×
            </Dialog.Close>
          </div>

          <div className="routines-dialog-body">
            <section className="routines-panel routines-panel-minimap">
              <label className="routines-name-field">
                <span>Routine name</span>
                <input
                  type="text"
                  value={routine.name}
                  onChange={(event) => setRoutineName(event.target.value)}
                />
              </label>
              <h3>Mini Map</h3>
              <FocusRegionView
                className="routines-minimap-view"
                onCanvasClick={addPoint}
                onUserChange={setUser}
                onPointMove={updatePointPosition}
                onPointSelect={setSelectedPointId}
                clickable={isCapturing}
                draggablePoints={isCapturing}
                emptyMessage="Start screen capture to edit routine points"
              />
              <p className="routines-hint">
                Click the mini map to place a point, drag existing points to
                reposition them, or use Add Point to snap to the tracked user
                marker.
              </p>
            </section>

            <section className="routines-panel routines-panel-points">
              <h3>Points</h3>
              <div className="routines-point-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddPoint}
                  disabled={!isCapturing}
                >
                  Add Point
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={deleteSelectedPoint}
                  disabled={!selectedPointId}
                >
                  Delete Point
                </button>
              </div>
              {selectedPoint && (
                <label className="routines-name-field">
                  <span>Point name</span>
                  <input
                    type="text"
                    value={selectedPoint.name}
                    onChange={(event) =>
                      setSelectedPointName(event.target.value)
                    }
                  />
                </label>
              )}
              <ul className="routines-list">
                {routine.points.length === 0 ? (
                  <li className="routines-list-empty">No points yet</li>
                ) : (
                  routine.points.map((point, index) => (
                    <li key={point.id}>
                      <button
                        type="button"
                        className={`routines-list-item ${
                          point.id === selectedPointId ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedPointId(point.id)}
                      >
                        <span className="routines-list-index">{index + 1}</span>
                        <span className="routines-list-label">{point.name}</span>
                        <span className="routines-list-meta">
                          {formatPointCoord(point)}
                        </span>
                        <span className="routines-list-meta">
                          {point.moveIds.length} move
                          {point.moveIds.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="routines-panel routines-panel-moves">
              <h3>Moves</h3>
              <HotkeyProfileSelect
                hotkeys={hotkeys}
                profileId={routine.hotkeyProfileId}
                onChange={setHotkeyProfileId}
              />
              <ul className="routines-list">
                {profileMoves.length === 0 ? (
                  <li className="routines-list-empty">
                    {routine.hotkeyProfileId
                      ? 'No moves added for this profile yet'
                      : 'Select a hotkey profile to add moves'}
                  </li>
                ) : (
                  profileMoves.map((move) => (
                    <li key={move.id}>
                      <button
                        type="button"
                        className={`routines-list-item ${
                          move.id === selectedMoveId ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedMoveId(move.id)}
                      >
                        {formatRoutineMoveLabel(
                          move,
                          hotkeys,
                          routine.hotkeyProfileId,
                          profileMoves,
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <HotkeyMoveSelect
                hotkeys={hotkeys}
                profileId={routine.hotkeyProfileId}
                onAdd={addMove}
              />

              {selectedMove && (
                <SelectedMoveFields
                  move={selectedMove}
                  onChange={updateSelectedMove}
                />
              )}

              <button
                type="button"
                className="btn btn-danger routines-delete-move"
                onClick={deleteSelectedMove}
                disabled={!selectedMoveId}
              >
                Delete Move
              </button>

              {selectedPoint && (
                <div className="routines-point-moves">
                  <h4>Moves at selected point</h4>
                  {profileMoves.length === 0 ? (
                    <p className="routines-hint">Add hotkey moves to assign them.</p>
                  ) : (
                    <ul className="routines-move-checklist">
                      {profileMoves.map((move) => {
                        const checked = selectedPoint.moveIds.includes(move.id)
                        return (
                          <li key={move.id}>
                            <label className="routines-move-check">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  togglePointMove(selectedPoint.id, move.id)
                                }
                              />
                              <span>
                                {formatRoutineMoveLabel(
                                  move,
                                  hotkeys,
                                  routine.hotkeyProfileId,
                                  profileMoves,
                                )}
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="routines-dialog-footer">
            {saveError && <p className="routines-save-error">{saveError}</p>}
            <div className="routines-dialog-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetRoutine}
              >
                Reset Routine
              </button>
              <button
                type="button"
                className="btn btn-primary routines-save-btn"
                onClick={handleSave}
                disabled={!canSave}
              >
                Save {editingRoutineId ? 'Changes' : 'Routine'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
