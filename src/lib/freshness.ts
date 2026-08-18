import type { Freshness } from '../data/types/entities'

const FRESH_WITHIN_DAYS = 14
const AGING_WITHIN_DAYS = 45

/** Same rule used at seed time and whenever a section is next edited —
 * freshness is always derived from `updatedAt`, never set by hand, so it
 * can't silently drift from what it's supposed to represent. */
export function computeFreshness(updatedAt: string, now: Date = new Date()): Freshness {
  const days = (now.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= FRESH_WITHIN_DAYS) return 'fresh'
  if (days <= AGING_WITHIN_DAYS) return 'aging'
  return 'stale'
}
