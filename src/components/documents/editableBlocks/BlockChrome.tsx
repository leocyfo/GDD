import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { BlockType } from '../../../data/types/entities'
import { blockTypeMeta } from './blockDefaults'

export function BlockChrome({
  type,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: {
  type: BlockType
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  children: ReactNode
}) {
  const meta = blockTypeMeta(type)

  return (
    <div className={`group/block relative mx-auto w-full rounded-lg ${meta.wide ? '' : 'max-w-3xl'}`}>
      <div className="pointer-events-none absolute -top-3 right-1 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:pointer-events-auto group-hover/block:opacity-100">
        <span className="mr-1 flex items-center gap-1 rounded border border-border bg-card px-1.5 py-0.5 text-2xs text-text3">
          <meta.icon size={10} />
          {meta.label}
        </span>
        <button
          type="button"
          aria-label="Move block up"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-text3 transition-colors hover:text-text1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          aria-label="Move block down"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-text3 transition-colors hover:text-text1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronDown size={12} />
        </button>
        <button
          type="button"
          aria-label="Delete block"
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-text3 transition-colors hover:border-red hover:text-red"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {children}
    </div>
  )
}
