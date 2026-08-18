import type { NonGoal, Pillar } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { mkId } from './ids'

export const PILLAR_IDS = {
  buildingIsCombat: mkId('pillar', 'building-is-combat'),
  fasterHandsWin: mkId('pillar', 'faster-hands-win'),
  lootCreatesDecisions: mkId('pillar', 'loot-creates-decisions'),
  stormIsTheFinalBoss: mkId('pillar', 'storm-is-the-final-boss'),
} as const

export const NON_GOAL_IDS = {
  noPayToWinCosmetics: mkId('nongoal', 'no-pay-to-win-cosmetics'),
  noSoloOnlyDesign: mkId('nongoal', 'no-solo-only-design'),
  noHeroAbilities: mkId('nongoal', 'no-hero-abilities'),
} as const

export function buildPillars(): Pillar[] {
  const createdAt = daysBeforeAnchor(148)
  const updatedAt = daysBeforeAnchor(30)
  return [
    {
      id: PILLAR_IDS.buildingIsCombat,
      projectId: PROJECT_ID,
      label: 'Building is combat, not a menu',
      rationale:
        'A wall thrown up mid-firefight has to be as fast and as legible as pulling a trigger. Any building interaction that reads as "opening a submenu" instead of "reacting in real time" gets cut or reworked.',
      order: 1,
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: PILLAR_IDS.fasterHandsWin,
      projectId: PROJECT_ID,
      label: "Every fight is winnable if your hands are faster",
      rationale:
        'No loadout, no landing spot, and no amount of loot should make a fight unwinnable on skill alone. Gear widens the margin; it never replaces the edit-and-aim exchange.',
      order: 2,
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: PILLAR_IDS.lootCreatesDecisions,
      projectId: PROJECT_ID,
      label: 'Loot creates decisions, not busywork',
      rationale:
        'Every pickup should force a real trade-off — carry weight, rotation timing, risk of the fight it might start. A loot pool that just needs clearing rather than judging is a loot pool we cut.',
      order: 3,
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: PILLAR_IDS.stormIsTheFinalBoss,
      projectId: PROJECT_ID,
      label: 'The storm is the real final boss',
      rationale:
        'The shrinking circle, not another squad, should be the pressure every match is ultimately measured against. Late-game tension comes from the clock and the map, not from stacking more enemies into a shrinking space.',
      order: 4,
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
  ]
}

export function buildNonGoals(): NonGoal[] {
  const createdAt = daysBeforeAnchor(148)
  const updatedAt = daysBeforeAnchor(60)
  return [
    {
      id: NON_GOAL_IDS.noPayToWinCosmetics,
      projectId: PROJECT_ID,
      statement: 'No pay-to-win cosmetic power — cosmetics never touch combat stats.',
      reason:
        'The Battle Pass and item shop fund the game, but a purchase that changes hitboxes, movement speed, or damage would undercut "every fight is winnable" for anyone who hasn\'t paid.',
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: NON_GOAL_IDS.noSoloOnlyDesign,
      projectId: PROJECT_ID,
      statement: 'No solo-only design — every system is built squad-first, solo is the retrofit.',
      reason:
        'Reboot vans, pings, and shared material pools only make sense designed around a squad from day one; bolting squad features onto a solo-first game was the single biggest schedule risk flagged in early scoping.',
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: NON_GOAL_IDS.noHeroAbilities,
      projectId: PROJECT_ID,
      statement: 'No dev-authored "hero" characters with unique combat abilities.',
      reason:
        'Keeps the playing field level and keeps the loop\'s challenge in positioning, building, and aim rather than in picking the correct character kit before the match even starts.',
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    },
  ]
}
