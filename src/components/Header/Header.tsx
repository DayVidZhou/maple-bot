import { CaptureControls } from '../CaptureControls/CaptureControls'

interface HeaderProps {
  isCapturing: boolean
  onStartCapture: () => void
  onStopCapture: () => void
}

export function Header({
  isCapturing,
  onStartCapture,
  onStopCapture,
}: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>Maple Bot</h1>
        <p className="subtitle">
          Screen mirror with top-left focus region for routine automation
        </p>
      </div>
      <CaptureControls
        isCapturing={isCapturing}
        onStart={onStartCapture}
        onStop={onStopCapture}
      />
    </header>
  )
}
