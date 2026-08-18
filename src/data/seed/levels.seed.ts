import type { Level } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { mkId } from './ids'

/**
 * Stormline is one map, not discrete levels — so this catalog holds named
 * POIs/drop zones rather than "Level 1, Level 2…". The `Level` entity
 * itself stays generic (works for either genre); only the seeded content
 * here is battle-royale-flavored. Names match the annotated map pins
 * already seeded on the Level / World Design section (`sections.seed.ts`
 * — Refinery, Harbor Docks, Signal Tower) plus two more zones the map has
 * but the callout diagram doesn't individually pin.
 */
export function buildLevels(): Level[] {
  const base = { projectId: PROJECT_ID, updatedBy: SEED_UPDATED_BY, createdAt: daysBeforeAnchor(80) }

  const levels: Level[] = [
    {
      ...base,
      id: mkId('level', 'refinery'),
      name: 'Refinery',
      summary: 'Dropzone Island’s central POI — a multi-level industrial complex most rotations funnel through.',
      uniqueFeatures: 'Tallest natural structures on the map; the go-to spot for build-fight practice and contested drops.',
      assetId: null,
      status: 'done',
      order: 1,
      updatedAt: daysBeforeAnchor(20),
    },
    {
      ...base,
      id: mkId('level', 'harbor-docks'),
      name: 'Harbor Docks',
      summary: 'Coastal POI on the island’s edge — shipping containers stacked for vertical building fights.',
      uniqueFeatures: 'Crane-mounted zipline across the whole POI; container stacks reward edit-under-fire builders.',
      assetId: null,
      status: 'art-pass',
      order: 2,
      updatedAt: daysBeforeAnchor(14),
    },
    {
      ...base,
      id: mkId('level', 'signal-tower'),
      name: 'Signal Tower',
      summary: 'The map’s high-ground POI — a switchback trail up a single broadcast tower.',
      uniqueFeatures: 'Only POI with a natural high-ground choke; storm rotations through here are contested almost every match.',
      assetId: null,
      status: 'blockout',
      order: 3,
      updatedAt: daysBeforeAnchor(9),
    },
    {
      ...base,
      id: mkId('level', 'ashen-quarry'),
      name: 'Ashen Quarry',
      summary: 'Open-pit quarry on the map edge — long sightlines, scarce cover.',
      uniqueFeatures: 'Best material-harvesting POI on the map (exposed rock face); favors ranged squads over aggressive pushes.',
      assetId: null,
      status: 'blockout',
      order: 4,
      updatedAt: daysBeforeAnchor(9),
    },
    {
      ...base,
      id: mkId('level', 'reservoir-town'),
      name: 'Reservoir Town',
      summary: 'Flooded suburb bordering the map’s central lake — waist-deep water slows movement.',
      uniqueFeatures: 'Water tiles disable sprint-cancel tech; the one POI where Mantle & Slide movement tech is deliberately weaker.',
      assetId: null,
      status: 'concept',
      order: 5,
      updatedAt: daysBeforeAnchor(4),
    },
  ]

  return levels
}
