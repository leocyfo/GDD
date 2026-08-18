import type { ProductionAsset } from '../types/entities'
import { ASSET_IDS } from './assets.seed'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { mkId } from './ids'

/**
 * "What the game still needs" — distinct from `assets.seed.ts`, which is
 * files already delivered. Most rows here are deliberately still `todo`;
 * a couple point `assetId` at an already-seeded `Asset` to demonstrate the
 * planned → delivered link the Asset List screen is built around.
 */
export function buildProductionAssets(): ProductionAsset[] {
  const base = { projectId: PROJECT_ID, updatedBy: SEED_UPDATED_BY, createdAt: daysBeforeAnchor(60) }

  const entries: ProductionAsset[] = [
    {
      ...base,
      id: mkId('production-asset', 'hud-wireframe-pass'),
      name: 'HUD wireframe pass',
      kind: 'image',
      purpose: 'Health/shield, storm timer, material counts — first-pass layout',
      status: 'done',
      notes: 'Delivered as a wireframe; final art pass still open.',
      assetId: ASSET_IDS.hudWireframe,
      updatedAt: daysBeforeAnchor(40),
    },
    {
      ...base,
      id: mkId('production-asset', 'operator-silhouettes'),
      name: 'Operator concept silhouettes',
      kind: 'image',
      purpose: 'Default loadout + mid-build pose reads',
      status: 'done',
      notes: '',
      assetId: ASSET_IDS.silhouetteOperator,
      updatedAt: daysBeforeAnchor(70),
    },
    {
      ...base,
      id: mkId('production-asset', 'combat-music-reference'),
      name: 'Combat music reference track',
      kind: 'audio',
      purpose: 'High storm-tension layer — target for the real composition',
      status: 'done',
      notes: 'Reference only, not final mix.',
      assetId: ASSET_IDS.referenceTrackCombat,
      updatedAt: daysBeforeAnchor(9),
    },
    {
      ...base,
      id: mkId('production-asset', 'storm-damage-vfx'),
      name: 'Storm damage screen VFX',
      kind: 'file',
      purpose: 'Screen-edge damage read while standing in the storm',
      status: 'in-progress',
      notes: 'Shader prototype in the VFX graph; needs a color pass.',
      assetId: null,
      updatedAt: daysBeforeAnchor(12),
    },
    {
      ...base,
      id: mkId('production-asset', 'reboot-van-model'),
      name: 'Reboot van 3D model',
      kind: 'file',
      purpose: 'Squad Revive & Reboot Van feature — the physical prop',
      status: 'in-progress',
      notes: 'Blockout done, see the Squad Revive feature card for the logic side.',
      assetId: null,
      updatedAt: daysBeforeAnchor(6),
    },
    {
      ...base,
      id: mkId('production-asset', 'material-texture-wood'),
      name: 'Building material — wood texture set',
      kind: 'image',
      purpose: 'Wall/floor/ramp piece skin, tier 1',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'material-texture-metal'),
      name: 'Building material — metal texture set',
      kind: 'image',
      purpose: 'Upgraded piece skin, tier 3',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'weapon-sfx-ar'),
      name: 'Weapon fire SFX — assault rifle',
      kind: 'audio',
      purpose: 'Primary weapon, mid-range engagements',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'weapon-sfx-shotgun'),
      name: 'Weapon fire SFX — shotgun',
      kind: 'audio',
      purpose: 'Close-range engagements',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'killfeed-icon-set'),
      name: 'Elimination feed weapon icon set',
      kind: 'image',
      purpose: 'Killfeed — one icon per weapon class',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'storm-wall-shader'),
      name: 'Storm circle wall shader',
      kind: 'file',
      purpose: 'The visual wall of the shrinking safe zone',
      status: 'todo',
      notes: '',
      assetId: null,
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: mkId('production-asset', 'victory-stinger'),
      name: 'Victory Royale end-of-match stinger',
      kind: 'video',
      purpose: 'Celebratory cutscene on winning a match',
      status: 'cut',
      notes: 'Cut for the Vertical Slice — revisit post-Alpha if time allows.',
      assetId: null,
      updatedAt: daysBeforeAnchor(3),
    },
  ]

  return entries
}
