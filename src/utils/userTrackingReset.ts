/** Set true to clear minimap user tracking on the next detection frame. */
export const userTrackingResetRef = { pending: false }

export function requestUserTrackingReset(): void {
  userTrackingResetRef.pending = true
}
