import { useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import type { User } from '../../types/user'
import { USER_NOT_FOUND } from '../../types/user'
import { FocusRegionControls } from '../FocusRegionControls/FocusRegionControls'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import '../FocusRegionView/FocusRegionView.css'

export function FocusRegionPanel() {
  const { focusSize, setFocusSize } = useFocusRegionContext()
  const [user, setUser] = useState<User>(USER_NOT_FOUND)

  return (
    <section className="panel focus-region-panel">
      <h2>Mini Map</h2>
      <p className="panel-description">
        Live crop of the mini map ({focusSize.widthPercent}% ×{' '}
        {focusSize.heightPercent}%) — this region will drive automation routines
      </p>
      <FocusRegionControls
        focusSize={focusSize}
        user={user}
        onChange={setFocusSize}
      />
      <FocusRegionView onUserChange={setUser} />
    </section>
  )
}
