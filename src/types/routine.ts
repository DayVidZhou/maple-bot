export type MoveCategory = 'attack' | 'buff' | 'move'

export interface Move {
  id: string
  name: string
  hotkeyId?: string
  hotkeyActionId?: string
  category?: MoveCategory
}

export interface RoutinePoint {
  id: string
  x: number
  y: number
  moveIds: string[]
}

export interface Routine {
  id: string
  name: string
  points: RoutinePoint[]
  moves: Move[]
}

export interface NormalizedCoord {
  x: number
  y: number
}

export function createId(): string {
  return crypto.randomUUID()
}

export function formatPointCoord(x: number, y: number): string {
  return `(${x.toFixed(3)}, ${y.toFixed(3)})`
}
