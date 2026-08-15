import { useRef, type RefObject } from 'react'
import type { FocusRegionSize } from '../../types/focusRegion'
import { useFocusRegionCrop } from '../../hooks/useFocusRegionCrop'
import { FocusRegionControls } from '../FocusRegionControls/FocusRegionControls'

interface FocusRegionPanelProps {
  isCapturing: boolean
  focusSize: FocusRegionSize
  onFocusSizeChange: (size: FocusRegionSize) => void
  videoRef: RefObject<HTMLVideoElement | null>
}

export function FocusRegionPanel({
  isCapturing,
  focusSize,
  onFocusSizeChange,
  videoRef,
}: FocusRegionPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useFocusRegionCrop(videoRef, canvasRef, isCapturing, focusSize)

  return (
    <section className="panel">
      <h2>Top-Left Focus</h2>
      <p className="panel-description">
        Live crop of the top-left {focusSize.widthPercent}% ×{' '}
        {focusSize.heightPercent}% — this region will drive automation routines
      </p>
      <FocusRegionControls focusSize={focusSize} onChange={onFocusSizeChange} />
      <div className="focus-container">
        {isCapturing ? (
          <canvas ref={canvasRef} className="focus-canvas" />
        ) : (
          <div className="placeholder focus-placeholder">
            <p>Focus region appears here during capture</p>
          </div>
        )}
      </div>
    </section>
  )
}
