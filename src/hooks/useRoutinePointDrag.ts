import { useRef, type MouseEvent, type PointerEvent } from 'react'
import type { Coordinates } from '../types/coordinates'
import type { RoutinePoint } from '../types/routine'
import {
  clampNormalizedCoord,
  displayToNormalizedCoord,
  findRoutinePointAtClientCoord,
} from '../utils/focusRegionCoords'

interface UseRoutinePointDragOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  points: RoutinePoint[]
  enabled: boolean
  onPointMove?: (pointId: string, coord: Coordinates) => void
  onPointSelect?: (pointId: string) => void
}

export function useRoutinePointDrag({
  canvasRef,
  points,
  enabled,
  onPointMove,
  onPointSelect,
}: UseRoutinePointDragOptions) {
  const dragPointIdRef = useRef<string | null>(null)
  const suppressClickRef = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || !onPointMove || !canvasRef.current) return

    const point = findRoutinePointAtClientCoord(
      canvasRef.current,
      points,
      event.clientX,
      event.clientY,
    )
    if (!point) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragPointIdRef.current = point.id
    suppressClickRef.current = false
    onPointSelect?.(point.id)
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragPointIdRef.current || !canvasRef.current || !onPointMove) return

    const coord = displayToNormalizedCoord(
      canvasRef.current,
      event.clientX,
      event.clientY,
    )
    if (!coord) return

    suppressClickRef.current = true
    onPointMove(dragPointIdRef.current, clampNormalizedCoord(coord))
  }

  const endDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (dragPointIdRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragPointIdRef.current = null
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    endDrag(event)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLCanvasElement>) => {
    endDrag(event)
  }

  const shouldSuppressClick = () => {
    if (!suppressClickRef.current) return false
    suppressClickRef.current = false
    return true
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    shouldSuppressClick,
    isDragging: () => dragPointIdRef.current !== null,
  }
}

export function createCanvasClickHandler(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onCanvasClick: ((coord: Coordinates) => void) | undefined,
  shouldSuppressClick: () => boolean,
) {
  return (event: MouseEvent<HTMLCanvasElement>) => {
    if (!onCanvasClick || !canvasRef.current || shouldSuppressClick()) return

    const coord = displayToNormalizedCoord(
      canvasRef.current,
      event.clientX,
      event.clientY,
    )
    if (coord) onCanvasClick(coord)
  }
}
