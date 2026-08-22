import { useEffect, useRef, useState, type RefObject } from 'react'
import type { FocusRegionSize } from '../types/focusRegion'
import type { RoutinePoint } from '../types/routine'
import type { User } from '../types/user'
import { USER_NOT_FOUND } from '../types/user'
import { detectUser, stabilizeUserDetection, usersEqual } from '../utils/detectUser'
import { userTrackingResetRef } from '../utils/userTrackingReset'
import { ROUTINE_POLL_INTERVAL_MS } from '../utils/routineRunner'
import {
  normalizedToCanvasCoord,
} from '../utils/focusRegionCoords'

type VideoFrameRequestCallbackMetadata = {
  mediaTime?: number
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?(
    callback: (
      now: DOMHighResTimeStamp,
      metadata: VideoFrameRequestCallbackMetadata,
    ) => void,
  ): number
  cancelVideoFrameCallback?(id: number): void
}

const FALLBACK_POLL_INTERVAL_MS = ROUTINE_POLL_INTERVAL_MS

const POINT_RADIUS = 8
const POINT_LINE_WIDTH = 2.5
const POINT_SELECTED_LINE_WIDTH = 3
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
  onFrame?: (frame: {
    user: User
    cropWidth: number
    cropHeight: number
  }) => void,
) {
  const intervalRef = useRef<number>(0)
  const videoFrameCallbackRef = useRef<number | null>(null)
  const lastProcessedMediaTimeRef = useRef<number | null>(null)
  const lastUserRef = useRef<User>(USER_NOT_FOUND)
  const onFrameRef = useRef(onFrame)
  const pointsRef = useRef(points)
  const selectedPointIdRef = useRef(selectedPointId)
  const [user, setUser] = useState<User>(USER_NOT_FOUND)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    pointsRef.current = points
  }, [points])

  useEffect(() => {
    selectedPointIdRef.current = selectedPointId
  }, [selectedPointId])

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

    const drawFocusRegion = (mediaTime?: number) => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      const frameTime = mediaTime ?? video.currentTime
      if (
        mediaTime == null &&
        lastProcessedMediaTimeRef.current !== null &&
        frameTime === lastProcessedMediaTimeRef.current
      ) {
        return
      }
      lastProcessedMediaTimeRef.current = frameTime

      const sourceWidth = video.videoWidth
      const sourceHeight = video.videoHeight

      if (sourceWidth === 0 || sourceHeight === 0) {
        return
      }

      const cropWidth = Math.floor(sourceWidth * (focusSize.widthPercent / 100))
      const cropHeight = Math.floor(sourceHeight * (focusSize.heightPercent / 100))

      if (canvas.width !== cropWidth) {
        canvas.width = cropWidth
      }
      if (canvas.height !== cropHeight) {
        canvas.height = cropHeight
      }

      ctx.drawImage(video, 0, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

      if (userTrackingResetRef.pending) {
        lastUserRef.current = USER_NOT_FOUND
        userTrackingResetRef.pending = false
      }

      const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight)
      const rawDetection = detectUser(imageData, {
        lastLocation: lastUserRef.current.isUserFound
          ? lastUserRef.current.location
          : null,
      })
      const detectedUser = stabilizeUserDetection(
        rawDetection,
        lastUserRef.current,
        cropWidth,
        cropHeight,
      )

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

      drawRoutinePoints(
        ctx,
        canvas,
        pointsRef.current,
        selectedPointIdRef.current,
      )

      onFrameRef.current?.({
        user: detectedUser,
        cropWidth,
        cropHeight,
      })

      if (!usersEqual(detectedUser, lastUserRef.current)) {
        lastUserRef.current = detectedUser
        setUser(detectedUser)
      }
    }

    const videoWithFrameCallback = video as VideoWithFrameCallback
    let cancelled = false

    const supportsVideoFrameCallback =
      typeof videoWithFrameCallback.requestVideoFrameCallback === 'function'

    const scheduleVideoFrame = () => {
      if (cancelled || !supportsVideoFrameCallback) return

      videoFrameCallbackRef.current = videoWithFrameCallback.requestVideoFrameCallback!(
        (_now, metadata) => {
          if (cancelled) return
          drawFocusRegion(metadata.mediaTime)
          scheduleVideoFrame()
        },
      )
    }

    drawFocusRegion()

    if (supportsVideoFrameCallback) {
      scheduleVideoFrame()
    } else {
      intervalRef.current = window.setInterval(
        () => drawFocusRegion(),
        FALLBACK_POLL_INTERVAL_MS,
      )
    }

    return () => {
      cancelled = true
      window.clearInterval(intervalRef.current)
      if (
        videoFrameCallbackRef.current !== null &&
        typeof videoWithFrameCallback.cancelVideoFrameCallback === 'function'
      ) {
        videoWithFrameCallback.cancelVideoFrameCallback(
          videoFrameCallbackRef.current,
        )
      }
      videoFrameCallbackRef.current = null
      lastProcessedMediaTimeRef.current = null
    }
  }, [
    videoRef,
    canvasRef,
    isActive,
    focusSize.widthPercent,
    focusSize.heightPercent,
  ])

  return { user }
}
