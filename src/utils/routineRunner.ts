import type { ActivityLogInput } from '../types/activityLog'
import type { Coordinates } from '../types/coordinates'
import type { HotkeyListItem, RoutineListItem } from '../types/registry'
import type { Move, RoutinePoint } from '../types/routine'
import { ROUTINE_POINT_HIT_RADIUS } from './focusRegionCoords'
import {
  resolveJumpKey,
  resolveMoveAction,
  resolveMoveButtonKey,
} from './resolveHotkeyAction'
import { activityLogPositions } from './activityLogCoords'

export const ROUTINE_POLL_INTERVAL_MS = 50
export const STUCK_X_THRESHOLD_MS = 500
/** ~1px alignment slack on a 500px-wide crop */
export const X_ALIGN_EPSILON = 0.002

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
  getUserNormalized(): Coordinates | null
  getCropSize(): { width: number; height: number } | null
  shouldAbort(): boolean
  onStatus?(message: string): void
  onPointIndexChange?(index: number): void
  onActivityLog?(entry: ActivityLogInput): void
}

function logRoutineActivity(
  deps: RoutineRunnerDeps,
  entry: ActivityLogInput,
  user: Coordinates | null,
  point: Coordinates | null,
): void {
  deps.onActivityLog?.({
    ...entry,
    ...activityLogPositions(user, point),
  })
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

function isInsidePoint(
  user: Coordinates,
  point: RoutinePoint,
  cropWidth: number,
  cropHeight: number,
): boolean {
  const userCanvas = {
    x: user.x * cropWidth,
    y: user.y * cropHeight,
  }
  const pointCanvas = {
    x: point.x * cropWidth,
    y: point.y * cropHeight,
  }

  return (
    Math.hypot(userCanvas.x - pointCanvas.x, userCanvas.y - pointCanvas.y) <=
    ROUTINE_POINT_HIT_RADIUS
  )
}

function movementDirection(
  userX: number,
  pointX: number,
): 'left' | 'right' | null {
  // Player right of point → hold left. Player left of point → hold right.
  if (userX > pointX + X_ALIGN_EPSILON) return 'left'
  if (userX < pointX - X_ALIGN_EPSILON) return 'right'
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
    await sleep(ROUTINE_POLL_INTERVAL_MS)
  }
}

async function moveToPoint(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
  jumpKey: string,
): Promise<void> {
  let heldDirection: 'left' | 'right' | null = null
  let lastUserX: number | null = null
  let lastXChangeTime = Date.now()

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

      const user = deps.getUserNormalized()
      const crop = deps.getCropSize()

      if (!user || !crop) {
        deps.onStatus?.(`Waiting for user marker near ${point.name}...`)
        await sleep(ROUTINE_POLL_INTERVAL_MS)
        continue
      }

      if (isInsidePoint(user, point, crop.width, crop.height)) {
        deps.onStatus?.(`Arrived at ${point.name}`)
        logRoutineActivity(
          deps,
          {
            category: 'routine',
            event: 'Hit point',
            detail: point.name,
          },
          user,
          point,
        )
        return
      }

      const direction = movementDirection(user.x, point.x)

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
              detail: point.name,
            },
            user,
            point,
          )
          await deps.keyboard.pressKey(direction)
          heldDirection = direction
          lastUserX = user.x
          lastXChangeTime = Date.now()
        } else {
          lastUserX = user.x
          lastXChangeTime = Date.now()
        }
      }

      if (heldDirection && lastUserX !== null) {
        if (Math.abs(user.x - lastUserX) > 0.001) {
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
            point,
          )
          await deps.keyboard.tapKey(jumpKey)
          lastXChangeTime = Date.now()
        }
      }

      deps.onStatus?.(`Moving to ${point.name}...`)
      await sleep(ROUTINE_POLL_INTERVAL_MS)
    }
  } finally {
    await releaseDirection()
  }
}

async function executeMove(
  deps: RoutineRunnerDeps,
  move: Move,
  point: RoutinePoint,
  hotkeys: HotkeyListItem[],
): Promise<void> {
  const user = deps.getUserNormalized()
  const buttonKey = resolveMoveButtonKey(move, hotkeys)
  if (!buttonKey) {
    deps.onStatus?.(`Skipping ${move.name} (no key configured)`)
    logRoutineActivity(
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
  deps.onStatus?.(`Using ${move.name}...`)
  logRoutineActivity(
    deps,
    {
      category: 'routine',
      event: 'Use move',
      key: buttonKey,
      detail: `${move.name} · hold ${move.holdDurationSeconds}s · ${move.direction}`,
    },
    user,
    point,
  )

  await deps.keyboard.pressKey(move.direction)
  try {
    await deps.keyboard.pressKey(buttonKey)
    await sleep(Math.max(0, move.holdDurationSeconds * 1000))
    await deps.keyboard.releaseKey(buttonKey)
  } finally {
    await deps.keyboard.releaseKey(move.direction)
  }

  const castTimeMs = (action?.castTimeSeconds ?? 0) * 1000
  if (castTimeMs > 0) {
    await sleep(castTimeMs)
  }
}

async function executePointMoves(
  deps: RoutineRunnerDeps,
  point: RoutinePoint,
  moves: Move[],
  hotkeys: HotkeyListItem[],
): Promise<void> {
  for (const moveId of point.moveIds) {
    assertRunning(deps)
    if (!(await deps.isMapleStoryFocused())) {
      throw new RoutineRunAbortError('MapleStory Worlds is no longer focused')
    }

    const move = moves.find((entry) => entry.id === moveId)
    if (!move) continue

    await executeMove(deps, move, point, hotkeys)
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

  await waitWhile(deps, () => !deps.getUserNormalized())
  const initialUser = deps.getUserNormalized()
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
      const startUser = deps.getUserNormalized()
      logRoutineActivity(
        deps,
        {
          category: 'routine',
          event: 'Move to point',
          detail: point.name,
        },
        startUser,
        point,
      )
      await moveToPoint(deps, point, jumpKey)
      const atPointUser = deps.getUserNormalized()
      logRoutineActivity(
        deps,
        {
          category: 'routine',
          event: 'Execute point moves',
          detail: point.name,
        },
        atPointUser,
        point,
      )
      await executePointMoves(deps, point, routine.moves, hotkeys)
    }
  }
}
