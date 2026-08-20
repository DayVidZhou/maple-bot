import dotenv from 'dotenv'
import { discordLog, discordWarn } from './discordLog'
import { getEnvPath } from './discordConfig'

const envPath = getEnvPath()
const envResult = dotenv.config({ path: envPath, override: true })

if (envResult.error) {
  discordWarn('Discord not configured yet — use the Discord panel in the app', {
    envPath,
  })
} else if (process.env.DISCORD_BOT_TOKEN?.trim()) {
  discordLog('Loaded .env', { envPath })
}

export function getDiscordConfig() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim()
  const clientId = process.env.DISCORD_CLIENT_ID?.trim()
  const ownerId = process.env.DISCORD_OWNER_ID?.trim()

  return { token, clientId, ownerId }
}

export function logDiscordConfigSummary(context: string) {
  const { token, clientId, ownerId } = getDiscordConfig()
  discordLog(context, {
    hasToken: Boolean(token),
    hasClientId: Boolean(clientId),
    hasOwnerId: Boolean(ownerId),
  })
}

export {
  getEnvPath,
  loadEnvFile,
  readDiscordConfigFile,
  saveDiscordConfig,
} from './discordConfig'
export type { DiscordEnvConfig } from './discordConfig'
