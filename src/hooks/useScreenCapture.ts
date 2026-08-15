import { useCallback, useState } from 'react'

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCapture = useCallback(async () => {
    setError(null)

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      })

      mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        setStream(null)
        setIsCapturing(false)
      })

      setStream(mediaStream)
      setIsCapturing(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start screen capture'
      setError(message)
      setIsCapturing(false)
    }
  }, [])

  const stopCapture = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
    setIsCapturing(false)
  }, [stream])

  return {
    stream,
    isCapturing,
    error,
    startCapture,
    stopCapture,
  }
}
