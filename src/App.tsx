import { ErrorBanner } from './components/ErrorBanner/ErrorBanner'
import { FocusRegionPanel } from './components/FocusRegionPanel/FocusRegionPanel'
import { Header } from './components/Header/Header'
import { KeyboardPanel } from './components/KeyboardPanel/KeyboardPanel'
import { RoutinesDialog } from './components/RoutinesDialog/RoutinesDialog'
import { ScreenMirror } from './components/ScreenMirror/ScreenMirror'
import { StatusBar } from './components/StatusBar/StatusBar'
import { useElectronAppsContext } from './context/ElectronAppsContext'
import { useScreenCaptureContext } from './context/ScreenCaptureContext'
import './App.css'

function App() {
  const { error: captureError } = useScreenCaptureContext()
  const { error: appsError } = useElectronAppsContext()
  const error = captureError ?? appsError

  return (
    <div className="app">
      <Header />

      {error && <ErrorBanner message={error} />}

      <main className="main">
        <ScreenMirror />
        <FocusRegionPanel />
        <KeyboardPanel />
      </main>

      <StatusBar />

      <RoutinesDialog />
    </div>
  )
}

export default App
