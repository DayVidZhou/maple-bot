import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { useScreenCapture } from '../hooks/useScreenCapture'

interface ScreenCaptureContextValue {
  stream: MediaStream | null
  isCapturing: boolean
  error: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  startCapture: () => Promise<void>
  stopCapture: () => void
}

const ScreenCaptureContext = createContext<ScreenCaptureContextValue | null>(
  null,
)

export function ScreenCaptureProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const capture = useScreenCapture()

  return (
    <ScreenCaptureContext.Provider value={{ ...capture, videoRef }}>
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
