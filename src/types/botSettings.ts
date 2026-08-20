export interface BotSettings {
  lieDetectorEnabled: boolean
  lieDetectorMatchThreshold: number
  lieDetectorAlertCooldownMs: number
  lieDetectorStopRoutine: boolean
  lieDetectorScanIntervalMs: number
}

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  lieDetectorEnabled: false,
  lieDetectorMatchThreshold: 0.68,
  lieDetectorAlertCooldownMs: 60_000,
  lieDetectorStopRoutine: true,
  lieDetectorScanIntervalMs: 300,
}

export function normalizeBotSettings(
  settings: Partial<BotSettings> | null | undefined,
): BotSettings {
  return {
    lieDetectorEnabled: settings?.lieDetectorEnabled ?? DEFAULT_BOT_SETTINGS.lieDetectorEnabled,
    lieDetectorMatchThreshold:
      clamp(settings?.lieDetectorMatchThreshold, 0.5, 0.98) ??
      DEFAULT_BOT_SETTINGS.lieDetectorMatchThreshold,
    lieDetectorAlertCooldownMs:
      clamp(settings?.lieDetectorAlertCooldownMs, 5_000, 600_000) ??
      DEFAULT_BOT_SETTINGS.lieDetectorAlertCooldownMs,
    lieDetectorStopRoutine:
      settings?.lieDetectorStopRoutine ?? DEFAULT_BOT_SETTINGS.lieDetectorStopRoutine,
    lieDetectorScanIntervalMs:
      clamp(settings?.lieDetectorScanIntervalMs, 100, 2_000) ??
      DEFAULT_BOT_SETTINGS.lieDetectorScanIntervalMs,
  }
}

function clamp(value: number | undefined, min: number, max: number): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined
  return Math.min(max, Math.max(min, value))
}
