import { useState } from 'react'
import { useBotSettingsContext } from '../../context/BotSettingsContext'
import './BotSettingsPanel.css'

export function BotSettingsPanel() {
  const {
    settings,
    templateInfo,
    isSaving,
    updateSettings,
    pickTemplateImage,
  } = useBotSettingsContext()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const templateLabel = templateInfo.hasTemplate
    ? templateInfo.width && templateInfo.height
      ? `Template loaded (${templateInfo.width}×${templateInfo.height})`
      : 'Template loaded'
    : 'No template selected'

  const handlePickTemplate = async () => {
    setBusy(true)
    setFeedback(null)
    setError(null)

    try {
      const result = await pickTemplateImage()
      if (!result.ok) {
        setError(result.message ?? 'Failed to choose template image.')
        return
      }
      setFeedback('Template image saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to choose template image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bot-settings-panel">
      <div className="bot-settings-header">
        <div>
          <h3>Bot Settings</h3>
          <p className="bot-settings-summary">
            Detects the lie detector popup by its blue panel, white text, scrambled
            numpad, and bundled reference image.
          </p>
          <p className="bot-settings-meta">
            {templateLabel}
            {!templateInfo.hasTemplate ? ' · using bundled reference' : ''}
          </p>
        </div>

        <div className="bot-settings-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void handlePickTemplate()}
            disabled={busy}
          >
            {busy ? 'Choosing…' : 'Choose template image'}
          </button>
        </div>
      </div>

      <div className="bot-settings-form">
        <label className="bot-settings-checkbox">
          <input
            type="checkbox"
            checked={settings.lieDetectorEnabled}
            onChange={(event) =>
              updateSettings({ lieDetectorEnabled: event.target.checked })
            }
          />
          <span>Alert on Discord when lie detector appears</span>
        </label>

        <label className="bot-settings-field">
          <span>
            Match sensitivity ({Math.round(settings.lieDetectorMatchThreshold * 100)}%)
          </span>
          <input
            type="range"
            min={0.55}
            max={0.95}
            step={0.01}
            value={settings.lieDetectorMatchThreshold}
            disabled={!settings.lieDetectorEnabled}
            onChange={(event) =>
              updateSettings({
                lieDetectorMatchThreshold: Number.parseFloat(event.target.value),
              })
            }
          />
        </label>

        <label className="bot-settings-checkbox">
          <input
            type="checkbox"
            checked={settings.lieDetectorStopRoutine}
            disabled={!settings.lieDetectorEnabled}
            onChange={(event) =>
              updateSettings({ lieDetectorStopRoutine: event.target.checked })
            }
          />
          <span>Stop routine when lie detector is detected</span>
        </label>

        <p className="bot-settings-hint">
          Looks for the soft keyboard numpad (randomized numbers), the big blue and
          white lie detector window, and static UI pieces from your reference screenshot.
          Override the bundled reference with Choose template image if your UI scale differs.
          {isSaving ? ' Saving…' : ''}
        </p>
      </div>

      {(feedback || error) && (
        <div className="bot-settings-feedback">
          {feedback && <span className="bot-settings-success">{feedback}</span>}
          {error && <span className="bot-settings-error">{error}</span>}
        </div>
      )}
    </section>
  )
}
