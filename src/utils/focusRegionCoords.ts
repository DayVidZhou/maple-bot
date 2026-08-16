import type { NormalizedCoord } from '../types/routine'

export function displayToNormalizedCoord(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): NormalizedCoord | null {
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
  coord: NormalizedCoord,
): { x: number; y: number } {
  return {
    x: coord.x * canvas.width,
    y: coord.y * canvas.height,
  }
}
