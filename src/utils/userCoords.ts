import type { Coordinates } from '../types/coordinates'
import type { FocusRegionSize } from '../types/focusRegion'
import type { User } from '../types/user'
import { formatCoordinates } from '../types/coordinates'
import { normalizedToMinimapCoord } from './focusRegionCoords'

export interface MinimapCropSize {
  width: number
  height: number
}

export function getMinimapCropSize(
  sourceWidth: number,
  sourceHeight: number,
  focusSize: FocusRegionSize,
): MinimapCropSize | null {
  if (sourceWidth <= 0 || sourceHeight <= 0) return null

  return {
    width: Math.floor(sourceWidth * (focusSize.widthPercent / 100)),
    height: Math.floor(sourceHeight * (focusSize.heightPercent / 100)),
  }
}

/** Minimap pixel position from detected user marker (matches UI). */
export function userToMinimapCoord(user: User): Coordinates | null {
  if (!user.isUserFound) return null
  return {
    x: user.location.x,
    y: user.location.y,
  }
}

export function pointToMinimapCoord(
  point: Coordinates,
  cropWidth: number,
  cropHeight: number,
): Coordinates {
  return normalizedToMinimapCoord(point, cropWidth, cropHeight)
}

export function formatMinimapCoord(coord: Coordinates): string {
  return `x: ${Math.round(coord.x)}, y: ${Math.round(coord.y)}`
}

/** One decimal place — matches activity log and routine point labels. */
export function formatActivityLogCoord(coord: Coordinates): string {
  return `x: ${coord.x.toFixed(1)}, y: ${coord.y.toFixed(1)}`
}

/** Routine points are stored normalized; show minimap pixels when crop is known. */
export function formatRoutinePointCoord(
  point: Coordinates,
  crop: MinimapCropSize | null,
): string {
  if (!crop) return formatCoordinates(point)
  return formatActivityLogCoord(
    pointToMinimapCoord(point, crop.width, crop.height),
  )
}

export function formatMovementCoords(
  user: Coordinates,
  point: Coordinates,
): string {
  return `user ${formatMinimapCoord(user)} → point ${formatMinimapCoord(point)}`
}

/** @deprecated Use minimap pixel coords via userToMinimapCoord */
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
