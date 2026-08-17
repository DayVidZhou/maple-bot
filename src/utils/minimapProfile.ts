import {
  DEFAULT_FOCUS_SIZE,
  FOCUS_SIZE_LIMITS,
  type FocusRegionSize,
} from '../types/focusRegion'
import {
  createId,
  defaultRegistryName,
  type MinimapProfileListItem,
} from '../types/registry'

function clampPercent(value: number): number {
  return Math.min(
    FOCUS_SIZE_LIMITS.max,
    Math.max(FOCUS_SIZE_LIMITS.min, Math.round(value)),
  )
}

export function normalizeMinimapProfile(
  profile: MinimapProfileListItem,
): MinimapProfileListItem {
  return {
    ...profile,
    widthPercent: clampPercent(profile.widthPercent),
    heightPercent: clampPercent(profile.heightPercent),
  }
}

export function clampFocusRegionSize(size: FocusRegionSize): FocusRegionSize {
  return {
    widthPercent: clampPercent(size.widthPercent),
    heightPercent: clampPercent(size.heightPercent),
  }
}

export function createMinimapProfile(
  name: string,
  size: FocusRegionSize = DEFAULT_FOCUS_SIZE,
): MinimapProfileListItem {
  const trimmed = name.trim() || defaultRegistryName('minimap', 0)
  const clamped = clampFocusRegionSize(size)

  return normalizeMinimapProfile({
    id: createId(),
    name: trimmed,
    widthPercent: clamped.widthPercent,
    heightPercent: clamped.heightPercent,
  })
}

export function formatMinimapProfileLabel(profile: MinimapProfileListItem): string {
  return `${profile.name} (${profile.widthPercent}% × ${profile.heightPercent}%)`
}
