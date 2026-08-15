import { useRef, useState } from 'react'
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner'
import { FocusRegionPanel } from './components/FocusRegionPanel/FocusRegionPanel'
import { Header } from './components/Header/Header'
import { KeyboardPanel } from './components/KeyboardPanel/KeyboardPanel'
import { ScreenMirror } from './components/ScreenMirror/ScreenMirror'
import { StatusBar } from './components/StatusBar/StatusBar'
import { useScreenCapture } from './hooks/useScreenCapture'
import { DEFAULT_FOCUS_SIZE, type FocusRegionSize } from './types/focusRegion'
import './App.css'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [focusSize, setFocusSize] = useState<FocusRegionSize>(DEFAULT_FOCUS_SIZE)

  const { stream, isCapturing, error, startCapture, stopCapture } =
    useScreenCapture()

  return (
    <div className="app">
      <Header
        isCapturing={isCapturing}
        onStartCapture={startCapture}
        onStopCapture={stopCapture}
      />

      {error && <ErrorBanner message={error} />}

      <main className="main">
        <ScreenMirror
          stream={stream}
          isCapturing={isCapturing}
          focusSize={focusSize}
          videoRef={videoRef}
        />
        <FocusRegionPanel
          isCapturing={isCapturing}
          focusSize={focusSize}
          onFocusSizeChange={setFocusSize}
          videoRef={videoRef}
        />
        <KeyboardPanel />
      </main>

      <StatusBar isCapturing={isCapturing} />
    </div>
  )
}

export default App
