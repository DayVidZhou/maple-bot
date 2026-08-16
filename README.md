# maple-bot

Electron desktop app for automating MapleStory routines using screen capture and keyboard control.

## Features

- **Screen mirror** — captures and displays your screen
- **Top-left focus region** — adjustable crop for image detection / automation
- **Keyboard control** — sends key presses to other desktop apps via the Electron main process

## Getting started

```bash
npm install
npm run dev
```

This launches the Electron app with hot reload. Use **Start Screen Capture** to pick a window or monitor, then use **Keyboard Control** to send keys to the focused application.

## Architecture

```
React UI (renderer)  →  preload IPC  →  Electron main  →  @nut-tree-fork/nut-js
```

- `electron/main.ts` — window setup, screen capture permissions, IPC handlers
- `electron/preload.ts` — exposes `window.electronAPI` to the renderer
- `electron/keyboard.ts` — key press simulation
- `src/` — React UI (unchanged structure)



## Building

```bash
npm run build
```

Production output goes to `dist/` (renderer) and `dist-electron/` (main/preload). Run with Electron pointing at the built files.

## Notes

- Focus the target game window before sending keys — input goes to whichever app has focus.
- Keyboard control only works when running inside Electron, not in a regular browser tab.
- Automating games may violate terms of service or trigger anti-cheat systems.

