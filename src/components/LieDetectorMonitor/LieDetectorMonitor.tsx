import { useEffect, useRef, useState } from 'react'
import { useActivityLogContext } from '../../context/ActivityLogContext'
import { useBotSettingsContext } from '../../context/BotSettingsContext'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import {
  buildLieDetectorTemplates,
  detectLieDetector,
  type LieDetectorTemplate,
} from '../../utils/detectLieDetector'
import { loadImageDataFromUrl } from '../../utils/imageDataUtils'
import { LIE_DETECTOR_REFERENCE_URL } from '../../utils/lieDetectorSignatures'

export function LieDetectorMonitor() {
  const { isCapturing, videoRef } = useScreenCaptureContext()
  const { settings, templateInfo } = useBotSettingsContext()
  const { isRunning, stopRun } = useRunRoutineContext()
  const { logActivity } = useActivityLogContext()
  const [templates, setTemplates] = useState<LieDetectorTemplate[]>([])
  const lastAlertAtRef = useRef(0)
  const scanningRef = useRef(false)

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

      setTemplates(buildLieDetectorTemplates(reference))
    }

    void loadTemplates()
    return () => {
      cancelled = true
    }
  }, [settings.lieDetectorEnabled, templateInfo.hasTemplate, templateInfo.width, templateInfo.height])

  useEffect(() => {
    if (
      !settings.lieDetectorEnabled ||
      !isCapturing ||
      templates.length === 0 ||
      !videoRef.current
    ) {
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const scan = async () => {
      if (scanningRef.current) return

      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      const sourceWidth = video.videoWidth
      const sourceHeight = video.videoHeight
      if (sourceWidth === 0 || sourceHeight === 0) {
        return
      }

      scanningRef.current = true
      try {
        canvas.width = sourceWidth
        canvas.height = sourceHeight
        ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight)
        const frame = ctx.getImageData(0, 0, sourceWidth, sourceHeight)
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

        if (window.electronAPI?.sendLieDetectorAlert) {
          try {
            await window.electronAPI.sendLieDetectorAlert(detection.score)
            logActivity({
              category: 'system',
              event: 'Discord lie detector alert',
              detail: `Sent · match ${scoreLabel}`,
            })
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Discord alert failed'
            logActivity({
              category: 'system',
              event: 'Discord lie detector alert failed',
              detail: message,
            })
          }
        }
      } finally {
        scanningRef.current = false
      }
    }

    const intervalId = window.setInterval(() => {
      void scan()
    }, settings.lieDetectorScanIntervalMs)

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
