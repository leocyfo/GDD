/** Physical AZERTY (France) keyboard layout data, main alphanumeric block
 * only — function row, number row, the three letter rows, and the bottom
 * modifier/space row. The nav cluster and numpad are deliberately left out:
 * this feeds an embeddable GDD block (`controlsDiagram`), not a full
 * keyboard tester, and gameplay controls essentially never live there.
 *
 * Every key is identified by its `code` — physical position
 * (`KeyboardEvent.code`), not the printed character — so a controls
 * diagram entry can say "the WASD cluster" once via `codes` and it resolves
 * to the right physical keys (labeled Z/Q/S/D here) regardless of layout. */

export interface KeySpec {
  code: string
  primary: string
  shift?: string
  wide?: number
  small?: boolean
}

export interface SpacerSpec {
  spacer: true
  wide: number
}

export type RowItem = KeySpec | SpacerSpec

function key(code: string, primary: string, opts: Partial<Pick<KeySpec, 'shift' | 'wide' | 'small'>> = {}): KeySpec {
  return { code, primary, ...opts }
}
function spacer(wide: number): SpacerSpec {
  return { spacer: true, wide }
}

export const KEYBOARD_ROWS: RowItem[][] = [
  [
    key('Escape', 'Esc', { small: true, wide: 1.25 }),
    spacer(0.6),
    key('F1', 'F1', { small: true }),
    key('F2', 'F2', { small: true }),
    key('F3', 'F3', { small: true }),
    key('F4', 'F4', { small: true }),
    spacer(0.6),
    key('F5', 'F5', { small: true }),
    key('F6', 'F6', { small: true }),
    key('F7', 'F7', { small: true }),
    key('F8', 'F8', { small: true }),
  ],
  [
    key('Backquote', '²'),
    key('Digit1', '&', { shift: '1' }),
    key('Digit2', 'é', { shift: '2' }),
    key('Digit3', '"', { shift: '3' }),
    key('Digit4', "'", { shift: '4' }),
    key('Digit5', '(', { shift: '5' }),
    key('Digit6', '-', { shift: '6' }),
    key('Digit7', 'è', { shift: '7' }),
    key('Digit8', '_', { shift: '8' }),
    key('Digit9', 'ç', { shift: '9' }),
    key('Digit0', 'à', { shift: '0' }),
    key('Backspace', 'Retour', { small: true, wide: 1.75 }),
  ],
  [
    key('Tab', 'Tab', { small: true, wide: 1.4 }),
    key('KeyQ', 'A'),
    key('KeyW', 'Z'),
    key('KeyE', 'E'),
    key('KeyR', 'R'),
    key('KeyT', 'T'),
    key('KeyY', 'Y'),
    key('KeyU', 'U'),
    key('KeyI', 'I'),
    key('KeyO', 'O'),
    key('KeyP', 'P'),
  ],
  [
    key('CapsLock', 'Verr Maj', { small: true, wide: 1.6 }),
    key('KeyA', 'Q'),
    key('KeyS', 'S'),
    key('KeyD', 'D'),
    key('KeyF', 'F'),
    key('KeyG', 'G'),
    key('KeyH', 'H'),
    key('KeyJ', 'J'),
    key('KeyK', 'K'),
    key('KeyL', 'L'),
    key('Enter', 'Entrée', { small: true, wide: 1.4 }),
  ],
  [
    key('ShiftLeft', 'Maj', { small: true, wide: 1.9 }),
    key('KeyZ', 'W'),
    key('KeyX', 'X'),
    key('KeyC', 'C'),
    key('KeyV', 'V'),
    key('KeyB', 'B'),
    key('KeyN', 'N'),
    key('Comma', ',', { shift: '?' }),
    key('Period', ';', { shift: '.' }),
    key('ShiftRight', 'Maj', { small: true, wide: 1.9 }),
  ],
  [
    key('ControlLeft', 'Ctrl', { small: true, wide: 1.3 }),
    key('AltLeft', 'Alt', { small: true, wide: 1.1 }),
    key('Space', '', { wide: 5.5 }),
    key('AltRight', 'AltGr', { small: true, wide: 1.1 }),
    key('ControlRight', 'Ctrl', { small: true, wide: 1.3 }),
  ],
]

export type KeyboardLayout = 'azerty' | 'qwerty'

