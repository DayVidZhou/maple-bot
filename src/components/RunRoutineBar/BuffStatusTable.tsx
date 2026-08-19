import {
  formatBuffStatusLabel,
  type BuffStatusRow,
} from '../../types/buffStatus'
import { formatButtonKeyLabel } from '../../utils/formatKeyPress'
import './BuffStatusTable.css'

interface BuffStatusTableProps {
  rows: BuffStatusRow[]
  hotkeyProfileName: string | null
  isRunning: boolean
}

export function BuffStatusTable({
  rows,
  hotkeyProfileName,
  isRunning,
}: BuffStatusTableProps) {
  const profileLabel = hotkeyProfileName ?? 'No hotkey profile selected in sidebar'

  return (
    <div className="buff-status">
      <div className="buff-status-header">
        <div>
          <h3>Buffs</h3>
          <p className="buff-status-subtitle">
            {profileLabel}
            {isRunning ? ' · live during run' : ' · from sidebar hotkey profile'}
          </p>
        </div>
      </div>

      <div className="buff-status-table-wrap">
        <table className="buff-status-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Cast (s)</th>
              <th>Cooldown (s)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="buff-status-empty">
                  Link a hotkey profile in the sidebar to show buffs here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`buff-status-row buff-status-row-${row.state}`}
                >
                  <td>{row.name}</td>
                  <td>{row.buttonKey ? formatButtonKeyLabel(row.buttonKey) : '—'}</td>
                  <td>{row.castTimeSeconds}</td>
                  <td>{row.cooldownSeconds}</td>
                  <td className="buff-status-state">{formatBuffStatusLabel(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
