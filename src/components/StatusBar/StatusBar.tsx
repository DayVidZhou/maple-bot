import { useScreenCaptureContext } from '../../context/ScreenCaptureContext'

export function StatusBar() {
  const { isCapturing } = useScreenCaptureContext()

  return (
    <footer className="footer">
      <span className={`status ${isCapturing ? 'status-active' : ''}`}>
        {isCapturing ? '● Capturing' : '○ Idle'}
      </span>
    </footer>
  )
}
