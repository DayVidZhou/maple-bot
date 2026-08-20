import type { NormalizedRect } from './imageDataUtils'

/** Static regions from the bundled lie detector reference screenshot. */
export interface LieDetectorSignature {
  name: string
  rect: NormalizedRect
  weight: number
}

export const LIE_DETECTOR_REFERENCE_URL = '/lie-detector-reference.png'

export const LIE_DETECTOR_SIGNATURES: LieDetectorSignature[] = [
  {
    name: 'soft-keyboard',
    rect: { x: 0.535, y: 0.14, width: 0.285, height: 0.72 },
    weight: 1.4,
  },
  {
    name: 'clock-dynamite',
    rect: { x: 0.175, y: 0.085, width: 0.145, height: 0.245 },
    weight: 1.2,
  },
  {
    name: 'blue-instructions',
    rect: { x: 0.31, y: 0.17, width: 0.24, height: 0.17 },
    weight: 1,
  },
  {
    name: 'npc-w-badge',
    rect: { x: 0.185, y: 0.36, width: 0.11, height: 0.24 },
    weight: 0.9,
  },
  {
    name: 'cancel-ok-row',
    rect: { x: 0.535, y: 0.76, width: 0.285, height: 0.14 },
    weight: 0.8,
  },
]

export const LIE_DETECTOR_FEATURE_REGION = {
  centerXFraction: 0.5,
  centerYFraction: 0.5,
  widthFraction: 0.82,
  heightFraction: 0.88,
  bluePanelWidthFraction: 0.56,
  numpadWidthFraction: 0.42,
}
