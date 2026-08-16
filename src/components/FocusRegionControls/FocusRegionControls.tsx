import { FOCUS_SIZE_LIMITS, type FocusRegionSize } from '../../types/focusRegion'
import type { YellowShapeDetection } from '../../utils/detectYellowShape'
import './FocusRegionControls.css'

interface FocusRegionControlsProps {
  focusSize: FocusRegionSize
  yellowShape: YellowShapeDetection | null
  onChange: (size: FocusRegionSize) => void
}

function clamp(value: number): number {
  return Math.min(FOCUS_SIZE_LIMITS.max, Math.max(FOCUS_SIZE_LIMITS.min, value))
}

export function FocusRegionControls({
  focusSize,
  yellowShape,
  onChange,
}: FocusRegionControlsProps) {
  const handleWidthChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    onChange({ ...focusSize, widthPercent: clamp(parsed) })
  }

  const handleHeightChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    onChange({ ...focusSize, heightPercent: clamp(parsed) })
  }

  return (
    <div className="focus-region-controls">
      <label className="focus-control">
        <span>Width (%)</span>
        <input
          type="number"
          min={FOCUS_SIZE_LIMITS.min}
          max={FOCUS_SIZE_LIMITS.max}
          value={focusSize.widthPercent}
          onChange={(e) => handleWidthChange(e.target.value)}
        />
      </label>
      <label className="focus-control">
        <span>Height (%)</span>
        <input
          type="number"
          min={FOCUS_SIZE_LIMITS.min}
          max={FOCUS_SIZE_LIMITS.max}
          value={focusSize.heightPercent}
          onChange={(e) => handleHeightChange(e.target.value)}
        />
      </label>
      <div className="yellow-shape-coords">
        {yellowShape ? (
          <>
            <span className="yellow-shape-label">Yellow shape</span>
            <span>
              x: {yellowShape.x}, y: {yellowShape.y}
            </span>
          </>
        ) : (
          <span className="yellow-shape-empty">Yellow shape not detected</span>
        )}
      </div>
    </div>
  )
}
