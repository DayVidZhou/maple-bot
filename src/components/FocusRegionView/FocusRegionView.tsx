import { useEffect, useRef } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import type { Coordinates } from '../../types/coordinates'
import type { RoutinePoint } from '../../types/routine'
import type { User } from '../../types/user'
import { formatUserLocation } from '../../types/user'
import { useFocusRegionCrop } from '../../hooks/useFocusRegionCrop'
import {
  createCanvasClickHandler,
  useRoutinePointDrag,
} from '../../hooks/useRoutinePointDrag'
import './FocusRegionView.css'

interface FocusRegionViewProps {
  onCanvasClick?: (coord: Coordinates) => void
  onUserChange?: (user: User) => void
  onUserFrame?: (frame: {
    user: User
    cropWidth: number
    cropHeight: number
  }) => void
  onPointMove?: (pointId: string, coord: Coordinates) => void
  onPointSelect?: (pointId: string) => void
  displayPoints?: RoutinePoint[]
  highlightPointId?: string | null
  clickable?: boolean
  draggablePoints?: boolean
  className?: string
  emptyMessage?: string
}

export function FocusRegionView({
  onCanvasClick,
  onUserChange,
  onUserFrame,
  onPointMove,
  onPointSelect,
  displayPoints,
  highlightPointId,
  clickable = false,
  draggablePoints = false,
  className = '',
  emptyMessage = 'Mini map appears here during capture',
}: FocusRegionViewProps) {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()
  const { routine, selectedPointId } = useRoutineContext()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const points = displayPoints ?? routine.points
  const activePointId = highlightPointId ?? selectedPointId

  const { user } = useFocusRegionCrop(
    videoRef,
    canvasRef,
    isCapturing,
    focusSize,
    points,
    activePointId,
    onUserFrame,
  )

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    shouldSuppressClick,
  } = useRoutinePointDrag({
    canvasRef,
    points,
    enabled: draggablePoints && isCapturing,
    onPointMove,
    onPointSelect,
  })

  useEffect(() => {
    onUserChange?.(user)
  }, [user, onUserChange])

  const handleClick = createCanvasClickHandler(
    canvasRef,
    clickable ? onCanvasClick : undefined,
    shouldSuppressClick,
  )

  const canvasClassName = [
    'focus-canvas',
    clickable ? 'focus-canvas-clickable' : '',
    draggablePoints ? 'focus-canvas-draggable-points' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`focus-region-view ${className}`.trim()}>
      <div className="focus-container">
        {isCapturing ? (
          <canvas
            ref={canvasRef}
            className={canvasClassName}
            onClick={handleClick}
            onPointerDown={draggablePoints ? handlePointerDown : undefined}
            onPointerMove={draggablePoints ? handlePointerMove : undefined}
            onPointerUp={draggablePoints ? handlePointerUp : undefined}
            onPointerCancel={draggablePoints ? handlePointerCancel : undefined}
          />
        ) : (
          <div className="placeholder focus-placeholder">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
      <FocusRegionMeta user={user} pointCount={points.length} />
    </div>
  )
}

function FocusRegionMeta({
  user,
  pointCount,
}: {
  user: User
  pointCount: number
}) {
  return (
    <div className="focus-region-meta">
      <span>User: {formatUserLocation(user)}</span>
      <span>{pointCount} routine point{pointCount === 1 ? '' : 's'}</span>
    </div>
  )
}
