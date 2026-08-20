import {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type MessageCreateOptions,
} from 'discord.js'
import type { BrowserWindow } from 'electron'
import {
  formatAppDiscordStatus,
  getAppDiscordStatus,
  type AppDiscordStatus,
} from './appStatus'
import { getDiscordConfig, logDiscordConfigSummary } from './env'
import { isApplicationFocused, MAPLESTORY_WORLDS_APP_NAME } from './apps'
import { captureDesktopScreenshot } from './screenshot'
import { requestDiscordRemoteAction } from './discordRemoteControl'
import {
  formatSupportedKeysHint,
  isSupportedKey,
} from './keyboard'
import { discordError, discordLog, discordWarn } from './discordLog'
import { formatDiscordDmError } from './discordDmErrors'
import {
  discordSlashCommandsJson,
  formatDiscordHelpMessage,
} from './discordCommands'

export interface DiscordBotDeps {
  getPlatform: () => NodeJS.Platform
  getMainWindow: () => BrowserWindow | null
}

export const ROUTINE_DISCORD_SCREENSHOT_INTERVAL_MS = 30_000

let activeDiscordClient: Client | null = null

const slashCommands = discordSlashCommandsJson

async function registerSlashCommands(token: string, clientId: string) {
  const rest = new REST({ version: '10' }).setToken(token)
  await rest.put(Routes.applicationCommands(clientId), {
    body: slashCommands,
  })
}

function toReplyOptions(
  payload: string | MessageCreateOptions,
  ephemeral: boolean,
): MessageCreateOptions {
  if (typeof payload === 'string') {
    return { content: payload, ephemeral }
  }

  return { ...payload, ephemeral }
}

async function deliverCommandReply(
  interaction: ChatInputCommandInteraction,
  payload: string | MessageCreateOptions,
): Promise<void> {
  const inDm = !interaction.inGuild()
  const replyOptions = inDm
    ? typeof payload === 'string'
      ? { content: payload }
      : payload
    : toReplyOptions(payload, true)

  if (interaction.deferred) {
    await interaction.editReply(replyOptions)
    return
  }

  if (interaction.replied) {
    await interaction.followUp(replyOptions)
    return
  }

  await interaction.reply(replyOptions)
}

export async function sendOwnerScreenshotDm(
  routineName?: string,
): Promise<void> {
  const { ownerId } = getDiscordConfig()

  discordLog('Sending owner screenshot DM', {
    routineName: routineName ?? null,
    connected: activeDiscordClient?.isReady() ?? false,
    hasOwnerId: Boolean(ownerId),
  })

  if (!activeDiscordClient?.isReady()) {
    throw new Error('Discord bot is not connected')
  }

  if (!ownerId) {
    throw new Error('Your Discord User ID is not configured')
  }

  const owner = await activeDiscordClient.users.fetch(ownerId)
  discordLog('Fetched Discord owner user', { ownerId, ownerTag: owner.tag })

  const png = await captureDesktopScreenshot()
  const file = new AttachmentBuilder(png, { name: 'maple-bot-screenshot.png' })
  const content = routineName
    ? `Routine screenshot · ${routineName}`
    : 'Test screenshot from Maple Bot'

  try {
    await owner.send({ content, files: [file] })
  } catch (err) {
    discordError('Owner screenshot DM failed', err)
    throw new Error(formatDiscordDmError(err))
  }
  discordLog('Owner screenshot DM sent', {
    routineName: routineName ?? null,
    bytes: png.length,
  })
}

export async function sendOwnerTestMessageDm(): Promise<void> {
  const { ownerId } = getDiscordConfig()

  discordLog('Sending owner test message DM', {
    connected: activeDiscordClient?.isReady() ?? false,
    hasOwnerId: Boolean(ownerId),
  })

  if (!activeDiscordClient?.isReady()) {
    throw new Error('Discord bot is not connected')
  }

  if (!ownerId) {
    throw new Error('Your Discord User ID is not configured')
  }

  const owner = await activeDiscordClient.users.fetch(ownerId)
  discordLog('Fetched Discord owner user', { ownerId, ownerTag: owner.tag })

  try {
    await owner.send(
      `Maple Bot test message · ${new Date().toLocaleString()} — Discord DM is working.`,
    )
  } catch (err) {
    discordError('Owner test message DM failed', err)
    throw new Error(formatDiscordDmError(err))
  }
  discordLog('Owner test message DM sent')
}

