import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { discordLog, discordWarn } from './discordLog'

const appRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

const envPath = path.join(appRoot, '.env')
const envResult = dotenv.config({ path: envPath })

if (envResult.error) {
  discordWarn('No .env file loaded', { envPath, error: envResult.error.message })
} else {
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
