import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { Block, ControlsDiagramEntry } from '../../../data/types/entities'
import { codeForLabel, keySpecFor, labelFor, type KeyboardLayout } from '../../../lib/azertyKeyboard'
import { buildCalloutColorMap, ControlsKeyboardDiagram } from '../blocks/ControlsDiagramBlock'

type ControlsDiagramBlock = Extract<Block, { type: 'controlsDiagram' }>

/** Looks like plain table text at rest — border and background only show
 * up on hover/focus — so one table can read exactly like the block's
 * read-only view (`ControlsDiagramBlockView`) while still being the real
 * editable thing, instead of stacking a clean display table on top of a
 * separate, bulkier input table underneath it. */
const cellInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-text1 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-card'

/** Turns a set of codes back into the label shown in the "Key(s)" column —
 * e.g. `['KeyW','KeyA','KeyS','KeyD']` → `"Z, Q, S, D"` on AZERTY. */
function labelForCodes(codes: string[], layout: KeyboardLayout): string {
  return codes
    .map((code) => {
      const spec = keySpecFor(code)
      return spec ? labelFor(spec, layout).primary || code : code
    })
    .join(', ')
}

/** The other direction: typed text → codes, resolving each comma-separated
 * piece against what's printed on the keyboard in the current layout.
 * Tokens that don't match anything (like "Left click") are just dropped
 * from the *codes* — they stay in the typed text as-is, they just don't
 * light anything up, which is correct for a mouse-only row. This is what
 * keeps typing and clicking as two paths to the same state instead of two
 * competing ones: whichever you do, `codes` gets recomputed from the
 * current `keys` text, never held onto independently. */
function codesForTypedKeys(text: string, layout: KeyboardLayout): string[] {
  return text
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => codeForLabel(token, layout))
    .filter((code): code is string => code !== undefined)
}

export function ControlsDiagramBlockEditor({ block, onChange }: { block: ControlsDiagramBlock; onChange: (b: Block) => void }) {
  const [layout, setLayout] = useState<KeyboardLayout>('qwerty')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  function updateEntry(index: number, patch: Partial<ControlsDiagramEntry>) {
    const entries = block.entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    onChange({ ...block, entries })
  }
  function removeEntry(index: number) {
    onChange({ ...block, entries: block.entries.filter((_, i) => i !== index) })
    if (activeIndex === index) setActiveIndex(null)
  }
  function addEntry() {
    const nextId = block.entries.length > 0 ? Math.max(...block.entries.map((e) => e.id)) + 1 : 1
    onChange({ ...block, entries: [...block.entries, { id: nextId, keys: '', codes: [], action: '', gameState: '' }] })
    setActiveIndex(block.entries.length)
  }
  function toggleCodeForEntry(index: number, code: string) {
    const entry = block.entries[index]
    const codes = entry.codes.includes(code) ? entry.codes.filter((c) => c !== code) : [...entry.codes, code]
    updateEntry(index, { codes, keys: labelForCodes(codes, layout) })
  }
  function editKeysText(index: number, text: string) {
    updateEntry(index, { keys: text, codes: codesForTypedKeys(text, layout) })
  }

  const colorByCalloutId = buildCalloutColorMap(block.entries)
  const activeEntry = activeIndex !== null ? block.entries[activeIndex] : undefined

  return (
    <div className="flex flex-col gap-2">
      <ControlsKeyboardDiagram
        entries={block.entries}
        layout={layout}
        onLayoutChange={setLayout}
        activeEntryId={activeEntry?.id}
        onToggleCode={activeIndex !== null ? (code) => toggleCodeForEntry(activeIndex, code) : undefined}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[680px] border-collapse text-sm-plus">
          <thead>
            <tr className="border-b border-border bg-inset">
              <th className="w-9 px-3 py-2">
                <span className="sr-only">Color / pick keys</span>
              </th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Key(s)</th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Action</th>
              <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Game state</th>
              <th className="w-8 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {block.entries.map((entry, index) => {
              const isActive = activeIndex === index
              return (
                <tr key={index} className={`border-b border-border last:border-b-0 transition-colors ${isActive ? 'bg-inset' : ''}`}>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(isActive ? null : index)}
                      title="Click, then click keys on the keyboard above to add or remove them from this row"
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                        isActive ? 'border-accent ring-2 ring-accent/40' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${colorByCalloutId.get(entry.id)?.dot ?? 'bg-text3'}`} />
                    </button>
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={entry.keys}
                      onChange={(event) => editKeysText(index, event.target.value)}
                      placeholder="Type a key name (e.g. R), or click one above"
                      title="Type a key's printed name to highlight it too — comma-separate several. Names that don't match any key (e.g. 'Left click') just stay as plain text."
                      className={cellInputClass}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={entry.action}
                      onChange={(event) => updateEntry(index, { action: event.target.value })}
                      placeholder="Action"
                      className={cellInputClass}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={entry.gameState}
                      onChange={(event) => updateEntry(index, { gameState: event.target.value })}
                      placeholder="Game state"
                      className={cellInputClass}
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button type="button" aria-label="Remove control" onClick={() => removeEntry(index)} className="text-text3 hover:text-red">
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {block.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-sm text-text3">
                  No controls yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addEntry} className="flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2">
        <Plus size={11} />
        Add control
      </button>
    </div>
  )
}
