import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import { discordLog } from './discordLog'
import { getSaveRoot } from './saveRoot'

export function getEnvPath(): string {
  return path.join(getSaveRoot(), '.env')
}

export interface DiscordEnvConfig {
  token: string
  clientId: string
  ownerId: string
}

const DISCORD_KEYS = {
  token: 'DISCORD_BOT_TOKEN',
  clientId: 'DISCORD_CLIENT_ID',
  ownerId: 'DISCORD_OWNER_ID',
} as const

export async function loadEnvFile(): Promise<void> {
  dotenv.config({ path: getEnvPath(), override: true })
}

export async function readDiscordConfigFile(): Promise<DiscordEnvConfig> {
  try {
    const contents = await fs.readFile(getEnvPath(), 'utf8')
    const parsed = dotenv.parse(contents)
    return {
      token: parsed.DISCORD_BOT_TOKEN?.trim() ?? '',
      clientId: parsed.DISCORD_CLIENT_ID?.trim() ?? '',
      ownerId: parsed.DISCORD_OWNER_ID?.trim() ?? '',
    }
  } catch {
    return { token: '', clientId: '', ownerId: '' }
  }
}

function upsertEnvLines(
  contents: string,
  values: Record<string, string>,
): string {
  const lines = contents.length > 0 ? contents.split('\n') : []
  const remaining = new Set(Object.keys(values))

  const updated = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/)
    if (!match) return line

    const key = match[1]
    if (!(key in values)) return line

    remaining.delete(key)
    return `${key}=${values[key]}`
  })

  for (const key of remaining) {
    updated.push(`${key}=${values[key]}`)
  }

  return updated.join('\n').replace(/\n?$/, '\n')
}

export async function saveDiscordConfig(config: DiscordEnvConfig): Promise<void> {
  const token = config.token.trim()
  const clientId = config.clientId.trim()
  const ownerId = config.ownerId.trim()

  let existing = ''
  try {
    existing = await fs.readFile(getEnvPath(), 'utf8')
  } catch {
    existing = `# Discord — shared bot token + app id; each user sets their own Discord User ID\n`
  }

  const nextContents = upsertEnvLines(existing, {
    [DISCORD_KEYS.token]: token,
    [DISCORD_KEYS.clientId]: clientId,
    [DISCORD_KEYS.ownerId]: ownerId,
  })

  const envPath = getEnvPath()
  await fs.writeFile(envPath, nextContents, 'utf8')
  dotenv.config({ path: envPath, override: true })

  discordLog('Saved Discord config to .env', {
    envPath,
    hasToken: Boolean(token),
    hasClientId: Boolean(clientId),
    hasOwnerId: Boolean(ownerId),
  })
}
