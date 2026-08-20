import { useCallback, useEffect, useState } from 'react'
import { useActivityLogContext } from '../../context/ActivityLogContext'
import './DiscordDebugPanel.css'

interface DiscordConnectionStatus {
  enabled: boolean
  connected: boolean
  botTag: string | null
  hasToken: boolean
  hasClientId: boolean
  hasOwnerId: boolean
}

interface DiscordConfigForm {
  token: string
  clientId: string
  ownerId: string
}

function formatConfigStatus(status: DiscordConnectionStatus): string {
  if (!status.enabled) {
    return 'Not configured — add shared bot credentials and your Discord User ID below'
  }

  if (status.connected) {
    return `Connected as ${status.botTag ?? 'bot'} — DMs go to you on this PC`
  }

  return 'Saved — waiting for bot to connect (restart if this persists)'
}

function formatConfigChecks(status: DiscordConnectionStatus): string {
  const checks = [
    status.hasToken ? 'bot token' : 'missing bot token',
    status.hasClientId ? 'application id' : 'missing application id',
    status.hasOwnerId ? 'your user id' : 'missing your user id',
  ]
  return checks.join(' · ')
}

export function DiscordDebugPanel() {
  const { logActivity } = useActivityLogContext()
  const [status, setStatus] = useState<DiscordConnectionStatus | null>(null)
  const [config, setConfig] = useState<DiscordConfigForm>({
    token: '',
    clientId: '',
    ownerId: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<
    'refresh' | 'save' | 'message' | 'screenshot' | null
  >(null)
  const [showSetup, setShowSetup] = useState(true)

  const isAvailable = Boolean(window.electronAPI?.getDiscordStatus)

  const refreshStatus = useCallback(async () => {
    if (!window.electronAPI?.getDiscordStatus) return null

    console.log('[discord] Refreshing connection status from UI')
    setBusyAction('refresh')
    try {
      const [nextStatus, nextConfig] = await Promise.all([
        window.electronAPI.getDiscordStatus(),
        window.electronAPI.getDiscordConfig?.() ?? Promise.resolve(null),
      ])
      console.log('[discord] Connection status from UI', nextStatus)
      setStatus(nextStatus)
      if (nextConfig) {
        setConfig(nextConfig)
        setShowSetup(!nextStatus.enabled || !nextStatus.hasOwnerId)
      }
      return nextStatus
    } finally {
      setBusyAction(null)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const runDiscordAction = useCallback(
    async (
      action: 'message' | 'screenshot',
      fn: () => Promise<void>,
      successEvent: string,
    ) => {
      setBusyAction(action)
      setError(null)
      setFeedback(null)

      console.log('[discord] UI action started', { action })

      try {
        await fn()
        const message =
          action === 'message'
            ? 'Test message sent to your Discord DMs'
            : 'Screenshot sent to your Discord DMs'
        console.log('[discord] UI action succeeded', { action, message })
        setFeedback(message)
        logActivity({
          category: 'system',
          event: successEvent,
          detail: message,
        })
        await refreshStatus()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Discord request failed'
        console.error('[discord] UI action failed', { action, error: message, err })
        setError(message)
        logActivity({
          category: 'system',
          event: 'Discord debug failed',
          detail: `${action}: ${message}`,
        })
      } finally {
        setBusyAction(null)
      }
    },
    [logActivity, refreshStatus],
  )

  const handleSaveConfig = async () => {
    if (!window.electronAPI?.saveDiscordConfig) {
      setError('Discord save is not available')
      return
    }

    setBusyAction('save')
    setError(null)
    setFeedback(null)

    try {
      const nextStatus = await window.electronAPI.saveDiscordConfig(config)
      setStatus(nextStatus)
      setShowSetup(false)
      setFeedback('Discord settings saved and bot reconnected.')
      logActivity({
        category: 'system',
        event: 'Discord configured',
        detail: 'Settings saved for this user',
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save Discord settings'
      setError(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleSendMessage = () => {
    if (!window.electronAPI?.sendDiscordTestMessage) {
      setError('Discord API is not available')
      return
    }

    void runDiscordAction(
      'message',
      () => window.electronAPI!.sendDiscordTestMessage(),
      'Discord test message',
    )
  }

  const handleSendScreenshot = () => {
    if (!window.electronAPI?.sendDiscordScreenshot) {
      setError('Discord API is not available')
      return
    }

    void runDiscordAction(
      'screenshot',
      () => window.electronAPI!.sendDiscordScreenshot(),
      'Discord test screenshot',
    )
  }

  if (!isAvailable) return null

  return (
    <section className="discord-debug-panel">
      <div className="discord-debug-header">
        <div>
          <h3>Discord</h3>
          <p className="discord-debug-summary">
            {status ? formatConfigStatus(status) : 'Checking connection…'}
          </p>
          {status && (
            <p className="discord-debug-config">{formatConfigChecks(status)}</p>
          )}
          {status?.connected && (
            <p className="discord-debug-hint">
              DM commands: /help, /screenshot, /status, /start, /stop, /keypress
            </p>
          )}
        </div>

        <div className="discord-debug-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSetup((open) => !open)}
          >
            {showSetup ? 'Hide setup' : 'Edit setup'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void refreshStatus()}
            disabled={busyAction !== null}
          >
            {busyAction === 'refresh' ? 'Refreshing…' : 'Refresh status'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSendMessage}
            disabled={busyAction !== null || !status?.connected}
          >
            {busyAction === 'message' ? 'Sending…' : 'Send test message'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSendScreenshot}
            disabled={busyAction !== null || !status?.connected}
          >
            {busyAction === 'screenshot' ? 'Sending…' : 'Send test screenshot'}
          </button>
        </div>
      </div>

      {showSetup && (
        <div className="discord-setup-form">
          <p className="discord-debug-hint">
            Everyone uses the same MapleBot app (token + application id from your
            server admin). Each person sets their own Discord User ID so
            screenshots go to their DMs only.
          </p>
          <label className="discord-setup-field">
            <span>Bot token (shared)</span>
            <input
              type="password"
              value={config.token}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  token: event.target.value,
                }))
              }
              placeholder="From Discord Developer Portal → Bot"
              autoComplete="off"
            />
          </label>
          <label className="discord-setup-field">
            <span>Application ID (shared)</span>
            <input
              type="text"
              value={config.clientId}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  clientId: event.target.value,
                }))
              }
              placeholder="General Information → Application ID"
            />
          </label>
          <label className="discord-setup-field">
            <span>Your Discord User ID (unique per person)</span>
            <input
              type="text"
              value={config.ownerId}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  ownerId: event.target.value,
                }))
              }
              placeholder="Right-click your name → Copy User ID"
            />
          </label>
          <div className="discord-setup-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSaveConfig()}
              disabled={busyAction !== null}
            >
              {busyAction === 'save' ? 'Saving…' : 'Save & connect'}
            </button>
          </div>
          <p className="discord-debug-hint">
            One-time: join a server that has MapleBot, open a DM with the bot,
            then run Send test message. Enable “Send Discord screenshots” on a
            routine to get DMs every 30s while it runs.
          </p>
        </div>
      )}

      {(feedback || error) && (
        <div className="discord-debug-feedback">
          {feedback && <span className="discord-debug-success">{feedback}</span>}
          {error && <span className="discord-debug-error">{error}</span>}
        </div>
      )}
    </section>
  )
}
