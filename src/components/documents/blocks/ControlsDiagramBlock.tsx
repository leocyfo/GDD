import { useState } from 'react'
import { KEYBOARD_ROWS, labelFor, type KeyboardLayout } from '../../../lib/azertyKeyboard'
import type { Block, ControlsDiagramEntry } from '../../../data/types/entities'

type ControlsDiagramBlock = Extract<Block, { type: 'controlsDiagram' }>

interface CalloutColor {
  border: string
  bg: string
  dot: string
}

/** One distinct hue per callout group, cycling if there are more groups
 * than colors — reuses the app's existing semantic color tokens (no new
 * hex anywhere) so it stays in sync with the rest of the app's palette.
 * `accent` is deliberately left out: it's the app's own gold UI-highlight
 * color, close enough to `amber` to be hard to tell apart at swatch size,
 * and already means "focused/interactive" everywhere else in the app. */
const CALLOUT_PALETTE: CalloutColor[] = [
  { border: 'border-green', bg: 'bg-green/25', dot: 'bg-green' },
  { border: 'border-blue', bg: 'bg-blue/25', dot: 'bg-blue' },
  { border: 'border-amber', bg: 'bg-amber/25', dot: 'bg-amber' },
  { border: 'border-red', bg: 'bg-red/25', dot: 'bg-red' },
  { border: 'border-gray-dot', bg: 'bg-gray-dot/25', dot: 'bg-gray-dot' },
]

/** Maps each distinct callout id to a stable color — stable meaning it
 * depends only on the *sorted order the ids appear in*, not on the ids'
 * literal values, so inserting/removing a row never reshuffles colors that
 * are already correct elsewhere. Shared by the keyboard and the table so
 * a key's tint and its legend row always agree without passing a number
 * between them. */
export function buildCalloutColorMap(entries: ControlsDiagramEntry[]): Map<number, CalloutColor> {
  const uniqueIds = Array.from(new Set(entries.map((e) => e.id))).sort((a, b) => a - b)
  const map = new Map<number, CalloutColor>()
  uniqueIds.forEach((id, index) => map.set(id, CALLOUT_PALETTE[index % CALLOUT_PALETTE.length]))
  return map
}

/** Just the annotated keyboard image — shared by the read-only view and the
 * editor, which each pair it with their own table (read-only text vs.
 * editable cells) rather than duplicating the keyboard markup.
 *
 * Every physical key that belongs to a callout gets tinted in that
 * callout's color, no number involved — the legend table below is the one
 * place a group's identity is spelled out (its action/state text), so the
 * keyboard only needs to answer "which keys, in which color" and the
 * table only needs to answer "what does that color mean".
 *
 * The AZERTY/QWERTY toggle works uncontrolled (its own state) when
 * `layout`/`onLayoutChange` aren't passed — the read-only view uses it
 * that way. The editor controls it instead, because it needs the current
 * layout itself to turn clicked keys back into a label (see
 * `ControlsDiagramBlockEditor`'s `toggleCodeForEntry`). `onToggleCode`
 * being present is what makes the keyboard clickable at all — the
 * read-only view never passes it, so its keys stay inert. */
export function ControlsKeyboardDiagram({
  entries,
  layout: controlledLayout,
  onLayoutChange,
  activeEntryId,
  onToggleCode,
}: {
  entries: ControlsDiagramEntry[]
  layout?: KeyboardLayout
  onLayoutChange?: (layout: KeyboardLayout) => void
  activeEntryId?: number
  onToggleCode?: (code: string) => void
}) {
  const [uncontrolledLayout, setUncontrolledLayout] = useState<KeyboardLayout>('qwerty')
  const layout = controlledLayout ?? uncontrolledLayout
  const setLayout = onLayoutChange ?? setUncontrolledLayout

  const colorByCalloutId = buildCalloutColorMap(entries)
  const calloutIdByCode = new Map<string, number>()
  for (const entry of entries) {
    for (const code of entry.codes) {
      if (!calloutIdByCode.has(code)) calloutIdByCode.set(code, entry.id)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-inset p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {onToggleCode ? (
          <p className="text-2xs text-text3">Click keys to add or remove them from the selected row.</p>
        ) : (
          <span />
        )}
        <div className="flex flex-shrink-0 rounded-md border border-border bg-card p-0.5 text-2xs">
          {(['azerty', 'qwerty'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLayout(option)}
              className={`rounded px-2 py-1 font-medium uppercase tracking-wide transition-colors ${
                layout === option ? 'bg-accent text-accent-fg' : 'text-text3 hover:text-text2'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full flex-col gap-1.5">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1.5">
              {row.map((item, itemIndex) => {
                if ('spacer' in item) {
                  return <div key={itemIndex} className="invisible" style={{ flexGrow: item.wide, minWidth: 4 }} />
                }
                const calloutId = calloutIdByCode.get(item.code)
                const color = calloutId !== undefined ? colorByCalloutId.get(calloutId) : undefined
                const label = labelFor(item, layout)
                const isActiveGroup = activeEntryId !== undefined && calloutId === activeEntryId
                return (
                  <button
                    key={itemIndex}
                    type="button"
                    data-code={item.code}
                    title={item.code}
                    disabled={!onToggleCode}
                    onClick={onToggleCode ? () => onToggleCode(item.code) : undefined}
                    className={`relative flex h-8 flex-shrink-0 items-end justify-end rounded border px-1.5 py-1 font-medium text-text1 transition-colors ${
                      item.small ? 'items-center justify-center text-center text-[10px]' : 'text-2xs'
                    } ${color ? `${color.border} ${color.bg}` : 'border-border bg-card'} ${
                      onToggleCode ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
                    } ${isActiveGroup ? 'ring-2 ring-accent ring-offset-1 ring-offset-inset' : ''}`}
                    style={{ flexGrow: item.wide ?? 1, minWidth: 26 }}
                  >
                    {label.shift && <span className="absolute left-1 top-0.5 text-[9px] text-text3">{label.shift}</span>}
                    <span>{label.primary}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ControlsDiagramBlockView({ block }: { block: ControlsDiagramBlock }) {
  const colorByCalloutId = buildCalloutColorMap(block.entries)

  return (
    <div className="flex flex-col gap-3">
      <ControlsKeyboardDiagram entries={block.entries} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm-plus">
          <thead>
            <tr className="border-b border-border bg-inset">
              <th className="w-9 px-3 py-2">
                <span className="sr-only">Color</span>
              </th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Key(s)</th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Action</th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Game state</th>
            </tr>
          </thead>
          <tbody>
            {block.entries.map((entry, index) => (
              <tr key={index} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${colorByCalloutId.get(entry.id)?.dot ?? 'bg-text3'}`} />
                </td>
                <td className="px-3 py-2 text-text1">{entry.keys}</td>
                <td className="px-3 py-2 text-text2">{entry.action}</td>
                <td className="px-3 py-2 text-text2">{entry.gameState}</td>
              </tr>
            ))}
            {block.entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-text3">
                  No controls yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
