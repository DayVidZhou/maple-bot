import { SlashCommandBuilder } from 'discord.js'

/** Single source of truth for Discord slash commands and /help text. */
export const discordSlashCommandBuilders = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List available Maple Bot commands'),
  new SlashCommandBuilder()
    .setName('screenshot')
    .setDescription('Capture MapleStory Worlds (or the desktop)'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show maple-bot status'),
  new SlashCommandBuilder()
    .setName('keypress')
    .setDescription('Tap a key in MapleStory Worlds')
    .addStringOption((option) =>
      option
        .setName('key')
        .setDescription('Key name (e.g. left, space, z, f1)')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start the selected routine in Maple Bot'),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the running routine'),
]

export const discordSlashCommandsJson = discordSlashCommandBuilders.map(
  (command) => command.toJSON(),
)

function formatCommandUsage(name: string, options?: { name: string }[]): string {
  if (!options?.length) return `/${name}`

  const optionUsage = options.map((option) => `${option.name}:<value>`).join(' ')
  return `/${name} ${optionUsage}`
}

export function formatDiscordHelpMessage(): string {
  const lines = ['**Maple Bot commands**', '']

  for (const command of discordSlashCommandsJson) {
    lines.push(
      `\`${formatCommandUsage(command.name, command.options)}\` — ${command.description}`,
    )
  }

  lines.push(
    '',
    'Use `/start` with screen capture on and a routine selected in the app.',
  )

  return lines.join('\n')
}
