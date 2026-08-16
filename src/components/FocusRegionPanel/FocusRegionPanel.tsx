import { useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import type { YellowShapeDetection } from '../../utils/detectYellowShape'
import { FocusRegionControls } from '../FocusRegionControls/FocusRegionControls'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import '../FocusRegionView/FocusRegionView.css'

export function FocusRegionPanel() {
  const { focusSize, setFocusSize } = useFocusRegionContext()
  const [yellowShape, setYellowShape] = useState<YellowShapeDetection | null>(
    null,
  )

  return (
    <section className="panel">
      <h2>Top-Left Focus</h2>
      <p className="panel-description">
        Live crop of the top-left {focusSize.widthPercent}% ×{' '}
        {focusSize.heightPercent}% — this region will drive automation routines
      </p>
      <FocusRegionControls
        focusSize={focusSize}
        yellowShape={yellowShape}
        onChange={setFocusSize}
      />
      <FocusRegionView onYellowShapeChange={setYellowShape} />
    </section>
  )
}
