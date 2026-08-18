import type { ReactNode } from 'react'

/** The one card chrome used everywhere — ported from the validated
 * Overview mockup: subtle border that lightens on hover rather than a
 * loud outline, soft shadow, generous internal padding. */
export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <As
      className={`rounded-xl border border-border bg-card p-[18px] shadow-card transition-colors duration-150 hover:border-border-hover ${className}`}
    >
      {children}
    </As>
  )
}
