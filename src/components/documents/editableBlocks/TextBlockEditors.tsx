import { X } from 'lucide-react'
import type { Block, CalloutVariant } from '../../../data/types/entities'
import { RichTextEditor } from '../../editor/RichTextEditor'
import { inputClass, selectClass } from '../../editor/fieldStyles'
import type { WikilinkItem } from '../../editor/wikilinkExtension'

type TextBlock = Extract<Block, { type: 'text' }>
type HeadingBlock = Extract<Block, { type: 'heading' }>
type ListBlock = Extract<Block, { type: 'list' }>
type CalloutBlock = Extract<Block, { type: 'callout' }>
type TableBlock = Extract<Block, { type: 'table' }>

interface RichProps {
  linkableItems: WikilinkItem[]
  onOpenLink: (id: string, kind: WikilinkItem['kind']) => void
}

export function TextBlockEditor({ block, onChange, linkableItems, onOpenLink }: { block: TextBlock; onChange: (b: Block) => void } & RichProps) {
  return (
    <RichTextEditor
      value={block.markdown}
      onChange={(markdown) => onChange({ type: 'text', markdown })}
      placeholder="Write something…"
      linkableItems={linkableItems}
      onOpenLink={onOpenLink}
    />
  )
}

export function HeadingBlockEditor({ block, onChange }: { block: HeadingBlock; onChange: (b: Block) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-shrink-0 rounded-md border border-border bg-inset p-0.5">
        {([2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange({ ...block, level })}
            className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
              block.level === level ? 'bg-card text-text1' : 'text-text3 hover:text-text2'
            }`}
          >
            H{level}
          </button>
        ))}
      </div>
      <input
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.target.value })}
        placeholder="Heading"
        className={`${inputClass} font-semibold`}
      />
    </div>
  )
}

export function ListBlockEditor({ block, onChange }: { block: ListBlock; onChange: (b: Block) => void }) {
  function updateItem(index: number, value: string) {
    const items = [...block.items]
    items[index] = value
    onChange({ ...block, items })
  }
  function removeItem(index: number) {
    onChange({ ...block, items: block.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex w-fit items-center gap-1.5 text-2xs text-text3">
        <input
          type="checkbox"
          checked={block.ordered}
          onChange={(event) => onChange({ ...block, ordered: event.target.checked })}
        />
        Numbered
      </label>
      {block.items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="w-4 flex-shrink-0 text-right font-mono text-2xs text-text3">
            {block.ordered ? `${index + 1}.` : '•'}
          </span>
          <input value={item} onChange={(event) => updateItem(index, event.target.value)} className={inputClass} />
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => removeItem(index)}
            className="flex-shrink-0 text-text3 transition-colors hover:text-red"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, ''] })}
        className="self-start text-2xs text-text3 transition-colors hover:text-text2"
      >
        + Add item
      </button>
    </div>
  )
}

const CALLOUT_VARIANTS: CalloutVariant[] = ['note', 'warning', 'decision', 'risk']

export function CalloutBlockEditor({ block, onChange, linkableItems, onOpenLink }: { block: CalloutBlock; onChange: (b: Block) => void } & RichProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-inset p-3">
      <div className="flex items-center gap-2">
        <select
          value={block.variant}
          onChange={(event) => onChange({ ...block, variant: event.target.value as CalloutVariant })}
          className={`${selectClass} capitalize`}
        >
          {CALLOUT_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {variant}
            </option>
          ))}
        </select>
        <input
          value={block.title}
          onChange={(event) => onChange({ ...block, title: event.target.value })}
          placeholder="Callout title"
          className={`${inputClass} font-medium`}
        />
      </div>
      <RichTextEditor
        value={block.body}
        onChange={(body) => onChange({ ...block, body })}
        placeholder="What should the reader take away?"
        linkableItems={linkableItems}
        onOpenLink={onOpenLink}
        allowHeadings={false}
      />
    </div>
  )
}

export function TableBlockEditor({ block, onChange }: { block: TableBlock; onChange: (b: Block) => void }) {
  function updateHeader(index: number, value: string) {
    const headers = [...block.headers]
    headers[index] = value
    onChange({ ...block, headers })
  }
  function updateCell(row: number, col: number, value: string) {
    const rows = block.rows.map((r) => [...r])
    rows[row][col] = value
    onChange({ ...block, rows })
  }
  function addColumn() {
    onChange({ ...block, headers: [...block.headers, `Column ${block.headers.length + 1}`], rows: block.rows.map((r) => [...r, '']) })
  }
  function removeColumn() {
    if (block.headers.length <= 1) return
    onChange({
      ...block,
      headers: block.headers.slice(0, -1),
      rows: block.rows.map((r) => r.slice(0, -1)),
    })
  }
  function addRow() {
    onChange({ ...block, rows: [...block.rows, block.headers.map(() => '')] })
  }
  function removeRow(index: number) {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm-plus">
          <thead>
            <tr className="border-b border-border bg-inset">
              {block.headers.map((header, index) => (
                <th key={index} className="border-r border-border p-1 last:border-r-0">
                  <input
                    value={header}
                    onChange={(event) => updateHeader(index, event.target.value)}
                    className="w-full bg-transparent px-1.5 py-1 text-2xs font-semibold uppercase tracking-wide text-text3 outline-none"
                  />
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} className="border-b border-border last:border-b-0">
                {row.map((cell, c) => (
                  <td key={c} className="border-r border-border p-1 align-top last:border-r-0">
                    {/* A plain `<input>` can't wrap — long prose (a system's
                     * summary, say) just gets clipped inside it with no
                     * visual sign there's more. A `<textarea>` wraps like
                     * real text and grows with it (`field-sizing: content`
                     * — supported in this app's Chromium target — sizes the
                     * box to its content instead of a fixed row count). */}
                    <textarea
                      value={cell}
                      onChange={(event) => updateCell(r, c, event.target.value)}
                      rows={1}
                      className="w-full min-w-0 resize-none overflow-hidden bg-transparent px-1.5 py-1 text-text2 outline-none [field-sizing:content]"
                    />
                  </td>
                ))}
                <td className="text-center align-top">
                  <button type="button" aria-label="Remove row" onClick={() => removeRow(r)} className="mt-1 text-text3 hover:text-red">
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 flex gap-3 text-2xs text-text3">
        <button type="button" onClick={addRow} className="hover:text-text2">
          + Row
        </button>
        <button type="button" onClick={addColumn} className="hover:text-text2">
          + Column
        </button>
        {block.headers.length > 1 && (
          <button type="button" onClick={removeColumn} className="hover:text-red">
            − Column
          </button>
        )}
      </div>
    </div>
  )
}
