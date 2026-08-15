interface CaptureControlsProps {
  isCapturing: boolean
  onStart: () => void
  onStop: () => void
}

export function CaptureControls({
  isCapturing,
  onStart,
  onStop,
}: CaptureControlsProps) {
  return (
    <div className="controls">
      {!isCapturing ? (
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start Screen Capture
        </button>
      ) : (
        <button type="button" className="btn btn-danger" onClick={onStop}>
          Stop Capture
        </button>
      )}
    </div>
  )
}
