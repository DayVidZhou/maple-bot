import * as Dialog from '@radix-ui/react-dialog'
import { useRef } from 'react'
import { useFocusRegionContext } from '../../context/FocusRegionContext'
import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'
import { useVideoStream } from '../../hooks/useVideoStream'
import './ScreenMirrorDialog.css'

export function ScreenMirrorDialog() {
  const { isCapturing, stream, mirrorOpen, setMirrorOpen } =
    useScreenCaptureContext()
  const { focusSize } = useFocusRegionContext()
  const displayVideoRef = useRef<HTMLVideoElement>(null)

  useVideoStream(displayVideoRef, stream)

  return (
    <Dialog.Root open={mirrorOpen} onOpenChange={setMirrorOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="screen-mirror-overlay" />
        <Dialog.Content className="screen-mirror-dialog">
          <div className="screen-mirror-header">
            <Dialog.Title className="screen-mirror-title">
              Screen Mirror
            </Dialog.Title>
            <Dialog.Close className="screen-mirror-close" aria-label="Close">
              ×
            </Dialog.Close>
          </div>

          <div className="mirror-container mirror-container-dialog">
            {isCapturing ? (
              <>
                <video
                  ref={displayVideoRef}
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
                <p>Start screen capture to view the mirror</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