/** `KEYBOARD_ROWS` above carries the physical *shape* (which code sits
 * where, how wide) — the same shape works for any layout, since a key's
 * position doesn't move, only what's printed on it does. QWERTY overrides
 * just the label per `code`; anything not listed here (function keys,
 * Tab/Ctrl/Alt/Enter/Shift, Space) prints the same on both layouts. */
export const QWERTY_LABELS: Record<string, { primary: string; shift?: string }> = {
  Backquote: { primary: '`', shift: '~' },
  Digit1: { primary: '1', shift: '!' },
  Digit2: { primary: '2', shift: '@' },
  Digit3: { primary: '3', shift: '#' },
  Digit4: { primary: '4', shift: '$' },
  Digit5: { primary: '5', shift: '%' },
  Digit6: { primary: '6', shift: '^' },
  Digit7: { primary: '7', shift: '&' },
  Digit8: { primary: '8', shift: '*' },
  Digit9: { primary: '9', shift: '(' },
  Digit0: { primary: '0', shift: ')' },
  Backspace: { primary: 'Backspace' },
  KeyQ: { primary: 'Q' },
  KeyW: { primary: 'W' },
  KeyE: { primary: 'E' },
  KeyR: { primary: 'R' },
  KeyT: { primary: 'T' },
  KeyY: { primary: 'Y' },
  KeyU: { primary: 'U' },
  KeyI: { primary: 'I' },
  KeyO: { primary: 'O' },
  KeyP: { primary: 'P' },
  CapsLock: { primary: 'Caps' },
  KeyA: { primary: 'A' },
  KeyS: { primary: 'S' },
  KeyD: { primary: 'D' },
  KeyF: { primary: 'F' },
  KeyG: { primary: 'G' },
  KeyH: { primary: 'H' },
  KeyJ: { primary: 'J' },
  KeyK: { primary: 'K' },
  KeyL: { primary: 'L' },
  Enter: { primary: 'Enter' },
  ShiftLeft: { primary: 'Shift' },
  KeyZ: { primary: 'Z' },
  KeyX: { primary: 'X' },
  KeyC: { primary: 'C' },
  KeyV: { primary: 'V' },
  KeyB: { primary: 'B' },
  KeyN: { primary: 'N' },
  Comma: { primary: ',', shift: '<' },
  Period: { primary: '.', shift: '>' },
  ShiftRight: { primary: 'Shift' },
  AltRight: { primary: 'Alt' },
}

/** Resolves a key's printed label for the given layout — the AZERTY
 * label baked into `KEYBOARD_ROWS` is the default; QWERTY only needs to
 * override what actually differs. */
export function labelFor(item: KeySpec, layout: KeyboardLayout): { primary: string; shift?: string } {
  if (layout === 'azerty') return { primary: item.primary, shift: item.shift }
  return QWERTY_LABELS[item.code] ?? { primary: item.primary, shift: item.shift }
}

const KEY_SPEC_BY_CODE = new Map<string, KeySpec>(
  KEYBOARD_ROWS.flat()
    .filter((item): item is KeySpec => !('spacer' in item))
    .map((item) => [item.code, item]),
)

/** Looks up a key's spec by its `code` — used to turn a picked set of
 * codes back into a human-readable label (see the controls diagram
 * editor's click-to-pick flow), without every caller re-flattening
 * `KEYBOARD_ROWS` itself. */
export function keySpecFor(code: string): KeySpec | undefined {
  return KEY_SPEC_BY_CODE.get(code)
}

/** The reverse of `labelFor` — given what's printed on a key in the
 * current layout (case-insensitive), finds which physical key that is.
 * This is what lets the controls diagram editor's "Key(s)" field stay
 * typeable *and* connected to the keyboard: typing "R" resolves to
 * `KeyR` and the diagram highlights it, same as clicking R directly
 * would — typing and clicking are just two paths to the same codes. */
export function codeForLabel(label: string, layout: KeyboardLayout): string | undefined {
  const target = label.trim().toLowerCase()
  if (!target) return undefined
  for (const row of KEYBOARD_ROWS) {
    for (const item of row) {
      if ('spacer' in item) continue
      if (labelFor(item, layout).primary.toLowerCase() === target) return item.code
    }
  }
  return undefined
}
