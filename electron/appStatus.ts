export interface AppDiscordStatus {
  captureActive: boolean
  routineRunning: boolean
  routineName: string | null
  routineStatus: string | null
  routinePointIndex: number | null
  userCoords: string | null
}

const defaultStatus: AppDiscordStatus = {
  captureActive: false,
  routineRunning: false,
  routineName: null,
  routineStatus: null,
  routinePointIndex: null,
  userCoords: null,
}

let status: AppDiscordStatus = { ...defaultStatus }

export function getAppDiscordStatus(): AppDiscordStatus {
  return { ...status }
}

export function updateAppDiscordStatus(
  patch: Partial<AppDiscordStatus>,
): AppDiscordStatus {
  status = { ...status, ...patch }
  return status
}

export function resetAppDiscordStatus(): void {
  status = { ...defaultStatus }
}

export function formatAppDiscordStatus(
  statusSnapshot: AppDiscordStatus,
  extras: {
    platform: NodeJS.Platform
    mapleStoryFocused: boolean
  },
): string {
  const lines = [
    `Platform: ${extras.platform}`,
    `MapleStory focused: ${extras.mapleStoryFocused ? 'yes' : 'no'}`,
    `Screen capture: ${statusSnapshot.captureActive ? 'on' : 'off'}`,
    `Routine: ${
      statusSnapshot.routineRunning
        ? `running (${statusSnapshot.routineName ?? 'unknown'})`
        : 'idle'
    }`,
  ]

  if (statusSnapshot.routineStatus) {
    lines.push(`Status: ${statusSnapshot.routineStatus}`)
  }

  if (
    statusSnapshot.routineRunning &&
    statusSnapshot.routinePointIndex != null
  ) {
    lines.push(`Point index: ${statusSnapshot.routinePointIndex + 1}`)
  }

  if (statusSnapshot.userCoords) {
    lines.push(`User: ${statusSnapshot.userCoords}`)
  }

  return lines.join('\n')
}
