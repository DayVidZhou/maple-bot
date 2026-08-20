import { LIE_DETECTOR_SCAN_WIDTH } from './detectLieDetector'
import { LIE_DETECTOR_FEATURE_REGION } from './lieDetectorSignatures'

export function captureLieDetectorScanFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageData | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null
  }

  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  if (sourceWidth === 0 || sourceHeight === 0) {
    return null
  }

  const cropWidth = sourceWidth * LIE_DETECTOR_FEATURE_REGION.widthFraction
  const cropHeight = sourceHeight * LIE_DETECTOR_FEATURE_REGION.heightFraction
  const sourceX = (sourceWidth - cropWidth) / 2
  const sourceY = (sourceHeight - cropHeight) / 2
  const targetWidth = LIE_DETECTOR_SCAN_WIDTH
  const targetHeight = Math.max(
    1,
    Math.floor(cropHeight * (LIE_DETECTOR_SCAN_WIDTH / cropWidth)),
  )

  if (canvas.width !== targetWidth) {
    canvas.width = targetWidth
  }
  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight
  }

  ctx.drawImage(
    video,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  )

  return ctx.getImageData(0, 0, targetWidth, targetHeight)
}
