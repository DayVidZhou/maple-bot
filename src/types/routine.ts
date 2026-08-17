import type { Coordinates } from './coordinates'

export type MoveCategory = 'attack' | 'buff' | 'move'
export type MoveDirection = 'left' | 'right'

export const DEFAULT_MOVE_HOLD_SECONDS = 0.3

export interface Move {
  id: string
  name: string
  hotkeyId?: string
  hotkeyActionId?: string
  category?: MoveCategory
  holdDurationSeconds: number
  direction: MoveDirection
}

export interface RoutinePoint extends Coordinates {
  id: string
  name: string
  moveIds: string[]
}

export interface Routine {
  id: string
  name: string
  hotkeyProfileId: string | null
  points: RoutinePoint[]
  moves: Move[]
}

export function createId(): string {
  return crypto.randomUUID()
}

export function defaultPointName(listLength: number): string {
  return `point-${listLength + 1}`
}

export function normalizeMove(move: Move): Move {
  return {
    ...move,
    holdDurationSeconds: move.holdDurationSeconds ?? DEFAULT_MOVE_HOLD_SECONDS,
    direction: move.direction ?? 'right',
  }
}

export { formatCoordinates as formatPointCoord } from './coordinates'
