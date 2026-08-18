import type { SectionKey } from './types/entities'

/**
 * The GDD's fixed 1..10 section structure — same idea as `vaultFolders.ts`:
 * structural app configuration, not demo content. Every project (seeded or
 * newly created) gets exactly these 10 sections; the seed's demo data and
 * `newProject.ts`'s real creation flow both read from here so the two can
 * never drift apart.
 *
 * Two deliberate departures from the original 11-section spec, both from
 * an app-wide navigation cleanup: "Gameplay Mechanics" and "Systems" were
 * two sections answering the same question ("how does the game play?")
 * and reading as near-duplicates in the sidebar, so they're merged into
 * one; and what was "Milestones" is now "Roadmap" — it was a section
 * carrying the exact same name as the dedicated Milestones *screen*
 * (Feature Cards / Decisions / Milestones / Scope Matrix) while showing
 * completely different content (a one-line summary vs. the real,
 * structured exit-criteria data), which read as a bug even though it
 * wasn't one. The section now carries the narrative "why this timeline"
 * context; the screen stays the structured source of truth.
 */
export interface SectionDefinition {
  key: SectionKey
  index: number
  title: string
  icon: string
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { key: 'core-concept', index: 1, title: 'Core Concept', icon: 'Lightbulb' },
  { key: 'gameplay', index: 2, title: 'Gameplay & Systems', icon: 'Gamepad2' },
  { key: 'story', index: 3, title: 'Story', icon: 'BookOpen' },
  { key: 'art', index: 4, title: 'Art Direction', icon: 'Palette' },
  { key: 'constraints', index: 5, title: 'Constraints', icon: 'SlidersHorizontal' },
  { key: 'level', index: 6, title: 'Level / World Design', icon: 'Map' },
  { key: 'ui-ux', index: 7, title: 'UI / UX', icon: 'LayoutPanelLeft' },
  { key: 'audio', index: 8, title: 'Audio', icon: 'AudioLines' },
  { key: 'milestones', index: 9, title: 'Roadmap', icon: 'Flag' },
  { key: 'appendix', index: 10, title: 'Appendix', icon: 'Paperclip' },
]
