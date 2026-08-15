import type { RefObject } from 'react'
import type { FocusRegionSize } from '../../types/focusRegion'
import { useVideoStream } from '../../hooks/useVideoStream'
import './ScreenMirror.css'

interface ScreenMirrorProps {
  stream: MediaStream | null
  isCapturing: boolean
  focusSize: FocusRegionSize
  videoRef: RefObject<HTMLVideoElement | null>
}

export function ScreenMirror({
  stream,
  isCapturing,
  focusSize,
  videoRef,
}: ScreenMirrorProps) {
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