export async function sendLieDetectorAlertDm(
  matchScore?: number,
): Promise<void> {
  const { ownerId } = getDiscordConfig()

  discordLog('Sending lie detector alert DM', {
    connected: activeDiscordClient?.isReady() ?? false,
    hasOwnerId: Boolean(ownerId),
    matchScore: matchScore ?? null,
  })

  if (!activeDiscordClient?.isReady()) {
    throw new Error('Discord bot is not connected')
  }

  if (!ownerId) {
    throw new Error('Your Discord User ID is not configured')
  }

  const owner = await activeDiscordClient.users.fetch(ownerId)
  const scoreText =
    matchScore != null ? ` (match ${(matchScore * 100).toFixed(1)}%)` : ''
  const png = await captureDesktopScreenshot()
  const file = new AttachmentBuilder(png, { name: 'lie-detector-alert.png' })

  try {
    await owner.send({
      content: `Lie detector detected${scoreText} · ${new Date().toLocaleString()} — check MapleStory Worlds.`,
      files: [file],
    })
  } catch (err) {
    discordError('Lie detector alert DM failed', err)
    throw new Error(formatDiscordDmError(err))
  }

  discordLog('Lie detector alert DM sent', { matchScore: matchScore ?? null })
}

export interface DiscordConnectionStatus {
  enabled: boolean
  connected: boolean
  botTag: string | null
  hasToken: boolean
  hasClientId: boolean
  hasOwnerId: boolean
}

export function getDiscordConnectionStatus(): DiscordConnectionStatus {
  const { token, clientId, ownerId } = getDiscordConfig()

  return {
    enabled: Boolean(token && clientId),
    connected: activeDiscordClient?.isReady() ?? false,
    botTag: activeDiscordClient?.user?.tag ?? null,
    hasToken: Boolean(token),
    hasClientId: Boolean(clientId),
    hasOwnerId: Boolean(ownerId),
  }
}

async function handleScreenshot(interaction: ChatInputCommandInteraction) {
  discordLog('Slash command received: screenshot', {
    userId: interaction.user.id,
    inDm: !interaction.inGuild(),
  })

  const inDm = !interaction.inGuild()
  await interaction.deferReply(inDm ? undefined : { ephemeral: true })

  const png = await captureDesktopScreenshot()
  const file = new AttachmentBuilder(png, { name: 'maple-bot-screenshot.png' })
  await deliverCommandReply(interaction, {
    content: 'Latest capture:',
    files: [file],
  })
  discordLog('Slash command completed: screenshot')
}

async function handleStatus(
  interaction: ChatInputCommandInteraction,
  deps: DiscordBotDeps,
  appStatus: AppDiscordStatus,
) {
  const inDm = !interaction.inGuild()
  if (!inDm) {
    await interaction.deferReply({ ephemeral: true })
  }

  const mapleStoryFocused = await isApplicationFocused(
    MAPLESTORY_WORLDS_APP_NAME,
  )
  const message = formatAppDiscordStatus(appStatus, {
    platform: deps.getPlatform(),
    mapleStoryFocused,
  })

  await deliverCommandReply(interaction, {
    content: ['```', message, '```'].join('\n'),
  })
}

async function handleKeypress(
  interaction: ChatInputCommandInteraction,
  deps: DiscordBotDeps,
  key: string,
) {
  const inDm = !interaction.inGuild()
  const normalizedKey = key.trim().toLowerCase()

  if (!isSupportedKey(normalizedKey)) {
    await interaction.reply({
      content: `Unsupported key "${key}". ${formatSupportedKeysHint()}.`,
      ephemeral: !inDm,
    })
    return
  }

  discordLog('Slash command received: keypress', {
    userId: interaction.user.id,
    key: normalizedKey,
    inDm,
  })

  await interaction.deferReply(inDm ? undefined : { ephemeral: true })
  const result = await requestDiscordRemoteAction(
    deps.getMainWindow(),
    'keypress',
    { key: normalizedKey },
  )
  await deliverCommandReply(
    interaction,
    result.ok ? result.message : `Error: ${result.message}`,
  )
  discordLog('Slash command completed: keypress', {
    key: normalizedKey,
    ok: result.ok,
  })
}

