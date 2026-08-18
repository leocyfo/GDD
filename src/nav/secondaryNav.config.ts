/**
 * Cross-cutting views, not numbered GDD sections — they have no backing
 * `Section` record to read a title/icon from, so (unlike the section nav
 * list) a small static config is legitimate here. Feature Cards, Decisions,
 * and Milestones are dedicated *interactive* screens (edit statuses, log a
 * decision, check off exit criteria) — distinct from the read-oriented
 * summaries a GDD section can still mention in prose.
 */
export interface SecondaryNavItem {
  key: 'changelog' | 'team' | 'features' | 'decisions' | 'milestones' | 'scopeMatrix' | 'loops' | 'assets'
  title: string
  icon: string
}

export const SECONDARY_NAV_ITEMS: SecondaryNavItem[] = [
  { key: 'features', title: 'Feature Cards', icon: 'LayoutGrid' },
  { key: 'loops', title: 'Gameplay Loops', icon: 'Repeat' },
  { key: 'scopeMatrix', title: 'Scope Matrix', icon: 'ListChecks' },
  { key: 'assets', title: 'Asset List', icon: 'Boxes' },
  { key: 'decisions', title: 'Decisions', icon: 'Scale' },
  { key: 'milestones', title: 'Milestones', icon: 'CalendarCheck' },
  { key: 'changelog', title: 'Changelog', icon: 'History' },
  { key: 'team', title: 'Team', icon: 'Users' },
]
