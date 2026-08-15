import { useEffect, type RefObject } from 'react'

export function useVideoStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
) {
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream
    void video.play()
  }, [videoRef, stream])
}
