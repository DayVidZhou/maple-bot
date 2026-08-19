import dotenv from 'dotenv'
import { discordLog, discordWarn } from './discordLog'
import { ENV_PATH } from './discordConfig'

const envResult = dotenv.config({ path: ENV_PATH, override: true })

if (envResult.error) {
  discordWarn('Discord not configured yet — use the Discord panel in the app', {
    envPath: ENV_PATH,
  })
} else if (process.env.DISCORD_BOT_TOKEN?.trim()) {
  discordLog('Loaded .env', { envPath: ENV_PATH })
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
  ENV_PATH,
  loadEnvFile,
  readDiscordConfigFile,
  saveDiscordConfig,
} from './discordConfig'
export type { DiscordEnvConfig } from './discordConfig'
