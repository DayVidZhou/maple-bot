import { useEffect, useRef, useState, type RefObject } from 'react'
import type { FocusRegionSize } from '../types/focusRegion'
import type { RoutinePoint } from '../types/routine'
import {
  detectYellowShape,
  detectionsEqual,
  type YellowShapeDetection,
} from '../utils/detectYellowShape'
import { normalizedToCanvasCoord } from '../utils/focusRegionCoords'

const POINT_RADIUS = 8
const CHARACTER_CIRCLE_RADIUS_SCALE = 1.45
const CHARACTER_CIRCLE_LINE_WIDTH = 5

function drawRoutinePoints(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  points: RoutinePoint[],
  selectedPointId: string | null,
) {
  for (const point of points) {
    const { x, y } = normalizedToCanvasCoord(canvas, point)
    const isSelected = point.id === selectedPointId

    ctx.beginPath()
    ctx.arc(x, y, POINT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.25)'
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#93c5fd' : '#3b82f6'
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()
  }
}

export function useFocusRegionCrop(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isActive: boolean,
  focusSize: FocusRegionSize,
  points: RoutinePoint[] = [],
  selectedPointId: string | null = null,
) {
  const animationRef = useRef<number>(0)
  const lastDetectionRef = useRef<YellowShapeDetection | null>(null)
  const [yellowShape, setYellowShape] = useState<YellowShapeDetection | null>(
    null,
  )

  useEffect(() => {
    if (!isActive) {
      setYellowShape(null)
      lastDetectionRef.current = null
    }
  }, [isActive])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !isActive) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
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

      canvas.width = cropWidth
      canvas.height = cropHeight

      ctx.drawImage(video, 0, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

      const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight)
      const detection = detectYellowShape(imageData)

      if (detection) {
        const circleRadius = detection.radius * CHARACTER_CIRCLE_RADIUS_SCALE
        ctx.beginPath()
        ctx.arc(detection.x, detection.y, circleRadius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
        ctx.fill()
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = CHARACTER_CIRCLE_LINE_WIDTH
        ctx.stroke()
      }

      drawRoutinePoints(ctx, canvas, points, selectedPointId)

      if (!detectionsEqual(detection, lastDetectionRef.current)) {
        lastDetectionRef.current = detection
        setYellowShape(detection)
      }

      animationRef.current = requestAnimationFrame(drawFocusRegion)
    }

    animationRef.current = requestAnimationFrame(drawFocusRegion)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [
    videoRef,
    canvasRef,
    isActive,
    focusSize.widthPercent,
    focusSize.heightPercent,
    points,
    selectedPointId,
  ])

  return { yellowShape }
}
