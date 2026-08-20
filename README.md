# Maple Bot

Electron desktop app for MapleStory Worlds routine automation. Captures your screen, tracks the minimap, runs point-to-point routines, and optionally alerts you on Discord.

## Features

- **Screen capture** — mirror a window or monitor in the app
- **Minimap focus region** — adjustable crop for player detection and routine points
- **Routines** — ordered points with moves (attacks, buffs, movement); drag to reorder
- **Hotkey profiles** — map in-game actions to keys with cooldowns and cast times
- **Buff tracking** — live cooldown status while a routine runs
- **Lie detector** — template-matching scan during routines; Discord alert + optional auto-stop
- **Discord remote control** — slash commands to start/stop, screenshot, and tap keys
- **Auto-save** — routines, hotkeys, minimap profiles, bot settings, and Discord config persist locally

## Getting started

```bash
npm install
npm run dev
```

## Instructions

### 1. Capture the game

1. Launch MapleStory Worlds and Maple Bot.
2. Click **Start Screen Capture** and pick the game window.
3. Adjust the **focus region** (minimap crop) until your character position tracks correctly.

Minimap profiles save crop size per profile and auto-save when changed.

### 2. Set up hotkeys

1. In the sidebar, add a **Hotkey** profile (or edit an existing one).
2. Add **Moves**, **Buffs**, and **Attacks** — assign each action a key, cooldown, and cast time.
3. Use **Capture key** to record a key press, or type the key name manually.

The selected hotkey profile is used when running routines.

### 3. Build a routine

1. Add a **Routine** in the sidebar and click **Edit**.
2. With capture running, click **Add point** to place points on the minimap (uses current player position when detected).
3. For each point, add **moves** from your hotkey profile — set hold duration and optional left/right direction.
4. Drag points to reorder. Use **Duplicate point** / **Duplicate move** to copy setups quickly.
5. Optionally enable **Send Discord screenshots every 30s while running**.
6. **Save** the routine.

Select the routine in the sidebar before running.

### 4. Run a routine

1. Start screen capture.
2. Select a routine with at least one point.
3. Click **Run Routine** (or use Discord `/start`).

The bot focuses MapleStory Worlds, walks between points using minimap detection, executes each point’s moves, and tracks buff cooldowns. Click **Stop Routine** or use `/stop` to halt.

Requirements: capture on, routine selected, hotkey profile configured for any moves that need keys.

### 5. Lie detector (optional)

Open **Bot Settings**:

- Enable lie detector alerts.
- Optionally upload a custom template image (defaults to bundled reference).
- Tune match threshold, scan interval (30–120s), alert cooldown, and whether to stop the routine on detection.

Scans run once when a routine starts, then every 30s while it is running. On match, you get an activity log entry, a Discord DM (if configured), and optionally an auto-stop.

### 6. Discord setup (optional)

In the **Discord** panel:

1. Enter the shared **bot token** and **application ID**.
2. Enter **your Discord User ID** (owner) — used for DMs (screenshots, lie detector alerts, test messages).
3. Click **Save & connect**.

**Slash commands** (available to all users in a server; replies are ephemeral):

| Command | Description |
|---------|-------------|
| `/help` | List commands |
| `/start` | Start the selected routine (capture must be on) |
| `/stop` | Stop the running routine |
| `/screenshot` | DM a screenshot to the owner |
| `/status` | Show bot status |
| `/keypress key:<name>` | Tap a key in MapleStory Worlds |

Invite the bot to your server with the `applications.commands` scope so slash commands register.

## Save files

Data auto-saves on change.

| Dev (`npm run dev`) | Packaged app |
|---------------------|--------------|
| Project root | OS app data folder |

**macOS:** `~/Library/Application Support/Maple Bot/`  
**Windows:** `%APPDATA%\Maple Bot\`

Files: `.routine-save-file.ts`, `.hotkey-save-file.ts`, `.minimap-save-file.ts`, `.bot-settings-save-file.ts`, `.lie-detector-template`, `.env`

## Building

```bash
npm run build          # compile renderer + main
npm run pack           # build + package (current OS)
npm run pack:mac       # macOS dmg/zip
npm run pack:win       # Windows installer + portable + zip
```

Output goes to `release/`.

### Windows downloads

After `npm run pack:win`, use one of these — **not** a lone exe copied out of `win-unpacked/`:

| File | Use when |
|------|----------|
| `Maple Bot-Setup-<version>.exe` | Normal install. Run from anywhere (Downloads, Desktop, etc.); installs to `%LOCALAPPDATA%\Programs\`. |
| `Maple Bot-Portable-<version>.exe` | No install. Single file you can move anywhere and double-click. |
| `Maple Bot-<version>-win-x64.zip` | Extract the **whole folder**, then run `Maple Bot.exe` inside it. |

`release/win-unpacked/` is a dev/build artifact. It only works when the full folder (exe + `resources/` + DLLs) stays together. Copying just `Maple Bot.exe` to Downloads will fail silently.

## Architecture

```
React UI (renderer)  →  preload IPC  →  Electron main  →  @nut-tree-fork/nut-js
```

- `electron/main.ts` — window, capture, IPC, Discord bot
- `electron/saveRoot.ts` — dev vs packaged save paths
- `src/` — React UI, routine runner, detection utils

## Notes

- Focus MapleStory Worlds before manual key sends — input goes to the focused app.
- Keyboard control only works in the Electron app, not in a browser tab.
- Game automation may violate terms of service or trigger anti-cheat systems. Use at your own risk.
