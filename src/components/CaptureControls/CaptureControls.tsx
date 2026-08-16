import { useElectronAppsContext } from '../../context/ElectronAppsContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'

export function CaptureControls() {
  const { isCapturing, startCapture, stopCapture } = useScreenCaptureContext()
  const {
    isAvailable,
    isListing,
    isFocusingMapleStory,
    listOpenApplications,
    focusMapleStoryWorlds,
  } = useElectronAppsContext()
  const { openRoutines } = useRoutineContext()

  return (
    <div className="controls">
      <button type="button" className="btn btn-secondary" onClick={openRoutines}>
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
