import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRegistryContext } from '../../context/RegistryContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { toRegistryRoutine } from '../../hooks/useRoutine'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import { formatPointCoord } from '../../types/routine'
import type { YellowShapeDetection } from '../../utils/detectYellowShape'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import {
  formatRoutineMoveLabel,
  HotkeyMoveSelect,
} from './HotkeyMoveSelect'
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
    setSelectedPointId,
    setSelectedMoveId,
    addPoint,
    deleteSelectedPoint,
    addMove,
    deleteSelectedMove,
    togglePointMove,
    resetRoutine,
    setRoutineName,
    markDraftSaved,
  } = useRoutineContext()

  const [saveError, setSaveError] = useState<string | null>(null)
  const [yellowShape, setYellowShape] = useState<YellowShapeDetection | null>(
    null,
  )

  const canSave = routine.points.length >= 1

  const handleAddPoint = () => {
    if (yellowShape && videoRef.current) {
      const cropWidth = Math.floor(
        videoRef.current.videoWidth * (focusSize.widthPercent / 100),
      )
      const cropHeight = Math.floor(
        videoRef.current.videoHeight * (focusSize.heightPercent / 100),
      )

      if (cropWidth > 0 && cropHeight > 0) {
        addPoint({
          x: yellowShape.x / cropWidth,
          y: yellowShape.y / cropHeight,
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
            <section className="routines-panel routines-panel-preview">
              <h3>Top-Left Focus</h3>
              <FocusRegionView
                onCanvasClick={addPoint}
                onYellowShapeChange={setYellowShape}
                clickable={isCapturing}
                emptyMessage="Start screen capture to edit routine points"
              />
            </section>

            <section className="routines-panel routines-panel-record">
              <h3>Record</h3>
              <label className="routines-name-field">
                <span>Routine name</span>
                <input
                  type="text"
                  value={routine.name}
                  onChange={(event) => setRoutineName(event.target.value)}
                />
              </label>
              <div className="routines-actions">
                <button
                  type="button"
                  className="btn btn-primary routines-action-btn"
                  onClick={handleAddPoint}
                  disabled={!isCapturing}
                >
                  Add Point
                </button>
                <button
                  type="button"
                  className="btn btn-secondary routines-action-btn"
                  onClick={deleteSelectedPoint}
                  disabled={!selectedPointId}
                >
                  Delete Point
                </button>
                <button
                  type="button"
                  className="btn btn-secondary routines-action-btn"
                  onClick={resetRoutine}
                >
                  Reset Routine
                </button>
              </div>
              <p className="routines-hint">
                Click the minimap to place a point, or use Add Point to snap to
                the tracked yellow marker.
              </p>
              {saveError && <p className="routines-save-error">{saveError}</p>}
              <button
                type="button"
                className="btn btn-primary routines-save-btn"
                onClick={handleSave}
                disabled={!canSave}
              >
                Save {editingRoutineId ? 'Changes' : 'Routine'}
              </button>
            </section>

            <section className="routines-panel routines-panel-points">
              <h3>Points</h3>
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
                        <span>{formatPointCoord(point.x, point.y)}</span>
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
              <ul className="routines-list">
                {routine.moves.length === 0 ? (
                  <li className="routines-list-empty">No hotkey moves added yet</li>
                ) : (
                  routine.moves.map((move) => (
                    <li key={move.id}>
                      <button
                        type="button"
                        className={`routines-list-item ${
                          move.id === selectedMoveId ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedMoveId(move.id)}
                      >
                        {formatRoutineMoveLabel(move, hotkeys)}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <HotkeyMoveSelect
                hotkeys={hotkeys}
                existingMoves={routine.moves}
                onAdd={addMove}
              />

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
                  {routine.moves.length === 0 ? (
                    <p className="routines-hint">Add hotkey moves to assign them.</p>
                  ) : (
                    <ul className="routines-move-checklist">
                      {routine.moves.map((move) => {
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
                              <span>{formatRoutineMoveLabel(move, hotkeys)}</span>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
