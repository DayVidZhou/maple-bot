import { CaptureControls } from '../CaptureControls/CaptureControls'

export function Header() {
  return (
    <header className="header">
      <div>
        <h1>Maple Bot</h1>
        <p className="subtitle">
          Screen mirror with top-left focus region for routine automation
        </p>
      </div>
      <CaptureControls />
    </header>
  )
}
