interface StatusBarProps {
  isCapturing: boolean
}

export function StatusBar({ isCapturing }: StatusBarProps) {
  return (
    <footer className="footer">
      <span className={`status ${isCapturing ? 'status-active' : ''}`}>
        {isCapturing ? '● Capturing' : '○ Idle'}
      </span>
    </footer>
  )
}
