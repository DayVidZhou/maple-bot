import { useRef, useEffect, type MouseEvent } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import type { NormalizedCoord } from '../../types/routine'
import { useFocusRegionCrop } from '../../hooks/useFocusRegionCrop'
import { displayToNormalizedCoord } from '../../utils/focusRegionCoords'
import type { YellowShapeDetection } from '../../utils/detectYellowShape'
import './FocusRegionView.css'

interface FocusRegionViewProps {
  onCanvasClick?: (coord: NormalizedCoord) => void
  onYellowShapeChange?: (shape: YellowShapeDetection | null) => void
  clickable?: boolean
  className?: string
  emptyMessage?: string
}

export function FocusRegionView({
  onCanvasClick,
  onYellowShapeChange,
  clickable = false,
  className = '',
  emptyMessage = 'Focus region appears here during capture',
}: FocusRegionViewProps) {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()
  const { routine, selectedPointId } = useRoutineContext()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { yellowShape } = useFocusRegionCrop(
    videoRef,
    canvasRef,
    isCapturing,
    focusSize,
    routine.points,
    selectedPointId,
  )

  useEffect(() => {
    onYellowShapeChange?.(yellowShape)
  }, [yellowShape, onYellowShapeChange])

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!clickable || !onCanvasClick || !canvasRef.current) return

    const coord = displayToNormalizedCoord(
      canvasRef.current,
      event.clientX,
      event.clientY,
    )
    if (coord) onCanvasClick(coord)
  }

  return (
    <div className={`focus-region-view ${className}`.trim()}>
      <div className="focus-container">
        {isCapturing ? (
          <canvas
            ref={canvasRef}
            className={`focus-canvas ${clickable ? 'focus-canvas-clickable' : ''}`}
            onClick={handleClick}
          />
        ) : (
          <div className="placeholder focus-placeholder">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
      <FocusRegionMeta
        yellowShape={yellowShape}
        pointCount={routine.points.length}
      />
    </div>
  )
}

function FocusRegionMeta({
  yellowShape,
  pointCount,
}: {
  yellowShape: YellowShapeDetection | null
  pointCount: number
}) {
  return (
    <div className="focus-region-meta">
      {yellowShape && (
        <span>
          Yellow: x {yellowShape.x}, y {yellowShape.y}
        </span>
      )}
      <span>{pointCount} routine point{pointCount === 1 ? '' : 's'}</span>
    </div>
  )
}
