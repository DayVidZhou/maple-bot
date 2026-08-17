export interface Coordinates {
  x: number
  y: number
}

export function formatCoordinates({ x, y }: Coordinates): string {
  return `(${x.toFixed(3)}, ${y.toFixed(3)})`
}
