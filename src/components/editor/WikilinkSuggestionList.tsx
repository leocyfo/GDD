import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { WikilinkItem } from './wikilinkExtension'

export interface WikilinkSuggestionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

/** The `[[` popup — a plain fixed-position list, positioned by
 * `Suggestion`'s built-in Floating UI mount (see `wikilinkExtension.ts`),
 * not a bespoke positioning implementation. */
export const WikilinkSuggestionList = forwardRef<WikilinkSuggestionListRef, SuggestionProps<WikilinkItem>>(
  function WikilinkSuggestionList({ items, command }, ref) {
    const [selected, setSelected] = useState(0)

    useEffect(() => setSelected(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false
        if (event.key === 'ArrowDown') {
          setSelected((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'ArrowUp') {
          setSelected((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          command(items[selected])
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-lg border border-border bg-card p-2 text-xs-plus text-text3 shadow-card">
          No matching notes or sections.
        </div>
      )
    }

    return (
      <div className="w-72 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-card">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              command(item)
            }}
            onMouseEnter={() => setSelected(index)}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm-plus transition-colors ${
              index === selected ? 'bg-inset text-text1' : 'text-text2'
            }`}
          >
            <span className="min-w-0 truncate font-mono">{item.label}</span>
            <span className="flex-shrink-0 text-2xs uppercase tracking-wide text-text3">{item.kind}</span>
          </button>
        ))}
      </div>
    )
  },
)