async function handleStart(
  interaction: ChatInputCommandInteraction,
  deps: DiscordBotDeps,
) {
  const inDm = !interaction.inGuild()
  discordLog('Slash command received: start', {
    userId: interaction.user.id,
    inDm,
  })

  await interaction.deferReply(inDm ? undefined : { ephemeral: true })
  const result = await requestDiscordRemoteAction(
    deps.getMainWindow(),
    'start-routine',
  )
  await deliverCommandReply(
    interaction,
    result.ok ? result.message : `Error: ${result.message}`,
  )
  discordLog('Slash command completed: start', { ok: result.ok })
}

async function handleHelp(interaction: ChatInputCommandInteraction) {
  discordLog('Slash command received: help', {
    userId: interaction.user.id,
    inDm: !interaction.inGuild(),
  })

  await deliverCommandReply(interaction, formatDiscordHelpMessage())
  discordLog('Slash command completed: help')
}

async function handleStop(
  interaction: ChatInputCommandInteraction,
  deps: DiscordBotDeps,
) {
  const inDm = !interaction.inGuild()
  discordLog('Slash command received: stop', {
    userId: interaction.user.id,
    inDm,
  })

  await interaction.deferReply(inDm ? undefined : { ephemeral: true })
  const result = await requestDiscordRemoteAction(
    deps.getMainWindow(),
    'stop-routine',
  )
  await deliverCommandReply(
    interaction,
    result.ok ? result.message : `Error: ${result.message}`,
  )
  discordLog('Slash command completed: stop', { ok: result.ok })
}

export async function startDiscordBot(deps: DiscordBotDeps): Promise<Client | null> {
  logDiscordConfigSummary('Starting Discord bot')

  const { token, clientId, ownerId } = getDiscordConfig()

  if (!token || !clientId) {
    discordWarn(
      'Discord bot disabled — set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env',
    )
    return null
  }

  if (!ownerId) {
    discordWarn(
      'DISCORD_OWNER_ID is not set — routine screenshots and test DMs need it',
    )
  }

  discordLog('Logging in to Discord')
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  })

  client.once('ready', async () => {
    discordLog('Bot ready', { tag: client.user?.tag, id: client.user?.id })

    try {
      await registerSlashCommands(token, clientId)
      discordLog('Slash commands registered', {
        commands: slashCommands.map((command) => command.name),
      })
    } catch (err) {
      discordError('Failed to register slash commands', err)
    }
  })

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    discordLog('Interaction received', {
      command: interaction.commandName,
      userId: interaction.user.id,
      inDm: !interaction.inGuild(),
    })

    try {
      if (interaction.commandName === 'help') {
        await handleHelp(interaction)
        return
      }

      if (interaction.commandName === 'screenshot') {
        await handleScreenshot(interaction)
        return
      }

      if (interaction.commandName === 'status') {
        discordLog('Slash command received: status')
        await handleStatus(interaction, deps, getAppDiscordStatus())
        discordLog('Slash command completed: status')
        return
      }

      if (interaction.commandName === 'keypress') {
        const key = interaction.options.getString('key', true)
        await handleKeypress(interaction, deps, key)
        return
      }

      if (interaction.commandName === 'start') {
        await handleStart(interaction, deps)
        return
      }

      if (interaction.commandName === 'stop') {
        await handleStop(interaction, deps)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Command failed unexpectedly'
      discordError('Slash command failed', err, {
        command: interaction.commandName,
      })

      const dmHint =
        err instanceof Error &&
        (err.message.includes('50278') ||
          err.message.includes('no mutual guilds'))
          ? ' Invite MapleBot to a Discord server you are in (Developer Portal → OAuth2 → URL Generator).'
          : err instanceof Error &&
              (err.message.includes('Cannot send messages to this user') ||
                err.message.includes('50007'))
            ? ' Open a DM with MapleBot first (click the bot → Message), or allow DMs from server members.'
            : ''

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `Error: ${message}${dmHint}` })
        return
      }

      await interaction.reply({
        content: `Error: ${message}${dmHint}`,
        ephemeral: true,
      })
    }
  })

  await client.login(token)
  activeDiscordClient = client
  discordLog('Discord client login resolved')
  return client
}

export async function stopDiscordBot(client: Client | null): Promise<void> {
  if (!client) return
  discordLog('Stopping Discord bot')
  activeDiscordClient = null
  client.destroy()
}
