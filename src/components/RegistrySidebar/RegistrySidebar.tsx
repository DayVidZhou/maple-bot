import { useRegistryContext } from '../../context/RegistryContext'
import { useHotkeyContext } from '../../context/HotkeyContext'
import { useRoutineContext } from '../../context/RoutineContext'
import { useRegistryNameInput } from '../../hooks/useRegistryNameInput'
import './RegistrySidebar.css'

export function RegistrySidebar() {
  const { lastSavedAt, routineSaveFile, hotkeySaveFile } = useRegistryContext()

  return (
    <aside className="registry-sidebar panel">
      <p className="registry-save-info">
        Saved locally to{' '}
        <code>{routineSaveFile}</code> and <code>{hotkeySaveFile}</code>
        {lastSavedAt && (
          <>
            {' '}
            · last updated{' '}
            {new Date(lastSavedAt).toLocaleString()}
          </>
        )}
      </p>
      <RoutinesListSection />
      <HotkeysListSection />
    </aside>
  )
}

function RoutinesListSection() {
  const {
    routines,
    selectedRoutineId,
    setSelectedRoutineId,
    removeSelectedRoutine,
  } = useRegistryContext()
  const { startNewRoutineDraft, startEditRoutineDraft } = useRoutineContext()
  const { name, setName, resolveName } = useRegistryNameInput(
    'routine',
    routines.length,
  )

  const handleAdd = () => {
    startNewRoutineDraft(resolveName())
  }

  return (
    <section className="registry-section">
      <h2>Routines</h2>
      <ul className="registry-list">
        {routines.length === 0 ? (
          <li className="registry-list-empty">No routines yet</li>
        ) : (
          routines.map((routine) => (
            <li key={routine.id} className="registry-list-row">
              <button
                type="button"
                className={`registry-list-item ${
                  routine.id === selectedRoutineId ? 'selected' : ''
                }`}
                onClick={() => setSelectedRoutineId(routine.id)}
              >
                {routine.name}
              </button>
              <button
                type="button"
                className="btn btn-secondary registry-edit-btn"
                onClick={() => startEditRoutineDraft(routine)}
                aria-label={`Edit ${routine.name}`}
              >
                Edit
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="registry-add-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd()
          }}
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add
        </button>
      </div>
      <button
        type="button"
        className="btn btn-danger registry-remove-btn"
        onClick={removeSelectedRoutine}
        disabled={!selectedRoutineId}
      >
        Remove
      </button>
    </section>
  )
}

function HotkeysListSection() {
  const {
    hotkeys,
    selectedHotkeyId,
    setSelectedHotkeyId,
    removeSelectedHotkey,
  } = useRegistryContext()
  const { startNewHotkeyDraft, startEditHotkeyDraft } = useHotkeyContext()
  const { name, setName, resolveName } = useRegistryNameInput(
    'hotkey',
    hotkeys.length,
  )

  const handleAdd = () => {
    startNewHotkeyDraft(resolveName())
  }

  return (
    <section className="registry-section">
      <h2>Hotkeys</h2>
      <ul className="registry-list">
        {hotkeys.length === 0 ? (
          <li className="registry-list-empty">No hotkeys yet</li>
        ) : (
          hotkeys.map((hotkey) => (
            <li key={hotkey.id} className="registry-list-row">
              <button
                type="button"
                className={`registry-list-item ${
                  hotkey.id === selectedHotkeyId ? 'selected' : ''
                }`}
                onClick={() => setSelectedHotkeyId(hotkey.id)}
              >
                {hotkey.name}
              </button>
              <button
                type="button"
                className="btn btn-secondary registry-edit-btn"
                onClick={() => startEditHotkeyDraft(hotkey)}
                aria-label={`Edit ${hotkey.name}`}
              >
                Edit
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="registry-add-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd()
          }}
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add
        </button>
      </div>
      <button
        type="button"
        className="btn btn-danger registry-remove-btn"
        onClick={removeSelectedHotkey}
        disabled={!selectedHotkeyId}
      >
        Remove
      </button>
    </section>
  )
}
