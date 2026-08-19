import type { ActivityLogInput } from '../types/activityLog'
import type { Coordinates } from '../types/coordinates'
import type { HotkeyListItem, RoutineListItem } from '../types/registry'
import type { Move, RoutinePoint } from '../types/routine'
import { formatMoveDirectionLabel, hasMoveDirection } from '../types/routine'
import type { BuffRunner } from './buffRunner'
import { ROUTINE_POINT_HIT_RADIUS } from './focusRegionCoords'
import {
  resolveJumpKey,
  resolveMoveAction,
  resolveMoveButtonKey,
  resolveRoutineBuffs,
} from './resolveHotkeyAction'
import { activityLogPositions, appendCoordDelta } from './activityLogCoords'
import { pointToMinimapCoord } from './userCoords'

export const ROUTINE_POLL_INTERVAL_MS = 50
export const STUCK_X_THRESHOLD_MS = 500
export const USER_LOCATION_LOG_INTERVAL_MS = 500
export const USER_LOCATION_LOG_MIN_GAP_MS = 500
/** Minimap pixels — sub-pixel coords from user detection. */
export const USER_LOCATION_MOVE_EPSILON = 0.5
export const POINT_SIDE_EPSILON = 0.05
/** Max X movement per poll tick before treating coords as a bad detection frame. */
export const MAX_RELIABLE_X_STEP = 28

type FacingDirection = 'left' | 'right'

interface FacingState {
  direction: FacingDirection | null
}

function createFacingState(): FacingState {
  return { direction: null }
}

export class RoutineRunAbortError extends Error {
  constructor(message = 'Routine run stopped') {
    super(message)
    this.name = 'RoutineRunAbortError'
  }
}

export interface RoutineRunnerKeyboard {
  pressKey(key: string): Promise<void>
  releaseKey(key: string): Promise<void>
  tapKey(key: string): Promise<void>
}

export interface RoutineRunnerDeps {
  keyboard: RoutineRunnerKeyboard
  focusMapleStory(): Promise<void>
  isMapleStoryFocused(): Promise<boolean>
  getUserMinimapCoord(): Coordinates | null
  getCropSize(): { width: number; height: number } | null
  shouldAbort(): boolean
  buffRunner?: BuffRunner | null
  onStatus?(message: string): void
  onPointIndexChange?(index: number): void
  onActivityLog?(entry: ActivityLogInput): void
}

async function tickBuffs(deps: RoutineRunnerDeps): Promise<void> {
  if (!deps.buffRunner || deps.buffRunner.activeBuffCount === 0) return
  await deps.buffRunner.tick()
}

function logRoutineActivity(
  deps: RoutineRunnerDeps,
  entry: ActivityLogInput,
  user: Coordinates | null,
  point: Coordinates | null,
  pointName?: string,
): void {
  deps.onActivityLog?.({
    ...entry,
    ...activityLogPositions(user, point, pointName),
  })
}

function resolvePointMinimap(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
): Coordinates | null {
  const crop = deps.getCropSize()
  if (!crop) return null
  return pointToMinimapCoord(point, crop.width, crop.height)
}

function logRoutineActivityWithPoint(
  deps: RoutineRunnerDeps,
  entry: ActivityLogInput,
  user: Coordinates | null,
  point: RoutinePoint | null,
  appendDelta = false,
): void {
  const pointMinimap = point ? resolvePointMinimap(deps, point) : null
  logRoutineActivity(
    deps,
    {
      ...entry,
      detail: appendDelta
        ? appendCoordDelta(entry.detail, user, pointMinimap)
        : entry.detail,
    },
    user,
    pointMinimap,
    point?.name,
  )
}

