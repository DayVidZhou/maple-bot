import type { MutableRefObject } from 'react'
import type { Coordinates } from '../types/coordinates'
import { formatNormalizedCoord } from './userCoords'

export interface ActivityLogCoordContext {
  user: Coordinates | null
  point: Coordinates | null
}

export const activityLogCoordContextRef: MutableRefObject<ActivityLogCoordContext> =
  {
    current: { user: null, point: null },
  }

export function formatActivityLogUser(
  user: Coordinates | null | undefined,
): string | undefined {
  if (!user) return undefined
  return formatNormalizedCoord(user)
}

export function formatActivityLogPoint(
  point: Coordinates | null | undefined,
): string | undefined {
  if (!point) return undefined
  return formatNormalizedCoord(point)
}

export function activityLogPositions(
  user: Coordinates | null | undefined,
  point: Coordinates | null | undefined,
) {
  return {
    userCoord: formatActivityLogUser(user),
    pointCoord: formatActivityLogPoint(point),
  }
}

export function activityLogPositionsFromContext() {
  const { user, point } = activityLogCoordContextRef.current
  return activityLogPositions(user, point)
}
