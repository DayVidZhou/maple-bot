import { imageDataToGrayscale } from './imageDataUtils'

export interface TemplateMatchResult {
  matched: boolean
  score: number
  x: number
  y: number
}

export interface TemplateMatchOptions {
  threshold?: number
  step?: number
  searchRegion?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface TemplateStats {
  mean: number
  std: number
  values: Float32Array
  width: number
  height: number
}

function buildTemplateStats(template: ImageData): TemplateStats {
  const values = imageDataToGrayscale(template)
  let sum = 0

  for (let i = 0; i < values.length; i += 1) {
    sum += values[i]
  }

  const mean = sum / values.length
  let variance = 0

  for (let i = 0; i < values.length; i += 1) {
    const delta = values[i] - mean
    variance += delta * delta
  }

  const std = Math.sqrt(variance / values.length)

  return {
    mean,
    std,
    values,
    width: template.width,
    height: template.height,
  }
}

function normalizedCrossCorrelation(
  image: Float32Array,
  imageWidth: number,
  x: number,
  y: number,
  template: TemplateStats,
): number {
  const { width: tplWidth, height: tplHeight, values: tplValues, mean, std } =
    template

  if (std === 0) {
    return 0
  }

  let patchSum = 0
  for (let ty = 0; ty < tplHeight; ty += 1) {
    const row = (y + ty) * imageWidth
    for (let tx = 0; tx < tplWidth; tx += 1) {
      patchSum += image[row + x + tx]
    }
  }

  const patchMean = patchSum / tplValues.length
  let numerator = 0
  let patchVariance = 0

  for (let ty = 0; ty < tplHeight; ty += 1) {
    const row = (y + ty) * imageWidth
    for (let tx = 0; tx < tplWidth; tx += 1) {
      const patchValue = image[row + x + tx]
      const patchDelta = patchValue - patchMean
      const templateDelta = tplValues[ty * tplWidth + tx] - mean
      numerator += patchDelta * templateDelta
      patchVariance += patchDelta * patchDelta
    }
  }

  const patchStd = Math.sqrt(patchVariance / tplValues.length)
  if (patchStd === 0) {
    return 0
  }

  return numerator / (tplValues.length * patchStd * std)
}

export function matchTemplate(
  imageData: ImageData,
  templateData: ImageData,
  options: TemplateMatchOptions = {},
): TemplateMatchResult {
  const threshold = options.threshold ?? 0.72
  const step = options.step ?? 3
  const template = buildTemplateStats(templateData)
  const image = imageDataToGrayscale(imageData)
  const imageWidth = imageData.width
  const imageHeight = imageData.height

  const region = options.searchRegion ?? {
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  }

  const maxX = Math.min(
    region.x + region.width,
    imageWidth - template.width + 1,
  )
  const maxY = Math.min(
    region.y + region.height,
    imageHeight - template.height + 1,
  )

  let bestScore = -1
  let bestX = 0
  let bestY = 0

  for (let y = region.y; y < maxY; y += step) {
    for (let x = region.x; x < maxX; x += step) {
      const score = normalizedCrossCorrelation(
        image,
        imageWidth,
        x,
        y,
        template,
      )

      if (score > bestScore) {
        bestScore = score
        bestX = x
        bestY = y
      }
    }
  }

  return {
    matched: bestScore >= threshold,
    score: bestScore,
    x: bestX,
    y: bestY,
  }
}
