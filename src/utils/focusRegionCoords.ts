import type { Coordinates } from '../types/coordinates'
import type { RoutinePoint } from '../types/routine'

export const ROUTINE_POINT_HIT_RADIUS = 12

export function displayToNormalizedCoord(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Coordinates | null {
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0 || canvas.width === 0 || canvas.height === 0) {
    return null
  }

  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height)
  const renderedWidth = canvas.width * scale
  const renderedHeight = canvas.height * scale
  const offsetX = (rect.width - renderedWidth) / 2
  const offsetY = (rect.height - renderedHeight) / 2

  const localX = clientX - rect.left - offsetX
  const localY = clientY - rect.top - offsetY

  if (localX < 0 || localY < 0 || localX > renderedWidth || localY > renderedHeight) {
    return null
  }

  return {
    x: localX / renderedWidth,
    y: localY / renderedHeight,
  }
}

export function normalizedToCanvasCoord(
  canvas: HTMLCanvasElement,
  coord: Coordinates,
): Coordinates {
  return {
    x: coord.x * canvas.width,
    y: coord.y * canvas.height,
  }
}

export function displayToCanvasCoord(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Coordinates | null {
  const normalized = displayToNormalizedCoord(canvas, clientX, clientY)
  if (!normalized) return null

  return normalizedToCanvasCoord(canvas, normalized)
}

export function clampNormalizedCoord(coord: Coordinates): Coordinates {
  return {
    x: Math.min(1, Math.max(0, coord.x)),
    y: Math.min(1, Math.max(0, coord.y)),
  }
}

export function findRoutinePointAtClientCoord(
  canvas: HTMLCanvasElement,
  points: RoutinePoint[],
  clientX: number,
  clientY: number,
  hitRadius = ROUTINE_POINT_HIT_RADIUS,
): RoutinePoint | null {
  const canvasCoord = displayToCanvasCoord(canvas, clientX, clientY)
  if (!canvasCoord) return null

  let closest: RoutinePoint | null = null
  let closestDistance = hitRadius

  for (const point of points) {
    const pointCoord = normalizedToCanvasCoord(canvas, point)
    const distance = Math.hypot(
      pointCoord.x - canvasCoord.x,
      pointCoord.y - canvasCoord.y,
    )
    if (distance <= closestDistance) {
      closest = point
      closestDistance = distance
    }
  }

  return closest
}
