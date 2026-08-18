import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Tone } from '../../../lib/tones'

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green',
  amber: 'text-amber',
  red: 'text-red',
  blue: 'text-blue',
  gray: 'text-text3',
}

/**
 * The vault's deliberate aesthetic risk: every note field is its own
 * bracketed panel with a label tag straddling the top edge — like a
 * schematic callout, not a form row. It's built to look like the field is
 * *labeled equipment*, reinforcing that this is inspectable machinery
 * (variables, edge cases, links), not prose. Each panel folds
 * independently, per spec.
 */
export function FieldBlock({
  label,
  icon: Icon,
  tone = 'gray',
  defaultOpen = true,
  count,
  children,
}: {
  label: string
  icon: LucideIcon
  tone?: Tone
  defaultOpen?: boolean
  count?: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="relative rounded-lg border border-border bg-inset">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`absolute -top-2.5 left-3 flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wide transition-colors ${TONE_TEXT[tone]}`}
      >
        <Icon size={11} />
        {label}
        {typeof count === 'number' && <span className="text-text3">({count})</span>}
        <ChevronDown size={11} className={`text-text3 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 pb-3.5 pt-5">{children}</div>}
    </div>
  )
}
