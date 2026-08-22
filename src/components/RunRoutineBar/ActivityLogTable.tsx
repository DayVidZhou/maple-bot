import { useState } from 'react'
import {
  formatActivityLogTime,
  type ActivityLogEntry,
} from '../../types/activityLog'
import { copyActivityLogToClipboard } from '../../utils/copyActivityLog'
import './ActivityLogTable.css'

interface ActivityLogTableProps {
  entries: ActivityLogEntry[]
  onClear: () => void
  onLogUserLocation?: () => void
  canLogUserLocation?: boolean
}

export function ActivityLogTable({
  entries,
  onClear,
  onLogUserLocation,
  canLogUserLocation = false,
}: ActivityLogTableProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const handleCopy = async () => {
    try {
      await copyActivityLogToClipboard(entries)
      setCopyFeedback('Copied!')
      window.setTimeout(() => setCopyFeedback(null), 2000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to copy activity log'
      setCopyFeedback(message)
      window.setTimeout(() => setCopyFeedback(null), 3000)
    }
  }

  return (
    <div className="activity-log">
      <div className="activity-log-header">
        <h3>Activity Log</h3>
        <div className="activity-log-header-actions">
          {copyFeedback && (
            <span className="activity-log-copy-feedback">{copyFeedback}</span>
          )}
          <button
            type="button"
            className="btn btn-secondary activity-log-copy"
            onClick={() => void handleCopy()}
            disabled={entries.length === 0}
          >
            Copy all
          </button>
          {onLogUserLocation && (
            <button
              type="button"
              className="btn btn-secondary activity-log-log-location"
              onClick={onLogUserLocation}
              disabled={!canLogUserLocation}
            >
              Log User Location
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary activity-log-clear"
            onClick={onClear}
            disabled={entries.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="activity-log-table-wrap">
        <table className="activity-log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Category</th>
              <th>Event</th>
              <th>Key</th>
              <th>User (live)</th>
              <th>Target POI</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="activity-log-empty">
                  Events and keystrokes will appear here when a routine runs.
                </td>
              </tr>
            ) : (
              [...entries].reverse().map((entry) => (
                <tr key={entry.id} className={`activity-log-row-${entry.category}`}>
                  <td>{formatActivityLogTime(entry.timestamp)}</td>
                  <td>{entry.category}</td>
                  <td>{entry.event}</td>
                  <td>{entry.key ?? '—'}</td>
                  <td className="activity-log-coord">{entry.userCoord ?? '—'}</td>
                  <td className="activity-log-coord">{entry.pointCoord ?? '—'}</td>
                  <td>{entry.detail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
