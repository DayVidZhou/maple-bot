export function formatDiscordDmError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)

  if (raw.includes('50278') || raw.includes('no mutual guilds')) {
    return (
      'Cannot DM you — the bot must share a server with you. ' +
      'In the Discord Developer Portal: OAuth2 → URL Generator → select ' +
      'bot + applications.commands → copy the invite URL → add MapleBot to a server you are in.'
    )
  }

  if (raw.includes('50007') || raw.includes('Cannot send messages to this user')) {
    return (
      'Cannot DM you — open a DM with MapleBot (click the bot → Message) ' +
      'or allow DMs from server members in Discord privacy settings.'
    )
  }

  return raw
}

export function isDiscordDmSetupError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err)
  return (
    raw.includes('50278') ||
    raw.includes('50007') ||
    raw.includes('no mutual guilds') ||
    raw.includes('Cannot send messages to this user')
  )
}
