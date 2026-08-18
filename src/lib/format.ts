import type { EditPolicy } from '../data/types/entities'

export function editPolicyLabel(policy: EditPolicy): string {
  switch (policy) {
    case 'everyone':
      return 'Everyone can edit'
    case 'leads':
      return 'Leads can edit'
    case 'owner':
      return 'Only the owner can edit'
  }
}

/** Coarse "2h ago" / "3d ago" style label — enough resolution for presence
 * and freshness UI without pulling in a date-formatting dependency. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

/** Plain-text word/character counts for the status bar — strips the light
 * markdown syntax the block editor uses so `**bold**` doesn't inflate the
 * character count with punctuation nobody reads as content. */
export function countWordsAndChars(text: string): { words: number; chars: number } {
  const plain = text
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
    .replace(/[#*_>`-]/g, ' ')
    .trim()
  const words = plain.length === 0 ? 0 : plain.split(/\s+/).filter(Boolean).length
  return { words, chars: plain.length }
}
