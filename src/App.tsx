import { ErrorBanner } from './components/ErrorBanner/ErrorBanner'
import { FocusRegionPanel } from './components/FocusRegionPanel/FocusRegionPanel'
import { Header } from './components/Header/Header'
import { RegistrySidebar } from './components/RegistrySidebar/RegistrySidebar'
import { RunRoutineBar } from './components/RunRoutineBar/RunRoutineBar'
import { RoutinesDialog } from './components/RoutinesDialog/RoutinesDialog'
import { HotkeysDialog } from './components/HotkeysDialog/HotkeysDialog'
import { ScreenMirrorDialog } from './components/ScreenMirrorDialog/ScreenMirrorDialog'
import { StatusBar } from './components/StatusBar/StatusBar'
import { useElectronAppsContext } from './context/ElectronAppsContext'
import { useScreenCaptureContext } from './context/ScreenCaptureContext'
import './App.css'
import './components/RegistrySidebar/RegistrySidebar.css'

function App() {
  const { error: captureError } = useScreenCaptureContext()
  const { error: appsError } = useElectronAppsContext()
  const error = captureError ?? appsError

  return (
    <div className="app">
      <Header />

      {error && <ErrorBanner message={error} />}

      <main className="main dashboard">
        <FocusRegionPanel />
        <RegistrySidebar />
      </main>

      <RunRoutineBar />

      <StatusBar />

      <RoutinesDialog />
      <HotkeysDialog />
      <ScreenMirrorDialog />
    </div>
  )
}

export default App
