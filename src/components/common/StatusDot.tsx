import type { Tone } from '../../lib/tones'

const TONE_BG: Record<Tone, string> = {
  green: 'bg-green',
  amber: 'bg-amber',
  red: 'bg-red',
  blue: 'bg-blue',
  gray: 'bg-gray-dot',
}

export function StatusDot({ tone, className = '' }: { tone: Tone; className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${TONE_BG[tone]} ${className}`} />
}