function createUserLocationLogger(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
) {
  let lastLoggedUser: Coordinates | null = null
  let lastLoggedTime = 0

  return (user: Coordinates, detail: string) => {
    const now = Date.now()
    const moved =
      !lastLoggedUser ||
      Math.abs(user.x - lastLoggedUser.x) >= USER_LOCATION_MOVE_EPSILON ||
      Math.abs(user.y - lastLoggedUser.y) >= USER_LOCATION_MOVE_EPSILON
    const intervalElapsed =
      now - lastLoggedTime >= USER_LOCATION_LOG_INTERVAL_MS
    const minGapElapsed = now - lastLoggedTime >= USER_LOCATION_LOG_MIN_GAP_MS

    if ((intervalElapsed || moved) && minGapElapsed) {
      logRoutineActivityWithPoint(
        deps,
        {
          category: 'routine',
          event: 'User location',
          detail,
        },
        user,
        point,
        true,
      )
      lastLoggedUser = user
      lastLoggedTime = now
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function assertRunning(deps: RoutineRunnerDeps): void {
  if (deps.shouldAbort()) {
    throw new RoutineRunAbortError()
  }
}

function isInsidePoint(user: Coordinates, pointMinimap: Coordinates): boolean {
  return (
    Math.hypot(user.x - pointMinimap.x, user.y - pointMinimap.y) <=
    ROUTINE_POINT_HIT_RADIUS
  )
}

function sideOfPoint(userX: number, pointX: number): -1 | 0 | 1 {
  const delta = userX - pointX
  if (Math.abs(delta) <= POINT_SIDE_EPSILON) return 0
  return delta > 0 ? 1 : -1
}

function movementDirection(
  userX: number,
  pointX: number,
): 'left' | 'right' | null {
  // Player right of point → hold left. Player left of point → hold right.
  const side = sideOfPoint(userX, pointX)
  if (side === 1) return 'left'
  if (side === -1) return 'right'
  return null
}

async function waitWhile(
  deps: RoutineRunnerDeps,
  predicate: () => boolean,
): Promise<void> {
  while (predicate()) {
    assertRunning(deps)
    if (!(await deps.isMapleStoryFocused())) {
      throw new RoutineRunAbortError('MapleStory Worlds is no longer focused')
    }
    await tickBuffs(deps)
    await sleep(ROUTINE_POLL_INTERVAL_MS)
  }
}

async function moveToPoint(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
  jumpKey: string,
  facing: FacingState,
): Promise<void> {
  let heldDirection: 'left' | 'right' | null = null
  let lastUserX: number | null = null
  let lastReliableUserX: number | null = null
  let lastXChangeTime = Date.now()
  let lastSideOfPoint: -1 | 1 | null = null
  const logUserLocation = createUserLocationLogger(deps, point)

  const releaseDirection = async () => {
    if (!heldDirection) return
    await deps.keyboard.releaseKey(heldDirection)
    heldDirection = null
  }

  try {
    while (true) {
      assertRunning(deps)
      if (!(await deps.isMapleStoryFocused())) {
        throw new RoutineRunAbortError('MapleStory Worlds is no longer focused')
      }

      const user = deps.getUserMinimapCoord()
      const crop = deps.getCropSize()

      if (!user || !crop) {
        deps.onStatus?.(`Waiting for user marker near ${point.name}...`)
        await sleep(ROUTINE_POLL_INTERVAL_MS)
        continue
      }

      const pointMinimap = pointToMinimapCoord(point, crop.width, crop.height)

      logUserLocation(
        user,
        heldDirection
          ? `Moving ${heldDirection} → ${point.name}`
          : `Targeting ${point.name}`,
      )

      if (isInsidePoint(user, pointMinimap)) {
        deps.onStatus?.(`Arrived at ${point.name}`)
        logRoutineActivity(
          deps,
          {
            category: 'routine',
            event: 'Hit point',
            detail: appendCoordDelta(point.name, user, pointMinimap),
          },
          user,
          pointMinimap,
          point.name,
        )
        return
      }

      const xStep =
        lastReliableUserX !== null
          ? Math.abs(user.x - lastReliableUserX)
          : 0
      const isReliableFrame =
        lastReliableUserX === null || xStep <= MAX_RELIABLE_X_STEP

      if (isReliableFrame) {
        const currentSide = sideOfPoint(user.x, pointMinimap.x)
        if (
          lastSideOfPoint !== null &&
          currentSide !== 0 &&
          currentSide !== lastSideOfPoint
        ) {
          logRoutineActivity(
            deps,
            {
              category: 'routine',
              event: 'Overshot point',
              detail: appendCoordDelta(
                `${point.name} · crossed X`,
                user,
                pointMinimap,
              ),
            },
            user,
            pointMinimap,
            point.name,
          )
        }
        if (currentSide !== 0) {
          lastSideOfPoint = currentSide
        }

        const direction = movementDirection(user.x, pointMinimap.x)

        if (direction !== heldDirection) {
          if (heldDirection) {
            await deps.keyboard.releaseKey(heldDirection)
            heldDirection = null
          }

          if (direction) {
            logRoutineActivity(
              deps,
              {
                category: 'routine',
                event: 'Change direction',
                key: direction,
                detail: appendCoordDelta(point.name, user, pointMinimap),
              },
              user,
              pointMinimap,
              point.name,
            )
            await deps.keyboard.pressKey(direction)
            heldDirection = direction
            facing.direction = direction
            lastUserX = user.x
            lastXChangeTime = Date.now()
          } else {
            lastUserX = user.x
            lastXChangeTime = Date.now()
          }
        }

        if (heldDirection && lastUserX !== null) {
          if (Math.abs(user.x - lastUserX) >= USER_LOCATION_MOVE_EPSILON) {
            lastUserX = user.x
            lastXChangeTime = Date.now()
          } else if (Date.now() - lastXChangeTime >= STUCK_X_THRESHOLD_MS) {
            logRoutineActivity(
              deps,
              {
                category: 'routine',
                event: 'Stuck — jump',
                key: jumpKey,
                detail: `While moving to ${point.name}`,
              },
              user,
              pointMinimap,
            )
            await deps.keyboard.tapKey(jumpKey)
            lastXChangeTime = Date.now()
          }
        }

        lastReliableUserX = user.x
      }

      deps.onStatus?.(`Moving to ${point.name}...`)
      await tickBuffs(deps)
      await sleep(ROUTINE_POLL_INTERVAL_MS)
    }
  } finally {
    await releaseDirection()
  }
}

async function sleepWithUserLocationLogging(
  deps: RoutineRunnerDeps,
  ms: number,
  point: RoutinePoint,
  detail: string,
): Promise<void> {
  if (ms <= 0) return

  const logUserLocation = createUserLocationLogger(deps, point)
  const endTime = Date.now() + ms

  while (Date.now() < endTime) {
    assertRunning(deps)
    const user = deps.getUserMinimapCoord()
    if (user) {
      logUserLocation(user, detail)
    }
    const remaining = endTime - Date.now()
    if (remaining <= 0) break
    await sleep(Math.min(ROUTINE_POLL_INTERVAL_MS, remaining))
  }
}

async function executeMove(
  deps: RoutineRunnerDeps,
  move: Move,
  point: RoutinePoint,
  hotkeys: HotkeyListItem[],
  facing: FacingState,
): Promise<void> {
  const user = deps.getUserMinimapCoord()
  const buttonKey = resolveMoveButtonKey(move, hotkeys)
  if (!buttonKey) {
    deps.onStatus?.(`Skipping ${move.name} (no key configured)`)
    logRoutineActivityWithPoint(
      deps,
      {
        category: 'routine',
        event: 'Skip move',
        detail: `${move.name} (no key configured)`,
      },
      user,
      point,
    )
    return
  }

  const action = resolveMoveAction(move, hotkeys)
  const directionLabel = formatMoveDirectionLabel(move.direction)
  deps.onStatus?.(`Using ${move.name}...`)
  logRoutineActivityWithPoint(
    deps,
    {
      category: 'routine',
      event: 'Use move',
      key: buttonKey,
      detail: `${move.name} · ${buttonKey} · hold ${move.holdDurationSeconds}s · ${directionLabel}`,
    },
    user,
    point,
  )

  const direction = hasMoveDirection(move.direction) ? move.direction : null
  let pressedDirection = false
  if (direction && facing.direction !== direction) {
    await deps.keyboard.pressKey(direction)
    facing.direction = direction
    pressedDirection = true
  }

  try {
    await deps.keyboard.pressKey(buttonKey)
    await sleepWithUserLocationLogging(
      deps,
      Math.max(0, move.holdDurationSeconds * 1000),
      point,
      `Using ${move.name}`,
    )
    await deps.keyboard.releaseKey(buttonKey)
  } finally {
    if (pressedDirection && direction) {
      await deps.keyboard.releaseKey(direction)
    }
  }

  const castTimeMs = (action?.castTimeSeconds ?? 0) * 1000
  if (castTimeMs > 0) {
    await sleepWithUserLocationLogging(
      deps,
      castTimeMs,
      point,
      `Cast ${move.name}`,
    )
  }
}

async function executePointMoves(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
  hotkeys: HotkeyListItem[],
  facing: FacingState,
): Promise<void> {
  for (const move of point.moves) {
    assertRunning(deps)
    if (!(await deps.isMapleStoryFocused())) {
      throw new RoutineRunAbortError('MapleStory Worlds is no longer focused')
    }

    await executeMove(deps, move, point, hotkeys, facing)
  }
}

export async function runRoutineLoop(
  routine: RoutineListItem,
  hotkeys: HotkeyListItem[],
  deps: RoutineRunnerDeps,
): Promise<void> {
  if (routine.points.length === 0) {
    throw new Error('Routine has no points')
  }

  const jumpKey = resolveJumpKey(hotkeys, routine.hotkeyProfileId ?? null)
  if (!jumpKey) {
    throw new Error('Configure a Jump key in the routine hotkey profile')
  }

  await deps.focusMapleStory()
  deps.onActivityLog?.({
    category: 'system',
    event: 'Focus application',
    detail: 'MapleStory Worlds',
  })

  await waitWhile(deps, () => !deps.getUserMinimapCoord())
  const initialUser = deps.getUserMinimapCoord()
  logRoutineActivity(
    deps,
    {
      category: 'system',
      event: 'User marker found',
    },
    initialUser,
    null,
  )

  deps.onStatus?.(`Running ${routine.name}`)
  deps.onActivityLog?.({
    category: 'routine',
    event: 'Routine started',
    detail: routine.name,
  })

  const buffEntries = resolveRoutineBuffs(hotkeys, routine.hotkeyProfileId ?? null)
  if (deps.buffRunner && buffEntries.length > 0) {
    await deps.buffRunner.runInitialSequence()
  }

  const facing = createFacingState()

  while (true) {
    assertRunning(deps)
    if (!(await deps.isMapleStoryFocused())) {
      deps.onActivityLog?.({
        category: 'system',
        event: 'Lost focus',
        detail: 'MapleStory Worlds',
      })
      throw new RoutineRunAbortError('MapleStory Worlds is no longer focused')
    }

    deps.onActivityLog?.({
      category: 'routine',
      event: 'Loop iteration',
      detail: routine.name,
    })

    for (let index = 0; index < routine.points.length; index += 1) {
      assertRunning(deps)
      deps.onPointIndexChange?.(index)

      const point = routine.points[index]
      const startUser = deps.getUserMinimapCoord()
      logRoutineActivityWithPoint(
        deps,
        {
          category: 'routine',
          event: 'Move to point',
          detail: point.name,
        },
        startUser,
        point,
      )
      await moveToPoint(deps, point, jumpKey, facing)
      await tickBuffs(deps)
      const atPointUser = deps.getUserMinimapCoord()
      logRoutineActivityWithPoint(
        deps,
        {
          category: 'routine',
          event: 'Execute point moves',
          detail: point.name,
        },
        atPointUser,
        point,
      )
      await executePointMoves(deps, point, hotkeys, facing)
    }
  }
}
