import { useElectronAppsContext } from '../../context/ElectronAppsContext'
import { useRegistryContext } from '../../context/RegistryContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import { defaultRegistryName } from '../../types/registry'

export function CaptureControls() {
  const { isCapturing, startCapture, stopCapture, openMirror } =
    useScreenCaptureContext()
  const {
    isAvailable,
    isListing,
    isFocusingMapleStory,
    listOpenApplications,
    focusMapleStoryWorlds,
  } = useElectronAppsContext()
  const { routines } = useRegistryContext()
  const { startNewRoutineDraft } = useRoutineContext()

  const handleAddRoutine = () => {
    startNewRoutineDraft(
      defaultRegistryName('routine', routines.length),
    )
  }

  return (
    <div className="controls">
      <button type="button" className="btn btn-secondary" onClick={openMirror}>
        Screen Mirror
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleAddRoutine}
      >
        Add a Routine
      </button>
      {isAvailable && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={focusMapleStoryWorlds}
          disabled={isFocusingMapleStory}
        >
          {isFocusingMapleStory ? 'Focusing…' : 'Focus MapleStory Worlds'}
        </button>
      )}
      {isAvailable && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={listOpenApplications}
          disabled={isListing}
        >
          {isListing ? 'Listing…' : 'List Open Apps'}
        </button>
      )}
      {!isCapturing ? (
        <button type="button" className="btn btn-primary" onClick={startCapture}>
          Start Screen Capture
        </button>
      ) : (
        <button type="button" className="btn btn-danger" onClick={stopCapture}>
          Stop Capture
        </button>
      )}
    </div>
  )
}
