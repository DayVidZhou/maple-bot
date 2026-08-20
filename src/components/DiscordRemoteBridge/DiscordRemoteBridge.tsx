import { useEffect } from 'react'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'

function describeStartBlockers(options: {
  isCapturing: boolean
  hasRoutine: boolean
  hasPoints: boolean
}): string {
  const reasons: string[] = []

  if (!options.isCapturing) {
    reasons.push('start screen capture')
  }
  if (!options.hasRoutine) {
    reasons.push('select a routine in the app')
  } else if (!options.hasPoints) {
    reasons.push('add at least one point to the routine')
  }

  return reasons.length > 0
    ? reasons.join(', ')
    : 'routine requirements are not met'
}

export function DiscordRemoteBridge() {
  const { isCapturing } = useScreenCaptureContext()
  const {
    isRunning,
    canRun,
    selectedRoutine,
    startRun,
    stopRun,
  } = useRunRoutineContext()

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onDiscordRemoteAction?.(
      async ({ requestId, action }) => {
        const respond = (ok: boolean, message: string) => {
          window.electronAPI?.reportDiscordRemoteActionResult?.({
            requestId,
            ok,
            message,
          })
        }

        if (action === 'stop-routine') {
          if (!isRunning) {
            respond(true, 'No routine is running.')
            return
          }

          stopRun()
          respond(true, 'Routine stop requested.')
          return
        }

        if (action === 'start-routine') {
          if (isRunning) {
            respond(false, 'A routine is already running.')
            return
          }

          if (!canRun) {
            respond(
              false,
              `Cannot start: ${describeStartBlockers({
                isCapturing,
                hasRoutine: Boolean(selectedRoutine),
                hasPoints: (selectedRoutine?.points.length ?? 0) > 0,
              })}.`,
            )
            return
          }

          void startRun()
          respond(true, `Started routine "${selectedRoutine!.name}".`)
        }
      },
    )

    return unsubscribe
  }, [
    canRun,
    isCapturing,
    isRunning,
    selectedRoutine,
    startRun,
    stopRun,
  ])

  return null
}
