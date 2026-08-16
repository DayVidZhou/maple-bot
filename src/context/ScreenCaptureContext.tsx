import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { useScreenCapture } from '../hooks/useScreenCapture'
import { useVideoStream } from '../hooks/useVideoStream'

interface ScreenCaptureContextValue {
  stream: MediaStream | null
  isCapturing: boolean
  error: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  startCapture: () => Promise<void>
  stopCapture: () => void
  mirrorOpen: boolean
  setMirrorOpen: (open: boolean) => void
  openMirror: () => void
}

const ScreenCaptureContext = createContext<ScreenCaptureContextValue | null>(
  null,
)

function CaptureVideo({
  videoRef,
  stream,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
}) {
  useVideoStream(videoRef, stream)

  return (
    <video
      ref={videoRef}
      className="capture-video-hidden"
      autoPlay
      muted
      playsInline
      aria-hidden
    />
  )
}

export function ScreenCaptureProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const capture = useScreenCapture()
  const [mirrorOpen, setMirrorOpen] = useState(false)

  return (
    <ScreenCaptureContext.Provider
      value={{
        ...capture,
        videoRef,
        mirrorOpen,
        setMirrorOpen,
        openMirror: () => setMirrorOpen(true),
      }}
    >
      <CaptureVideo videoRef={videoRef} stream={capture.stream} />
      {children}
    </ScreenCaptureContext.Provider>
  )
}

export function useScreenCaptureContext(): ScreenCaptureContextValue {
  const context = useContext(ScreenCaptureContext)
  if (!context) {
    throw new Error(
      'useScreenCaptureContext must be used within ScreenCaptureProvider',
    )
  }
  return context
}
