import { useEffect, useRef, type RefObject } from 'react'
import type { FocusRegionSize } from '../types/focusRegion'

export function useFocusRegionCrop(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isActive: boolean,
  focusSize: FocusRegionSize,
) {
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !isActive) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawFocusRegion = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animationRef.current = requestAnimationFrame(drawFocusRegion)
        return
      }

      const sourceWidth = video.videoWidth
      const sourceHeight = video.videoHeight

      if (sourceWidth === 0 || sourceHeight === 0) {
        animationRef.current = requestAnimationFrame(drawFocusRegion)
        return
      }

      const cropWidth = Math.floor(sourceWidth * (focusSize.widthPercent / 100))
      const cropHeight = Math.floor(sourceHeight * (focusSize.heightPercent / 100))
      const cropX = 0
      const cropY = 0

      canvas.width = cropWidth
      canvas.height = cropHeight

      ctx.drawImage(
        video,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      )

      animationRef.current = requestAnimationFrame(drawFocusRegion)
    }

    animationRef.current = requestAnimationFrame(drawFocusRegion)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [videoRef, canvasRef, isActive, focusSize.widthPercent, focusSize.heightPercent])
}
