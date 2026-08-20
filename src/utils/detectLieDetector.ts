import {
  cropNormalizedRect,
  downscaleImageData,
  type NormalizedRect,
} from './imageDataUtils'
import {
  LIE_DETECTOR_FEATURE_REGION,
  LIE_DETECTOR_SIGNATURES,
} from './lieDetectorSignatures'
import {
  matchTemplateWithStats,
  prepareTemplateStats,
  type TemplateMatchResult,
  type TemplateStats,
} from './templateMatch'

export const LIE_DETECTOR_SCAN_WIDTH = 640
const NUMPAD_COLUMNS = 3
const NUMPAD_ROWS = 4
const FEATURE_FAST_REJECT = 0.28
const TEMPLATE_MATCH_STEP = 6

export interface PreparedLieDetectorTemplate {
  name: string
  weight: number
  stats: TemplateStats
}

export interface LieDetectorDetection extends TemplateMatchResult {
  scaledScore: number
  templateScore: number
  featureScore: number
  signatureScores: Record<string, number>
}

/** @deprecated Use PreparedLieDetectorTemplate */
export type LieDetectorTemplate = PreparedLieDetectorTemplate

export function prepareLieDetectorTemplates(
  reference: ImageData,
): PreparedLieDetectorTemplate[] {
  const normalizedReference = downscaleImageData(
    reference,
    LIE_DETECTOR_SCAN_WIDTH,
  )

  return LIE_DETECTOR_SIGNATURES.map((signature) => {
    const data = cropNormalizedRect(normalizedReference, signature.rect)
    if (data.width <= 4 || data.height <= 4) return null

    return {
      name: signature.name,
      weight: signature.weight,
      stats: prepareTemplateStats(data),
    }
  }).filter((template): template is PreparedLieDetectorTemplate => template != null)
}

/** @deprecated Use prepareLieDetectorTemplates */
export function buildLieDetectorTemplates(
  reference: ImageData,
): PreparedLieDetectorTemplate[] {
  return prepareLieDetectorTemplates(reference)
}

function getCenterRegion(width: number, height: number): NormalizedRect {
  const regionWidth = width * LIE_DETECTOR_FEATURE_REGION.widthFraction
  const regionHeight = height * LIE_DETECTOR_FEATURE_REGION.heightFraction

  return {
    x: (width - regionWidth) / 2,
    y: (height - regionHeight) / 2,
    width: regionWidth,
    height: regionHeight,
  }
}

function isLieDetectorBlue(r: number, g: number, b: number): boolean {
  return (
    b >= 135 &&
    b >= r + 25 &&
    b >= g + 8 &&
    g >= 55 &&
    r <= 130 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 25
  )
}

function isLieDetectorWhite(r: number, g: number, b: number): boolean {
  return r >= 205 && g >= 205 && b >= 205
}

function isNumpadButton(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  return (
    brightness >= 175 &&
    brightness <= 245 &&
    Math.abs(r - g) < 28 &&
    Math.abs(g - b) < 28
  )
}

function scoreBlueWhitePanel(imageData: ImageData): number {
  const region = getCenterRegion(imageData.width, imageData.height)
  const panelWidth = region.width * LIE_DETECTOR_FEATURE_REGION.bluePanelWidthFraction
  let blueCount = 0
  let whiteCount = 0
  let total = 0

  const startX = Math.floor(region.x)
  const startY = Math.floor(region.y)
  const endX = Math.floor(region.x + panelWidth)
  const endY = Math.floor(region.y + region.height)

  for (let y = startY; y < endY; y += 3) {
    for (let x = startX; x < endX; x += 3) {
      const index = (y * imageData.width + x) * 4
      const r = imageData.data[index]
      const g = imageData.data[index + 1]
      const b = imageData.data[index + 2]

      total += 1
      if (isLieDetectorBlue(r, g, b)) blueCount += 1
      if (isLieDetectorWhite(r, g, b)) whiteCount += 1
    }
  }

  if (total === 0) return 0

  const blueRatio = blueCount / total
  const whiteRatio = whiteCount / total
  return Math.min(1, blueRatio * 4.2 + whiteRatio * 1.8)
}

