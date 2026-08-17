import { useEffect, useRef, useState, type RefObject } from 'react'
import type { FocusRegionSize } from '../types/focusRegion'
import type { RoutinePoint } from '../types/routine'
import type { User } from '../types/user'
import { USER_NOT_FOUND } from '../types/user'
import { detectUser, usersEqual } from '../utils/detectUser'
import {
  normalizedToCanvasCoord,
  ROUTINE_POINT_HIT_RADIUS,
} from '../utils/focusRegionCoords'

const POINT_RADIUS = ROUTINE_POINT_HIT_RADIUS
const POINT_LINE_WIDTH = 4
const POINT_SELECTED_LINE_WIDTH = 5
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
    ctx.fillStyle = isSelected ? 'rgba(236, 72, 153, 0.35)' : 'rgba(168, 85, 247, 0.3)'
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#ec4899' : '#a855f7'
    ctx.lineWidth = isSelected ? POINT_SELECTED_LINE_WIDTH : POINT_LINE_WIDTH
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
  const lastUserRef = useRef<User>(USER_NOT_FOUND)
  const [user, setUser] = useState<User>(USER_NOT_FOUND)

  useEffect(() => {
    if (!isActive) {
      setUser(USER_NOT_FOUND)
      lastUserRef.current = USER_NOT_FOUND
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
      const detectedUser = detectUser(imageData)

      if (detectedUser.isUserFound && detectedUser.radius != null) {
        const circleRadius = detectedUser.radius * CHARACTER_CIRCLE_RADIUS_SCALE
        ctx.beginPath()
        ctx.arc(
          detectedUser.location.x,
          detectedUser.location.y,
          circleRadius,
          0,
          Math.PI * 2,
        )
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
        ctx.fill()
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = CHARACTER_CIRCLE_LINE_WIDTH
        ctx.stroke()
      }

      drawRoutinePoints(ctx, canvas, points, selectedPointId)

      if (!usersEqual(detectedUser, lastUserRef.current)) {
        lastUserRef.current = detectedUser
        setUser(detectedUser)
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

  return { user }
}
