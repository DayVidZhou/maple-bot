import { useEffect } from 'react'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'

export function DiscordStatusBridge() {
  const { isCapturing } = useScreenCaptureContext()
  const { isRunning, status, selectedRoutine, currentPointIndex } =
    useRunRoutineContext()

  useEffect(() => {
    window.electronAPI?.reportDiscordStatus?.({
      captureActive: isCapturing,
      routineRunning: isRunning,
      routineName: selectedRoutine?.name ?? null,
      routineStatus: status || null,
      routinePointIndex: currentPointIndex,
    })
  }, [
    isCapturing,
    isRunning,
    status,
    selectedRoutine?.name,
    currentPointIndex,
  ])

  return null
}
