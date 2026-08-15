import { useState } from 'react'
import { useKeyboard } from '../../hooks/useKeyboard'
import './KeyboardPanel.css'

const QUICK_KEYS = ['left', 'right', 'up', 'down', 'space', 'ctrl', 'shift', 'z', 'x']

export function KeyboardPanel() {
  const { isAvailable, isSending, error, tapKey, typeText } = useKeyboard()
  const [keyInput, setKeyInput] = useState('left')
  const [textInput, setTextInput] = useState('')

  const handleTapKey = async () => {
    if (!keyInput.trim()) return
    await tapKey(keyInput.trim())
  }

  const handleTypeText = async () => {
    if (!textInput) return
    await typeText(textInput)
    setTextInput('')
  }

  return (
    <section className="panel keyboard-panel">
      <h2>Keyboard Control</h2>
      <p className="panel-description">
        Send key presses to other desktop applications via the Electron main process.
        Focus the target window before sending keys.
      </p>

      {!isAvailable && (
        <div className="keyboard-warning">
          Run with <code>npm run dev</code> inside Electron to enable keyboard control.
        </div>
      )}

      {error && <div className="keyboard-error">{error}</div>}

      <div className="keyboard-row">
        <label className="keyboard-field">
          <span>Key</span>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="e.g. left, space, ctrl"
            disabled={!isAvailable || isSending}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleTapKey}
          disabled={!isAvailable || isSending || !keyInput.trim()}
        >
          Tap Key
        </button>
      </div>

      <div className="quick-keys">
        {QUICK_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="btn btn-secondary"
            onClick={() => tapKey(key)}
            disabled={!isAvailable || isSending}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        <label className="keyboard-field keyboard-field--grow">
          <span>Type text</span>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Text to type into focused window"
            disabled={!isAvailable || isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleTypeText()
              }
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleTypeText}
          disabled={!isAvailable || isSending || !textInput}
        >
          Type
        </button>
      </div>
    </section>
  )
}
