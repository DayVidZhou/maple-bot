export interface FocusRegionSize {
  widthPercent: number
  heightPercent: number
}

export const DEFAULT_FOCUS_SIZE: FocusRegionSize = {
  widthPercent: 25,
  heightPercent: 25,
}

export const FOCUS_SIZE_LIMITS = {
  min: 5,
  max: 100,
} as const
