import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Block } from '../../../data/types/entities'
import { BLOCK_TYPE_META } from './blockDefaults'

/** The `/`-menu the spec calls for, as an explicit button + popover rather
 * than intercepting a `/` keystroke mid-paragraph — same outcome (pick any
 * block type, insert it here), far less machinery. */
export function AddBlockMenu({ onInsert, label = 'Add block' }: { onInsert: (block: Block) => void; label?: string }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs-plus text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={12} />
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-card"
        >
          {BLOCK_TYPE_META.map((meta) => (
            <button
              key={meta.type}
              type="button"
              role="menuitem"
              onClick={() => {
                onInsert(meta.create())
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm-plus text-text2 transition-colors hover:bg-inset hover:text-text1"
            >
              <meta.icon size={14} className="flex-shrink-0 text-text3" />
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
