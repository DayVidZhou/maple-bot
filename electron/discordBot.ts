import {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type Interaction,
  type MessageCreateOptions,
} from 'discord.js'
import type { BrowserWindow } from 'electron'
import {
  formatAppDiscordStatus,
  getAppDiscordStatus,
  type AppDiscordStatus,
} from './appStatus'
import { getDiscordConfig, logDiscordConfigSummary } from './env'
import { isApplicationFocused, MAPLESTORY_WORLDS_APP_NAME, focusApplication } from './apps'
import { captureDesktopScreenshot } from './screenshot'
import { requestDiscordRemoteAction } from './discordRemoteControl'
import {
  formatSupportedKeysHint,
  isSupportedKey,
  tapKey,
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

function isAuthorized(interaction: Interaction, ownerId: string | undefined) {
  if (!ownerId) return false
  return interaction.user.id === ownerId
}

async function deliverToOwnerDm(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
  payload: string | MessageCreateOptions,
): Promise<void> {
  const inDm = !interaction.inGuild()

  if (inDm) {
    if (interaction.deferred) {
      await interaction.editReply(payload)
      return
    }
    if (interaction.replied) {
      await interaction.followUp(payload)
      return
    }
    await interaction.reply(payload)
    return
  }

  const owner = await interaction.client.users.fetch(ownerId)
  await owner.send(payload)

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: 'Sent to your DMs.' })
    return
  }

  await interaction.reply({
    content: 'Sent to your DMs.',
    ephemeral: true,
  })
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

async function handleScreenshot(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
) {
  discordLog('Slash command received: screenshot', {
    userId: interaction.user.id,
    inDm: !interaction.inGuild(),
  })

  const inDm = !interaction.inGuild()
  await interaction.deferReply(inDm ? undefined : { ephemeral: true })

  const png = await captureDesktopScreenshot()
  const file = new AttachmentBuilder(png, { name: 'maple-bot-screenshot.png' })
  await deliverToOwnerDm(interaction, ownerId, {
    content: 'Latest capture:',
    files: [file],
  })
  discordLog('Slash command completed: screenshot')
}

async function handleStatus(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
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

  await deliverToOwnerDm(interaction, ownerId, {
    content: ['```', message, '```'].join('\n'),
  })
}

async function handleKeypress(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
  key: string,
) {
  const inDm = !interaction.inGuild()

  if (!isSupportedKey(key)) {
    await interaction.reply({
      content: `Unsupported key "${key}". ${formatSupportedKeysHint()}.`,
      ephemeral: !inDm,
    })
    return
  }

  discordLog('Slash command received: keypress', {
    userId: interaction.user.id,
    key,
    inDm,
  })

  await interaction.deferReply(inDm ? undefined : { ephemeral: true })
  await focusApplication(MAPLESTORY_WORLDS_APP_NAME)
  await tapKey(key)
  await deliverToOwnerDm(
    interaction,
    ownerId,
    `Pressed \`${key.trim().toLowerCase()}\` in MapleStory Worlds.`,
  )
  discordLog('Slash command completed: keypress', { key })
}

async function handleStart(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
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
  await deliverToOwnerDm(
    interaction,
    ownerId,
    result.ok ? result.message : `Error: ${result.message}`,
  )
  discordLog('Slash command completed: start', { ok: result.ok })
}

async function handleHelp(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
) {
  discordLog('Slash command received: help', {
    userId: interaction.user.id,
    inDm: !interaction.inGuild(),
  })

  await deliverToOwnerDm(interaction, ownerId, formatDiscordHelpMessage())
  discordLog('Slash command completed: help')
}

async function handleStop(
  interaction: ChatInputCommandInteraction,
  ownerId: string,
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
  await deliverToOwnerDm(
    interaction,
    ownerId,
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
      'DISCORD_OWNER_ID is not set — commands and DMs will fail until configured',
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

    if (!isAuthorized(interaction, ownerId)) {
      discordWarn('Rejected unauthorized interaction', {
        userId: interaction.user.id,
        expectedOwnerId: ownerId ?? null,
      })
      await interaction.reply({
        content: 'You are not authorized to use this bot.',
        ephemeral: true,
      })
      return
    }

    try {
      if (interaction.commandName === 'help') {
        await handleHelp(interaction, ownerId!)
        return
      }

      if (interaction.commandName === 'screenshot') {
        await handleScreenshot(interaction, ownerId!)
        return
      }

      if (interaction.commandName === 'status') {
        discordLog('Slash command received: status')
        await handleStatus(
          interaction,
          ownerId!,
          deps,
          getAppDiscordStatus(),
        )
        discordLog('Slash command completed: status')
        return
      }

      if (interaction.commandName === 'keypress') {
        const key = interaction.options.getString('key', true)
        await handleKeypress(interaction, ownerId!, key)
        return
      }

      if (interaction.commandName === 'start') {
        await handleStart(interaction, ownerId!, deps)
        return
      }

      if (interaction.commandName === 'stop') {
        await handleStop(interaction, ownerId!, deps)
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
