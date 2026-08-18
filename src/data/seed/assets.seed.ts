import type { Asset } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { mkId } from './ids'

/**
 * Phase 1 doesn't render images yet (the gallery/palette blocks that
 * consume these are Phase 2), so these point at placeholder paths under
 * `public/seed-assets/` rather than real binaries. The records themselves
 * are real and complete so `image`/`gallery` blocks in the seeded sections
 * have something concrete to reference.
 */
export const ASSET_IDS = {
  silhouetteOperator: mkId('asset', 'concept-silhouette-operator'),
  silhouetteBuilderPose: mkId('asset', 'concept-silhouette-builder-pose'),
  environmentStormFront: mkId('asset', 'concept-environment-storm-front'),
  levelMapDropzone: mkId('asset', 'level-map-dropzone-island'),
  hudWireframe: mkId('asset', 'hud-wireframe'),
  keyArtTeaser: mkId('asset', 'key-art-teaser'),
  referenceTrackCombat: mkId('asset', 'reference-track-combat'),
} as const

export function buildAssets(): Asset[] {
  const base = { projectId: PROJECT_ID, updatedBy: SEED_UPDATED_BY, createdAt: daysBeforeAnchor(90) }

  const assets: Asset[] = [
    {
      ...base,
      id: ASSET_IDS.silhouetteOperator,
      kind: 'image',
      url: '/seed-assets/concept-silhouette-operator.svg',
      caption: 'Operator silhouette study — default loadout read',
      tags: ['art/silhouette', 'character/operator'],
      updatedAt: daysBeforeAnchor(70),
    },
    {
      ...base,
      id: ASSET_IDS.silhouetteBuilderPose,
      kind: 'image',
      url: '/seed-assets/concept-silhouette-builder-pose.svg',
      caption: 'Operator silhouette study — mid-build pose, wall + pickaxe',
      tags: ['art/silhouette', 'character/operator'],
      updatedAt: daysBeforeAnchor(70),
    },
    {
      ...base,
      id: ASSET_IDS.environmentStormFront,
      kind: 'image',
      url: '/seed-assets/concept-environment-storm-front.svg',
      caption: 'Storm front rolling over the island, dusk palette pass',
      tags: ['art/environment', 'palette'],
      updatedAt: daysBeforeAnchor(55),
    },
    {
      ...base,
      id: ASSET_IDS.levelMapDropzone,
      kind: 'image',
      url: '/seed-assets/level-map-dropzone-island.svg',
      caption: 'Dropzone Island — annotated points of interest',
      tags: ['level-design/map'],
      updatedAt: daysBeforeAnchor(48),
    },
    {
      ...base,
      id: ASSET_IDS.hudWireframe,
      kind: 'image',
      url: '/seed-assets/hud-wireframe.svg',
      caption: 'HUD wireframe — health/shield, storm timer, material counts',
      tags: ['ui/wireframe'],
      updatedAt: daysBeforeAnchor(40),
    },
    {
      ...base,
      id: ASSET_IDS.keyArtTeaser,
      kind: 'image',
      url: '/seed-assets/key-art-teaser.svg',
      caption: 'Early key art teaser composition',
      tags: ['art/key-art', 'marketing'],
      updatedAt: daysBeforeAnchor(16),
    },
    {
      ...base,
      id: ASSET_IDS.referenceTrackCombat,
      kind: 'audio',
      url: '/seed-assets/reference-track-combat.mp3',
      caption: 'Reference track — combat layer, high storm-tension target',
      tags: ['audio/reference'],
      updatedAt: daysBeforeAnchor(9),
    },
  ]

  return assets
}
