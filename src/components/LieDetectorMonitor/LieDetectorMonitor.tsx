import { useEffect, useRef, useState } from 'react'
import { useActivityLogContext } from '../../context/ActivityLogContext'
import { useBotSettingsContext } from '../../context/BotSettingsContext'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import {
  detectLieDetector,
  prepareLieDetectorTemplates,
  type PreparedLieDetectorTemplate,
} from '../../utils/detectLieDetector'
import { captureLieDetectorScanFrame } from '../../utils/lieDetectorFrameCapture'
import { loadImageDataFromUrl } from '../../utils/imageDataUtils'
import { LIE_DETECTOR_REFERENCE_URL } from '../../utils/lieDetectorSignatures'

export function LieDetectorMonitor() {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { settings, templateInfo } = useBotSettingsContext()
  const { isRunning, stopRun } = useRunRoutineContext()
  const { logActivity } = useActivityLogContext()
  const [templates, setTemplates] = useState<PreparedLieDetectorTemplate[]>([])
  const lastAlertAtRef = useRef(0)
  const scanningRef = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      let dataUrl: string | null = null

      if (window.electronAPI?.getLieDetectorTemplateDataUrl) {
        dataUrl = await window.electronAPI.getLieDetectorTemplateDataUrl()
      }

      if (!dataUrl) {
        dataUrl = LIE_DETECTOR_REFERENCE_URL
      }

      const reference = await loadImageDataFromUrl(dataUrl)
      if (cancelled) return

      if (!reference) {
        setTemplates([])
        return
      }

      setTemplates(prepareLieDetectorTemplates(reference))
    }

    void loadTemplates()
    return () => {
      cancelled = true
    }
  }, [templateInfo.hasTemplate, templateInfo.width, templateInfo.height])

  useEffect(() => {
    if (
      !settings.lieDetectorEnabled ||
      !isCapturing ||
      !isRunning ||
      templates.length === 0
    ) {
      return
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
      ctxRef.current = canvasRef.current.getContext('2d', {
        willReadFrequently: true,
      })
    }

    const scan = () => {
      if (scanningRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!video || !canvas || !ctx) return

      scanningRef.current = true
      try {
        const frame = captureLieDetectorScanFrame(video, canvas, ctx)
        if (!frame) return

        const detection = detectLieDetector(
          frame,
          templates,
          settings.lieDetectorMatchThreshold,
        )

        if (!detection.matched) {
          return
        }

        const now = Date.now()
        if (now - lastAlertAtRef.current < settings.lieDetectorAlertCooldownMs) {
          return
        }

        lastAlertAtRef.current = now
        const scoreLabel = `${(detection.score * 100).toFixed(1)}%`
        const featureLabel = `${(detection.featureScore * 100).toFixed(0)}%`
        const templateLabel = `${(detection.templateScore * 100).toFixed(0)}%`

        logActivity({
          category: 'system',
          event: 'Lie detector detected',
          detail: `Match ${scoreLabel} · features ${featureLabel} · template ${templateLabel}`,
        })

        if (settings.lieDetectorStopRoutine && isRunning) {
          stopRun()
          logActivity({
            category: 'system',
            event: 'Routine stopped',
            detail: 'Lie detector detected',
          })
        }

        void window.electronAPI?.sendLieDetectorAlert?.(detection.score)
          .then(() => {
            logActivity({
              category: 'system',
              event: 'Discord lie detector alert',
              detail: `Sent · match ${scoreLabel}`,
            })
          })
          .catch((err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Discord alert failed'
            logActivity({
              category: 'system',
              event: 'Discord lie detector alert failed',
              detail: message,
            })
          })
      } finally {
        scanningRef.current = false
      }
    }

    scan()
    const intervalId = window.setInterval(
      scan,
      settings.lieDetectorScanIntervalMs,
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    isCapturing,
    isRunning,
    logActivity,
    settings.lieDetectorAlertCooldownMs,
    settings.lieDetectorEnabled,
    settings.lieDetectorMatchThreshold,
    settings.lieDetectorScanIntervalMs,
    settings.lieDetectorStopRoutine,
    stopRun,
    templates,
    videoRef,
  ])

  return null
}
