const NAMED_KEYS: Record<string, string> = {
  ' ': 'space',
  Control: 'ctrl',
  Alt: 'alt',
  Shift: 'shift',
  Meta: 'meta',
  Escape: 'escape',
  Tab: 'tab',
  Enter: 'enter',
  Backspace: 'backspace',
  Delete: 'delete',
  Insert: 'insert',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export function formatKeyPress(event: KeyboardEvent): string | null {
  if (event.repeat) return null

  const { key } = event

  if (key in NAMED_KEYS) return NAMED_KEYS[key]
  if (/^F\d+$/.test(key)) return key.toLowerCase()
  if (key.length === 1) return key.toLowerCase()

  return null
}

export function formatButtonKeyLabel(buttonKey: string): string {
  return buttonKey.trim()
}
