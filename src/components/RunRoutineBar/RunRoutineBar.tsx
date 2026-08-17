import { useActivityLogContext } from '../../context/ActivityLogContext'
import { useRunRoutineContext } from '../../context/RunRoutineContext'
import { ActivityLogTable } from './ActivityLogTable'
import './RunRoutineBar.css'

export function RunRoutineBar() {
  const {
    isRunning,
    status,
    error,
    selectedRoutine,
    canRun,
    startRun,
    stopRun,
  } = useRunRoutineContext()
  const { entries, clearLog } = useActivityLogContext()

  const routineName = selectedRoutine?.name ?? 'No routine selected'
  const pointCount = selectedRoutine?.points.length ?? 0

  return (
    <section className="run-routine-bar panel" aria-live="polite">
      <div className="run-routine-bar-main">
        <div className="run-routine-bar-copy">
          <h2>Run Routine</h2>
          <p>
            {routineName}
            {pointCount > 0
              ? ` · ${pointCount} point${pointCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>

        <div className="run-routine-bar-actions">
          {isRunning ? (
            <button type="button" className="btn btn-danger" onClick={stopRun}>
              Stop Routine
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void startRun()}
              disabled={!canRun}
            >
              Run Routine
            </button>
          )}
        </div>
      </div>

      <div className="run-routine-bar-status">
        <span className={isRunning ? 'run-routine-status-active' : ''}>
          {status}
        </span>
        {error && <span className="run-routine-error">{error}</span>}
        {!canRun && !isRunning && (
          <span className="run-routine-hint">
            Select a routine with points and start capture to run.
          </span>
        )}
      </div>

      <ActivityLogTable entries={entries} onClear={clearLog} />
    </section>
  )
}
