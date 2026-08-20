import type { BotSettings } from './botSettings'

export const BOT_SETTINGS_SAVE_FILE = '.bot-settings-save-file.ts'

export const BOT_SETTINGS_SAVE_VERSION = 1

export interface BotSettingsSaveFile {
  version: typeof BOT_SETTINGS_SAVE_VERSION
  savedAt: string
  settings: BotSettings
}
