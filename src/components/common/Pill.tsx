import type { ReactNode } from 'react'
import type { Tone } from '../../lib/tones'

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green',
  amber: 'text-amber',
  red: 'text-red',
  blue: 'text-blue',
  gray: 'text-text3',
}

export function Pill({ children, tone, className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-inset px-2.5 py-1 text-2xs text-text2 ${tone ? TONE_TEXT[tone] : ''} ${className}`}
    >
      {children}
    </span>
  )
}
