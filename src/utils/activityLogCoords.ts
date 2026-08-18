import type { MutableRefObject } from 'react'
import type { Coordinates } from '../types/coordinates'
import { ROUTINE_POINT_HIT_RADIUS } from './focusRegionCoords'
import { formatActivityLogCoord } from './userCoords'

export interface ActivityLogCoordContext {
  user: Coordinates | null
  point: Coordinates | null
  pointName?: string
}

export const activityLogCoordContextRef: MutableRefObject<ActivityLogCoordContext> =
  {
    current: { user: null, point: null },
  }

export function formatActivityLogUser(
  user: Coordinates | null | undefined,
): string | undefined {
  if (!user) return undefined
  return formatActivityLogCoord(user)
}

export function formatActivityLogPoint(
  point: Coordinates | null | undefined,
  pointName?: string,
): string | undefined {
  if (!point) return undefined
  const coords = formatActivityLogCoord(point)
  return pointName ? `${pointName} · ${coords}` : coords
}

/** How far the live user marker is from the fixed routine target (minimap pixels). */
export function formatCoordDelta(
  user: Coordinates | null | undefined,
  point: Coordinates | null | undefined,
): string | undefined {
  if (!user || !point) return undefined
  const dx = point.x - user.x
  const dy = point.y - user.y
  const distance = Math.hypot(dx, dy)
  if (distance <= ROUTINE_POINT_HIT_RADIUS) return 'At target'
  return `Δx: ${dx.toFixed(1)}, Δy: ${dy.toFixed(1)}`
}

export function appendCoordDelta(
  detail: string | undefined,
  user: Coordinates | null | undefined,
  point: Coordinates | null | undefined,
): string | undefined {
  const delta = formatCoordDelta(user, point)
  if (!delta) return detail
  return detail ? `${detail} · ${delta}` : delta
}

export function activityLogPositions(
  user: Coordinates | null | undefined,
  point: Coordinates | null | undefined,
  pointName?: string,
) {
  return {
    userCoord: formatActivityLogUser(user),
    pointCoord: formatActivityLogPoint(point, pointName),
  }
}

export function activityLogPositionsFromContext() {
  const { user, point, pointName } = activityLogCoordContextRef.current
  return activityLogPositions(user, point, pointName)
}
