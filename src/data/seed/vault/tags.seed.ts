import type { LogicNote, Tag } from '../../types/entities'
import { SEED_UPDATED_BY } from '../constants'
import { daysBeforeAnchor } from '../dates'
import { mkId } from '../ids'

// Colors are pulled from the same fixed palette the rest of the app uses
// (see `src/styles/tokens.css`) — tags never introduce a new hex value.
const RAW_ACCENT = '#D4A855'
const RAW_GREEN = '#4ADE80'
const RAW_AMBER = '#F5A524'
const RAW_BLUE = '#3B82F6'
const RAW_GRAY = '#4B5563'
const RAW_RED = '#E5484D'

function colorForTag(path: string): string {
  if (path.startsWith('type/')) return RAW_ACCENT
  if (path === 'status/implemented' || path === 'status/verified') return RAW_GREEN
  if (path === 'status/wip') return RAW_AMBER
  if (path === 'status/needs-review') return RAW_BLUE
  if (path === 'status/deprecated') return RAW_GRAY
  if (path === 'status/diverged') return RAW_RED
  if (path.startsWith('system/')) return RAW_BLUE
  return RAW_GRAY
}

/** Tag rows, one per distinct path actually used across the seeded notes —
 * `count` is tallied from real usage, never hardcoded, so it can't drift. */
export function buildTags(notes: LogicNote[]): Tag[] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const path of note.tags) {
      counts.set(path, (counts.get(path) ?? 0) + 1)
    }
  }

  const createdAt = daysBeforeAnchor(210)
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, count]) => ({
      id: mkId('tag', path.replace('/', '-')),
      path,
      color: colorForTag(path),
      count,
      createdAt,
      updatedAt: daysBeforeAnchor(1),
      updatedBy: SEED_UPDATED_BY,
    }))
}
