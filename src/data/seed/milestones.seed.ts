import type { Milestone } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { dateOnly, daysAfterAnchor, daysBeforeAnchor } from './dates'
import { FEATURE_IDS } from './featureCards.seed'
import { mkId } from './ids'

export const MILESTONE_IDS = {
  closedPlaytest: mkId('milestone', 'closed-playtest'),
  alpha: mkId('milestone', 'alpha-feature-complete'),
  beta: mkId('milestone', 'beta-content-complete'),
  season1Launch: mkId('milestone', 'season-1-launch'),
} as const

export function buildMilestones(): Milestone[] {
  const base = { projectId: PROJECT_ID, updatedBy: SEED_UPDATED_BY }

  return [
    {
      ...base,
      id: MILESTONE_IDS.closedPlaytest,
      name: 'Closed Playtest',
      date: dateOnly(daysBeforeAnchor(90)),
      state: 'done',
      exitCriteria: [
        'Drop → Loot → Engage → Rotate playable start to finish on one map',
        'Edit-Under-Fire Building and Material Harvesting shipped',
        'One full 60-player match completed end to end with no crash',
      ],
      linkedFeatureIds: [FEATURE_IDS.editUnderFireBuilding, FEATURE_IDS.materialHarvesting, FEATURE_IDS.weaponRarityLootPool],
      createdAt: daysBeforeAnchor(148),
      updatedAt: daysBeforeAnchor(90),
    },
    {
      ...base,
      id: MILESTONE_IDS.alpha,
      name: 'Alpha (Feature Complete)',
      date: dateOnly(daysAfterAnchor(12)),
      state: 'at-risk',
      exitCriteria: [
        'All core systems have a first pass in build',
        'Squad Revive divergence resolved to match the per-player-timed decision',
        'No feature card left at idea status',
      ],
      linkedFeatureIds: [
        FEATURE_IDS.squadReviveRebootVan,
        FEATURE_IDS.stormDamageScaling,
        FEATURE_IDS.squadPingSystem,
        FEATURE_IDS.mantleSlideMovementTech,
        FEATURE_IDS.botFillMatchmaking,
        FEATURE_IDS.adaptiveStormTensionScore,
      ],
      createdAt: daysBeforeAnchor(148),
      updatedAt: daysBeforeAnchor(12),
    },
    {
      ...base,
      id: MILESTONE_IDS.beta,
      name: 'Beta (Content Complete)',
      date: dateOnly(daysAfterAnchor(70)),
      state: 'upcoming',
      exitCriteria: [
        'Season 1 map content-complete',
        'Full audio pass on storm tension music layering',
        'Seasonal Vaulted Weapon Rotation decision finalized — ship or cut',
      ],
      linkedFeatureIds: [FEATURE_IDS.seasonalVaultedWeaponRotation, FEATURE_IDS.adaptiveStormTensionScore],
      createdAt: daysBeforeAnchor(148),
      updatedAt: daysBeforeAnchor(60),
    },
    {
      ...base,
      id: MILESTONE_IDS.season1Launch,
      name: 'Season 1 Launch',
      date: dateOnly(daysAfterAnchor(130)),
      state: 'upcoming',
      exitCriteria: [
        'Certification pass on PS5 and Xbox Series X|S',
        'Server tick rate held at target under a full 60-player match',
        'Battle Pass and item shop live end to end',
      ],
      linkedFeatureIds: [],
      createdAt: daysBeforeAnchor(148),
      updatedAt: daysBeforeAnchor(148),
    },
  ]
}
