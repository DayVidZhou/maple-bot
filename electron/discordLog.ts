const PREFIX = '[discord]'

export function discordLog(message: string, detail?: Record<string, unknown>) {
  if (detail) {
    console.log(PREFIX, message, detail)
    return
  }
  console.log(PREFIX, message)
}

export function discordWarn(message: string, detail?: Record<string, unknown>) {
  if (detail) {
    console.warn(PREFIX, message, detail)
    return
  }
  console.warn(PREFIX, message)
}

export function discordError(
  message: string,
  err?: unknown,
  detail?: Record<string, unknown>,
) {
  if (err instanceof Error) {
    console.error(PREFIX, message, {
      ...detail,
      error: err.message,
      stack: err.stack,
    })
    return
  }

  if (detail) {
    console.error(PREFIX, message, detail, err)
    return
  }

  console.error(PREFIX, message, err)
}