function scoreScrambledNumpad(imageData: ImageData): number {
  const region = getCenterRegion(imageData.width, imageData.height)
  const numpadWidth = region.width * LIE_DETECTOR_FEATURE_REGION.numpadWidthFraction
  const numpadX = Math.floor(region.x + region.width - numpadWidth)
  const numpadY = Math.floor(region.y + region.height * 0.08)
  const numpadHeight = Math.floor(region.height * 0.72)
  const numpadW = Math.floor(numpadWidth)
  const cellWidth = numpadW / NUMPAD_COLUMNS
  const cellHeight = numpadHeight / NUMPAD_ROWS

  if (cellWidth < 8 || cellHeight < 8) return 0

  let filledCells = 0

  for (let row = 0; row < NUMPAD_ROWS; row += 1) {
    for (let col = 0; col < NUMPAD_COLUMNS; col += 1) {
      const cellX = Math.floor(numpadX + col * cellWidth + cellWidth * 0.2)
      const cellY = Math.floor(numpadY + row * cellHeight + cellHeight * 0.2)
      const cellW = Math.floor(cellWidth * 0.6)
      const cellH = Math.floor(cellHeight * 0.6)
      let buttonPixels = 0
      let samples = 0

      for (let y = cellY; y < cellY + cellH; y += 3) {
        for (let x = cellX; x < cellX + cellW; x += 3) {
          if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
            continue
          }
          const index = (y * imageData.width + x) * 4
          samples += 1
          if (
            isNumpadButton(
              imageData.data[index],
              imageData.data[index + 1],
              imageData.data[index + 2],
            )
          ) {
            buttonPixels += 1
          }
        }
      }

      if (samples > 0 && buttonPixels / samples >= 0.35) {
        filledCells += 1
      }
    }
  }

  const requiredCells = NUMPAD_COLUMNS * NUMPAD_ROWS - 1
  return filledCells / requiredCells
}

function scoreLieDetectorFeatures(imageData: ImageData): {
  featureScore: number
  blueWhite: number
  numpad: number
} {
  const blueWhite = scoreBlueWhitePanel(imageData)
  const numpad = scoreScrambledNumpad(imageData)
  return {
    blueWhite,
    numpad,
    featureScore: Math.min(1, blueWhite * 0.55 + numpad * 0.45),
  }
}

function matchLieDetectorTemplates(
  frame: ImageData,
  templates: PreparedLieDetectorTemplate[],
  threshold: number,
): {
  score: number
  signatureScores: Record<string, number>
  bestX: number
  bestY: number
} {
  const searchWidth = Math.floor(frame.width * 0.92)
  const searchHeight = Math.floor(frame.height * 0.92)
  const searchRegion = {
    x: Math.floor((frame.width - searchWidth) / 2),
    y: Math.floor((frame.height - searchHeight) / 2),
    width: searchWidth,
    height: searchHeight,
  }

  let weightedScore = 0
  let totalWeight = 0
  let bestX = 0
  let bestY = 0
  let bestPeak = -1
  const signatureScores: Record<string, number> = {}

  for (const template of templates) {
    const result = matchTemplateWithStats(frame, template.stats, {
      threshold: threshold * 0.85,
      step: TEMPLATE_MATCH_STEP,
      searchRegion,
    })

    signatureScores[template.name] = result.score
    weightedScore += result.score * template.weight
    totalWeight += template.weight

    if (result.score > bestPeak) {
      bestPeak = result.score
      bestX = result.x
      bestY = result.y
    }
  }

  return {
    score: totalWeight > 0 ? weightedScore / totalWeight : 0,
    signatureScores,
    bestX,
    bestY,
  }
}

export function detectLieDetector(
  frame: ImageData,
  templates: PreparedLieDetectorTemplate[],
  threshold: number,
): LieDetectorDetection {
  const { featureScore, blueWhite, numpad } = scoreLieDetectorFeatures(frame)

  if (featureScore < FEATURE_FAST_REJECT) {
    return {
      matched: false,
      score: featureScore * 0.42,
      scaledScore: featureScore * 0.42,
      templateScore: 0,
      featureScore,
      signatureScores: {},
      x: 0,
      y: 0,
    }
  }

  const templateMatch =
    templates.length > 0
      ? matchLieDetectorTemplates(frame, templates, threshold)
      : { score: 0, signatureScores: {}, bestX: 0, bestY: 0 }

  const combinedScore = Math.min(
    1,
    featureScore * 0.42 + templateMatch.score * 0.58,
  )

  const strongFeatureMatch =
    featureScore >= Math.max(0.62, threshold - 0.08) &&
    numpad >= 0.55 &&
    blueWhite >= 0.35

  const matched =
    combinedScore >= threshold ||
    (strongFeatureMatch && templateMatch.score >= threshold * 0.75)

  return {
    matched,
    score: combinedScore,
    scaledScore: combinedScore,
    templateScore: templateMatch.score,
    featureScore,
    signatureScores: templateMatch.signatureScores,
    x: templateMatch.bestX,
    y: templateMatch.bestY,
  }
}
