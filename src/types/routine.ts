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
  /** Arrow key held while using the move; null = no direction key. */
  direction: MoveDirection | null
}

export function hasMoveDirection(
  direction: MoveDirection | null | undefined,
): direction is MoveDirection {
  return direction === 'left' || direction === 'right'
}

export function formatMoveDirectionLabel(
  direction: MoveDirection | null | undefined,
): string {
  if (!hasMoveDirection(direction)) return 'none'
  return direction
}

export interface MoveDefaults {
  holdDurationSeconds: number
  direction: MoveDirection | null
}

export const DEFAULT_MOVE_DEFAULTS: MoveDefaults = {
  holdDurationSeconds: DEFAULT_MOVE_HOLD_SECONDS,
  direction: null,
}

export interface RoutinePoint extends Coordinates {
  id: string
  name: string
  /** Moves executed in order after arriving at this point. */
  moves: Move[]
}

export interface Routine {
  id: string
  name: string
  points: RoutinePoint[]
  sendDiscordScreenshots: boolean
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
    direction: hasMoveDirection(move.direction) ? move.direction : null,
  }
}

/** Migrate legacy routines that stored moves at routine level + moveIds on points. */
export function normalizeRoutinePoint(
  point: {
    id: string
    name: string
    x: number
    y: number
    moves?: Move[]
    moveIds?: string[]
  },
  legacyRoutineMoves: Move[] = [],
): RoutinePoint {
  if (Array.isArray(point.moves)) {
    return {
      id: point.id,
      name: point.name,
      x: point.x,
      y: point.y,
      moves: point.moves.map(normalizeMove),
    }
  }

  const moves = (point.moveIds ?? [])
    .map((moveId) => legacyRoutineMoves.find((move) => move.id === moveId))
    .filter((move): move is Move => move != null)
    .map(normalizeMove)

  return {
    id: point.id,
    name: point.name,
    x: point.x,
    y: point.y,
    moves,
  }
}

export function normalizeRoutineListItem(item: {
  id: string
  name: string
  hotkeyProfileId?: string | null
  sendDiscordScreenshots?: boolean
  points?: Array<{
    id: string
    name: string
    x: number
    y: number
    moves?: Move[]
    moveIds?: string[]
  }>
  moves?: Move[]
}): {
  id: string
  name: string
  points: RoutinePoint[]
  sendDiscordScreenshots: boolean
} {
  const legacyMoves = (item.moves ?? []).map(normalizeMove)

  return {
    id: item.id,
    name: item.name,
    sendDiscordScreenshots: item.sendDiscordScreenshots === true,
    points: (item.points ?? []).map((point, index) => ({
      ...normalizeRoutinePoint(point, legacyMoves),
      name: point.name ?? defaultPointName(index),
    })),
  }
}

export { formatCoordinates as formatPointCoord } from './coordinates'
