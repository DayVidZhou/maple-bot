import * as Dialog from '@radix-ui/react-dialog'
import { useMemo, useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRegistryContext } from '../../context/RegistryContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { toRegistryRoutine } from '../../hooks/useRoutine'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import {
  formatRoutinePointCoord,
  getMinimapCropSize,
  type MinimapCropSize,
} from '../../utils/userCoords'
import type { User } from '../../types/user'
import { USER_NOT_FOUND } from '../../types/user'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import { formatRoutineMoveLabel, HotkeyMoveSelect } from './HotkeyMoveSelect'
import { SelectedMoveFields } from './SelectedMoveFields'
import './RoutinesDialog.css'

export function RoutinesDialog() {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()
  const { addRoutine, updateRoutine, hotkeys, selectedHotkeyId } =
    useRegistryContext()
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
    resetRoutine,
    setRoutineName,
    setSelectedPointName,
    updatePointPosition,
    updateSelectedMove,
    markDraftSaved,
  } = useRoutineContext()

  const [saveError, setSaveError] = useState<string | null>(null)
  const [user, setUser] = useState<User>(USER_NOT_FOUND)
  const [cropSize, setCropSize] = useState<MinimapCropSize | null>(null)

  const activeHotkeyProfile = useMemo(
    () => hotkeys.find((hotkey) => hotkey.id === selectedHotkeyId) ?? null,
    [hotkeys, selectedHotkeyId],
  )

  const pointMoves = useMemo(
    () => selectedPoint?.moves ?? [],
    [selectedPoint],
  )

  const canSave = routine.points.length >= 1

  const formatPointLabel = (point: { x: number; y: number; moves: unknown[] }) =>
    formatRoutinePointCoord(point, cropSize)

  const handleAddPoint = () => {
    if (user.isUserFound && cropSize) {
      addPoint({
        x: user.location.x / cropSize.width,
        y: user.location.y / cropSize.height,
      })
      return
    }

    const video = videoRef.current
    const fallbackCrop = video
      ? getMinimapCropSize(
          video.videoWidth,
          video.videoHeight,
          focusSize,
        )
      : null

    if (user.isUserFound && fallbackCrop) {
      addPoint({
        x: user.location.x / fallbackCrop.width,
        y: user.location.y / fallbackCrop.height,
      })
      return
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
                onUserFrame={({ cropWidth, cropHeight }) => {
                  setCropSize(
                    cropWidth > 0 && cropHeight > 0
                      ? { width: cropWidth, height: cropHeight }
                      : null,
                  )
                }}
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
                          {formatPointLabel(point)}
                        </span>
                        <span className="routines-list-meta">
                          {point.moves.length} move
                          {point.moves.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="routines-panel routines-panel-moves">
              <h3>Moves</h3>
              {selectedPoint ? (
                <p className="routines-hint routines-moves-point-label">
                  At <strong>{selectedPoint.name}</strong> — run in list order
                  after arriving.
                </p>
              ) : (
                <p className="routines-hint routines-moves-point-label">
                  Select a point to add and edit its moves.
                </p>
              )}
              <p className="routines-hint routines-moves-point-label">
                {activeHotkeyProfile
                  ? `Using hotkey profile "${activeHotkeyProfile.name}" from the sidebar.`
                  : 'Select a hotkey profile in the sidebar to add moves.'}
              </p>
              <ul className="routines-list">
                {!selectedPoint ? (
                  <li className="routines-list-empty">Select a point first</li>
                ) : pointMoves.length === 0 ? (
                  <li className="routines-list-empty">
                    {selectedHotkeyId
                      ? 'No moves for this point yet'
                      : 'Select a hotkey profile in the sidebar to add moves'}
                  </li>
                ) : (
                  pointMoves.map((move) => (
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
                          selectedHotkeyId,
                          pointMoves,
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <HotkeyMoveSelect
                hotkeys={hotkeys}
                profileId={selectedHotkeyId}
                onAdd={addMove}
                disabled={!selectedPointId}
              />

              {selectedMove && (
                <SelectedMoveFields
                  move={selectedMove}
                  hotkeys={hotkeys}
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
