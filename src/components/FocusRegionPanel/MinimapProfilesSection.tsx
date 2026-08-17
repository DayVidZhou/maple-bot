import { useRegistryContext } from '../../context/RegistryContext'
import { useRegistryNameInput } from '../../hooks/useRegistryNameInput'
import { formatMinimapProfileLabel } from '../../utils/minimapProfile'
import './MinimapProfilesSection.css'

export function MinimapProfilesSection() {
  const {
    minimapProfiles,
    selectedMinimapProfileId,
    setSelectedMinimapProfileId,
    addMinimapProfile,
    removeSelectedMinimapProfile,
    minimapSaveFile,
    lastSavedAt,
  } = useRegistryContext()
  const { name, setName, resolveName } = useRegistryNameInput(
    'minimap',
    minimapProfiles.length,
  )

  const handleAdd = () => {
    addMinimapProfile(resolveName())
  }

  return (
    <section className="minimap-profiles">
      <div className="minimap-profiles-header">
        <h3>Profiles</h3>
        <p className="minimap-profiles-hint">
          Width and height auto-save to the selected profile.
        </p>
      </div>

      <ul className="minimap-profiles-list">
        {minimapProfiles.length === 0 ? (
          <li className="minimap-profiles-empty">No mini map profiles yet</li>
        ) : (
          minimapProfiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className={`minimap-profile-item ${
                  profile.id === selectedMinimapProfileId ? 'selected' : ''
                }`}
                onClick={() => setSelectedMinimapProfileId(profile.id)}
              >
                {formatMinimapProfileLabel(profile)}
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="minimap-profiles-add-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd()
          }}
          placeholder="Profile name"
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add
        </button>
      </div>

      <button
        type="button"
        className="btn btn-danger minimap-profiles-remove"
        onClick={removeSelectedMinimapProfile}
        disabled={!selectedMinimapProfileId || minimapProfiles.length <= 1}
      >
        Remove
      </button>

      <p className="minimap-profiles-save-info">
        Saved locally to <code>{minimapSaveFile}</code>
        {lastSavedAt && (
          <>
            {' '}
            · last updated {new Date(lastSavedAt).toLocaleString()}
          </>
        )}
      </p>
    </section>
  )
}
