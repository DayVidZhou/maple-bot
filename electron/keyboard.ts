import { keyboard, Key } from '@nut-tree-fork/nut-js'

const KEY_MAP: Record<string, Key> = {
  a: Key.A,
  b: Key.B,
  c: Key.C,
  d: Key.D,
  e: Key.E,
  f: Key.F,
  g: Key.G,
  h: Key.H,
  i: Key.I,
  j: Key.J,
  k: Key.K,
  l: Key.L,
  m: Key.M,
  n: Key.N,
  o: Key.O,
  p: Key.P,
  q: Key.Q,
  r: Key.R,
  s: Key.S,
  t: Key.T,
  u: Key.U,
  v: Key.V,
  w: Key.W,
  x: Key.X,
  y: Key.Y,
  z: Key.Z,
  '0': Key.Num0,
  '1': Key.Num1,
  '2': Key.Num2,
  '3': Key.Num3,
  '4': Key.Num4,
  '5': Key.Num5,
  '6': Key.Num6,
  '7': Key.Num7,
  '8': Key.Num8,
  '9': Key.Num9,
  space: Key.Space,
  enter: Key.Enter,
  escape: Key.Escape,
  esc: Key.Escape,
  tab: Key.Tab,
  backspace: Key.Backspace,
  delete: Key.Delete,
  insert: Key.Insert,
  home: Key.Home,
  end: Key.End,
  pageup: Key.PageUp,
  pagedown: Key.PageDown,
  up: Key.Up,
  down: Key.Down,
  left: Key.Left,
  right: Key.Right,
  shift: Key.LeftShift,
  ctrl: Key.LeftControl,
  control: Key.LeftControl,
  alt: Key.LeftAlt,
  meta: Key.LeftWin,
  f1: Key.F1,
  f2: Key.F2,
  f3: Key.F3,
  f4: Key.F4,
  f5: Key.F5,
  f6: Key.F6,
  f7: Key.F7,
  f8: Key.F8,
  f9: Key.F9,
  f10: Key.F10,
  f11: Key.F11,
  f12: Key.F12,
}

function resolveKey(key: string): Key {
  const normalized = key.trim().toLowerCase()
  const resolved = KEY_MAP[normalized]

  if (!resolved) {
    throw new Error(`Unsupported key: "${key}"`)
  }

  return resolved
}

export async function pressKey(key: string): Promise<void> {
  await keyboard.pressKey(resolveKey(key))
}

export async function releaseKey(key: string): Promise<void> {
  await keyboard.releaseKey(resolveKey(key))
}

export async function tapKey(key: string): Promise<void> {
  await pressKey(key)
  await releaseKey(key)
}

export async function typeText(text: string): Promise<void> {
  await keyboard.type(text)
}
