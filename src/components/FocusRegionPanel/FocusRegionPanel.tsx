import { useCallback, useState } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { useRegistryContext } from '../../context/RegistryContext'
import type { RoutinePoint } from '../../types/routine'
import type { User } from '../../types/user'
import { USER_NOT_FOUND } from '../../types/user'
import { usersEqual } from '../../utils/detectUser'
import { FocusRegionControls } from '../FocusRegionControls/FocusRegionControls'
import { FocusRegionView } from '../FocusRegionView/FocusRegionView'
import { MinimapProfilesSection } from './MinimapProfilesSection'
import '../FocusRegionView/FocusRegionView.css'

const EMPTY_ROUTINE_POINTS: RoutinePoint[] = []

export function FocusRegionPanel() {
  const { focusSize, setFocusSize, selectedMinimapProfileId } =
    useFocusRegionContext()
  const { minimapProfiles } = useRegistryContext()
  const {
    selectedRoutine,
    currentPointIndex,
    updateUserTracker,
  } = useRunRoutineContext()

  const [user, setUser] = useState<User>(USER_NOT_FOUND)

  const displayPoints = selectedRoutine?.points ?? EMPTY_ROUTINE_POINTS
  const highlightPointId =
    currentPointIndex != null && selectedRoutine
      ? selectedRoutine.points[currentPointIndex]?.id ?? null
      : null

  const handleUserFrame = useCallback(
    (frame: { user: User; cropWidth: number; cropHeight: number }) => {
      setUser((current) =>
        usersEqual(current, frame.user) ? current : frame.user,
      )
      updateUserTracker({
        user: frame.user,
        cropWidth: frame.cropWidth,
        cropHeight: frame.cropHeight,
      })
    },
    [updateUserTracker],
  )

  const selectedProfile = minimapProfiles.find(
    (profile) => profile.id === selectedMinimapProfileId,
  )

  return (
    <section className="panel focus-region-panel">
      <h2>Mini Map</h2>
      <p className="panel-description">
        {selectedProfile
          ? `Profile "${selectedProfile.name}" — ${focusSize.widthPercent}% × ${focusSize.heightPercent}% crop. Changes auto-save.`
          : `Live crop of the mini map (${focusSize.widthPercent}% × ${focusSize.heightPercent}%)`}
      </p>
      <FocusRegionControls
        focusSize={focusSize}
        user={user}
        onChange={setFocusSize}
      />
      <FocusRegionView
        displayPoints={displayPoints}
        highlightPointId={highlightPointId}
        onUserFrame={handleUserFrame}
      />
      <MinimapProfilesSection />
    </section>
  )
}
