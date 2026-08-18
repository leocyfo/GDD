import type { Loop } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { mkId } from './ids'

export const LOOP_IDS = {
  core: mkId('loop', 'core'),
  meta: mkId('loop', 'meta'),
  session: mkId('loop', 'session'),
} as const

export function buildLoops(): Loop[] {
  const createdAt = daysBeforeAnchor(148)

  const core: Loop = {
    id: LOOP_IDS.core,
    projectId: PROJECT_ID,
    name: 'Core Loop',
    nodes: [
      { id: 'node:drop', verb: 'Drop', note: 'Skydive from the bus and pick a landing spot before the map fills in.' },
      { id: 'node:loot', verb: 'Loot', note: 'Scavenge weapons, materials, and consumables from buildings and floor loot.' },
      { id: 'node:engage', verb: 'Engage', note: 'Fight or avoid other squads using positioning, materials, and gunplay — see the Systems section.' },
      { id: 'node:rotate', verb: 'Rotate', note: 'Move with the shrinking storm circle toward the next safe zone, banking survival time.' },
    ],
    edges: [
      { from: 'node:drop', to: 'node:loot' },
      { from: 'node:loot', to: 'node:engage' },
      { from: 'node:engage', to: 'node:rotate' },
      { from: 'node:rotate', to: 'node:loot', label: 'next zone, new loot pool' },
    ],
    isCycle: true,
    createdAt,
    updatedAt: daysBeforeAnchor(38),
    updatedBy: SEED_UPDATED_BY,
  }

  const meta: Loop = {
    id: LOOP_IDS.meta,
    projectId: PROJECT_ID,
    name: 'Meta Progression Loop',
    nodes: [
      { id: 'node:collect-xp', verb: 'Collect XP', note: 'Earned from eliminations, damage, and placement, win or lose.' },
      { id: 'node:level-pass', verb: 'Level the Battle Pass', note: 'XP fills the current season\'s Battle Pass track.' },
      { id: 'node:unlock-cosmetic', verb: 'Unlock a Cosmetic', note: 'Levels grant skins, emotes, and pickaxe cosmetics — never power, per the no-pay-to-win non-goal.' },
      { id: 'node:requeue', verb: 'Requeue', note: 'Players queue again chasing the next unlock.' },
    ],
    edges: [
      { from: 'node:collect-xp', to: 'node:level-pass' },
      { from: 'node:level-pass', to: 'node:unlock-cosmetic' },
      { from: 'node:unlock-cosmetic', to: 'node:requeue' },
      { from: 'node:requeue', to: 'node:collect-xp', label: 'new match, same pass' },
    ],
    isCycle: true,
    createdAt,
    updatedAt: daysBeforeAnchor(38),
    updatedBy: SEED_UPDATED_BY,
  }

  const session: Loop = {
    id: LOOP_IDS.session,
    projectId: PROJECT_ID,
    name: 'Match Session Loop',
    nodes: [
      { id: 'node:enter-lobby', verb: 'Enter Lobby', note: 'Squad forms and queues together — solo and duos supported too.' },
      { id: 'node:play-circle', verb: 'Play the Circle', note: 'Full match, drop through final circle, roughly 18-22 minutes.' },
      { id: 'node:post-match', verb: 'Post-Match Recap', note: 'Stats, XP, and replay-worthy eliminations surface immediately.' },
      { id: 'node:requeue-match', verb: 'Requeue', note: 'One button back into a new lobby, no menu detour required.' },
    ],
    edges: [
      { from: 'node:enter-lobby', to: 'node:play-circle' },
      { from: 'node:play-circle', to: 'node:post-match' },
      { from: 'node:post-match', to: 'node:requeue-match' },
      { from: 'node:requeue-match', to: 'node:enter-lobby', label: 'squad stays together' },
    ],
    isCycle: true,
    createdAt,
    updatedAt: daysBeforeAnchor(20),
    updatedBy: SEED_UPDATED_BY,
  }

  return [core, meta, session]
}
