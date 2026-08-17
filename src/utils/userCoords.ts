import type { Coordinates } from '../types/coordinates'
import type { User } from '../types/user'

export function userToNormalized(
  user: User,
  cropWidth: number,
  cropHeight: number,
): Coordinates | null {
  if (!user.isUserFound || cropWidth <= 0 || cropHeight <= 0) {
    return null
  }

  return {
    x: user.location.x / cropWidth,
    y: user.location.y / cropHeight,
  }
}

export function formatNormalizedCoord(coord: Coordinates): string {
  return `(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)})`
}

export function formatMovementCoords(
  user: Coordinates,
  point: Coordinates,
): string {
  return `user ${formatNormalizedCoord(user)} → point ${formatNormalizedCoord(point)}`
}
