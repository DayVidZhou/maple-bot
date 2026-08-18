import type { Coordinates } from './coordinates'

export interface User {
  isUserFound: boolean
  location: Coordinates
  /** Marker radius in focus-region pixels; only set when the user is found. */
  radius?: number
}

export const USER_NOT_FOUND: User = {
  isUserFound: false,
  location: { x: 0, y: 0 },
}

export function formatUserLocation(user: User): string {
  if (!user.isUserFound) return 'Not detected'
  return `x: ${user.location.x.toFixed(1)}, y: ${user.location.y.toFixed(1)}`
}
