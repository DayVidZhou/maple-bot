import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import { useVideoStream } from '../../hooks/useVideoStream'
import './ScreenMirror.css'

export function ScreenMirror() {
  const { stream, isCapturing, videoRef } = useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()

  useVideoStream(videoRef, stream)

  return (
    <section className="panel">
      <h2>Screen Mirror</h2>
      <div className="mirror-container">
        {isCapturing ? (
          <>
            <video
              ref={videoRef}
              className="mirror-video"
              autoPlay
              muted
              playsInline
            />
            <div
              className="focus-overlay focus-overlay--top-left"
              style={{
                width: `${focusSize.widthPercent}%`,
                height: `${focusSize.heightPercent}%`,
              }}
            />
          </>
        ) : (
          <div className="placeholder">
            <p>Click &quot;Start Screen Capture&quot; to share your screen</p>
            <p className="hint">
              Select your game window or monitor when prompted
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
