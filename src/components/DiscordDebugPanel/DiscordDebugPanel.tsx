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

function formatConfigStatus(status: DiscordConnectionStatus): string {
  if (!status.enabled) {
    return 'Discord disabled — set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env'
  }

  if (status.connected) {
    return `Connected as ${status.botTag ?? 'bot'}`
  }

  return 'Configured but not connected yet'
}

function formatConfigChecks(status: DiscordConnectionStatus): string {
  const checks = [
    status.hasToken ? 'token' : 'missing token',
    status.hasClientId ? 'client id' : 'missing client id',
    status.hasOwnerId ? 'owner id' : 'missing owner id',
  ]
  return checks.join(' · ')
}

export function DiscordDebugPanel() {
  const { logActivity } = useActivityLogContext()
  const [status, setStatus] = useState<DiscordConnectionStatus | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<
    'refresh' | 'message' | 'screenshot' | null
  >(null)

  const isAvailable = Boolean(window.electronAPI?.getDiscordStatus)

  const refreshStatus = useCallback(async () => {
    if (!window.electronAPI?.getDiscordStatus) return null

    console.log('[discord] Refreshing connection status from UI')
    setBusyAction('refresh')
    try {
      const nextStatus = await window.electronAPI.getDiscordStatus()
      console.log('[discord] Connection status from UI', nextStatus)
      setStatus(nextStatus)
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
        </div>

        <div className="discord-debug-actions">
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

      {(feedback || error) && (
        <div className="discord-debug-feedback">
          {feedback && <span className="discord-debug-success">{feedback}</span>}
          {error && <span className="discord-debug-error">{error}</span>}
        </div>
      )}

      {status && !status.hasOwnerId && (
        <p className="discord-debug-hint">
          Add DISCORD_OWNER_ID to .env and restart the app.
        </p>
      )}

      {status?.connected && (
        <p className="discord-debug-hint">
          MapleBot must be in a server with you before it can DM you. Invite it
          via Developer Portal → OAuth2 → URL Generator (scopes: bot +
          applications.commands).
        </p>
      )}
    </section>
  )
}
