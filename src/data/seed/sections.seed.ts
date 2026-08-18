import type { Block, Section, SectionKey } from '../types/entities'
import { computeFreshness } from '../../lib/freshness'
import { SECTION_DEFINITIONS } from '../sectionDefinitions'
import { ASSET_IDS } from './assets.seed'
import { COLLABORATOR_IDS } from './collaborators.seed'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { SEED_ANCHOR, daysBeforeAnchor } from './dates'
import { FEATURE_IDS } from './featureCards.seed'
import { sectionId } from './ids'
import { LOOP_IDS } from './loop.seed'

/** Demo content only — `key`/`index`/`title`/`icon` come from the shared
 * `SECTION_DEFINITIONS` (see `buildSections` below) so they can't drift
 * from what a newly-created project gets. */
interface SectionSeed {
  key: SectionKey
  blocks: Block[]
  owners: string[]
  daysAgo: number
  reviewed: boolean
}

const SECTION_SEEDS: SectionSeed[] = [
  {
    key: 'core-concept',
    owners: [COLLABORATOR_IDS.priya],
    daysAgo: 5,
    reviewed: true,
    blocks: [
      { type: 'heading', level: 2, text: 'Pitch' },
      {
        type: 'text',
        markdown:
          "A 60-player battle royale where building isn't an accessory to combat — it's the combat: throw up cover mid-firefight, box in a downed enemy, or bridge to high ground before the storm eats the map.",
      },
      { type: 'heading', level: 2, text: 'Pillars' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Building is combat, not a menu',
          'Every fight is winnable if your hands are faster',
          'Loot creates decisions, not busywork',
          'The storm is the real final boss',
        ],
      },
      { type: 'heading', level: 2, text: 'Non-goals' },
      {
        type: 'list',
        ordered: false,
        items: [
          'No pay-to-win cosmetic power',
          'No solo-only design',
          'No dev-authored "hero" characters with unique combat abilities',
        ],
      },
      {
        type: 'callout',
        variant: 'decision',
        title: 'Core mechanic locked',
        body: 'Real-time, in-combat building is the core mechanic every other system builds around — see the decision log.',
      },
    ],
  },
  {
    key: 'gameplay',
    owners: [COLLABORATOR_IDS.priya, COLLABORATOR_IDS.deshawn],
    daysAgo: 8,
    reviewed: false,
    blocks: [
      { type: 'heading', level: 2, text: 'Core Loop' },
      {
        type: 'text',
        markdown:
          'The core loop repeats every match: drop, loot, engage or avoid other squads, and rotate with the shrinking storm circle toward the next safe zone — bank survival time until only one squad is left.',
      },
      { type: 'loop', loopId: LOOP_IDS.core },
      { type: 'heading', level: 2, text: 'Match Flow' },
      {
        type: 'text',
        markdown:
          'The loop above repeats *within* a match, every fight or two. This is the match itself, start to finish, once: drop in, the storm tightens across a few distinct phases, and it forks at Match End depending on whether our squad is the one still standing.',
      },
      {
        type: 'flowMap',
        nodes: [
          { id: 'flow:drop', label: 'Drop', shape: 'start', row: 1, note: 'Skydive from the bus and pick a landing spot before the safe zone shrinks toward it.' },
          { id: 'flow:early', label: 'Early Game', shape: 'process', row: 1, note: 'Loot, harvest materials, box in easy fights — low storm pressure, most players still alive.' },
          { id: 'flow:mid', label: 'Mid Game', shape: 'process', row: 1, note: 'The zone tightens and rotations force fights; building becomes the deciding factor over raw gunplay.' },
          { id: 'flow:final', label: 'Final Circle', shape: 'process', row: 1, note: 'Last squads standing fight inside a tiny safe zone, storm damage maxed just outside it.' },
          { id: 'flow:match-end', label: 'Match End', shape: 'decision', row: 1, note: 'Only one squad left standing, or ours got wiped first.' },
          { id: 'flow:victory', label: 'Victory Royale', shape: 'process', row: 0, note: 'Last squad standing — feeds the win screen and Battle Pass bonus XP.' },
          { id: 'flow:elimination', label: 'Elimination', shape: 'process', row: 2, note: 'Squad wiped — feeds the elimination feed and spectate cam.' },
          { id: 'flow:recap', label: 'Post-Match Recap', shape: 'end', row: 1, note: 'Stats, XP, and Battle Pass progress surface immediately — feeds into the Meta Progression Loop.' },
        ],
        edges: [
          { from: 'flow:drop', to: 'flow:early' },
          { from: 'flow:early', to: 'flow:mid' },
          { from: 'flow:mid', to: 'flow:final' },
          { from: 'flow:final', to: 'flow:match-end' },
          { from: 'flow:match-end', to: 'flow:victory', label: 'last squad standing' },
          { from: 'flow:match-end', to: 'flow:elimination', label: 'squad wiped' },
          { from: 'flow:victory', to: 'flow:recap' },
          { from: 'flow:elimination', to: 'flow:recap' },
        ],
      },
      { type: 'heading', level: 2, text: 'Core building & movement' },
      {
        type: 'featureCards',
        featureIds: [FEATURE_IDS.editUnderFireBuilding, FEATURE_IDS.materialHarvesting, FEATURE_IDS.mantleSlideMovementTech, FEATURE_IDS.squadPingSystem],
      },
      {
        type: 'callout',
        variant: 'risk',
        title: 'Squad Revive & Reboot Van is in-build-diverged',
        body: 'Design now calls for a per-player 90-second reboot card; the build still lets one interact instantly revive the whole squad with no expiry. See the Squad Revive & Reboot Van feature card and the rebootCardExpiresAt logic note.',
      },
      { type: 'heading', level: 2, text: 'Systems' },
      {
        type: 'text',
        markdown: 'Eight systems carry the match. Each links out to its logic notes in the vault rather than duplicating values here.',
      },
      {
        type: 'table',
        headers: ['System', 'Summary'],
        rows: [
          ['Building', 'Instant piece placement plus a fast edit window for windows, doors, and stairs — see GAME LOGIC/SYSTEM AND CORE.'],
          ['Storm', 'A shrinking, damage-scaling safe zone that drives rotation pressure across eight numbered phases.'],
          ['Loot & Economy', 'A five-tier weighted drop table across floor loot, chests, and supply drops, refreshed every season.'],
          ['Movement', 'Mantle, slide-cancel, and sprint tech layered on top of standard traversal.'],
          ['Squad & Communication', 'Context-sensitive pings plus opt-in squad voice chat — no open-world proximity voice, see the decision log.'],
          ['Matchmaking', 'Solo, duos, and squads queues, with off-peak bot-fill still at idea status.'],
          ['Progression', 'A seasonal Battle Pass track fed by match XP; unlocks are cosmetic only, never combat stats.'],
          ['Dynamic Audio', 'Storm-tension-scored combat music layering; the Downed-state music layer is designed but not yet built.'],
        ],
      },
      {
        type: 'query',
        expression: 'FROM "GAME LOGIC/ECONOMY" WHERE tag = "status/wip" SORT title ASC AS table(title, scope, valueType, updatedAt)',
      },
    ],
  },
  {
    key: 'story',
    owners: [COLLABORATOR_IDS.priya],
    daysAgo: 50,
    reviewed: false,
    blocks: [
      {
        type: 'text',
        markdown:
          "Stormline runs on a light narrative device rather than a campaign: the island is a decommissioned weather-research site, and the storm itself is the season's evolving antagonist — every season nudges the map and the in-world radio chatter forward instead of shipping a story mode.",
      },
      { type: 'heading', level: 2, text: 'Themes' },
      { type: 'list', ordered: false, items: ['Survival', 'Reinvention', 'Competition'] },
      { type: 'heading', level: 2, text: 'Season 1 narrative beats (draft)' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Signal Loss — the research site goes dark; the island opens to drop-ins for the first time.',
          'First Front — the storm\'s first recorded pass reveals it is expanding, not receding.',
          'Refinery Blackout — a POI-specific event teases what the research site was actually studying.',
          'The Long Circle — the season\'s final week hints the storm is being watched, not just weathered.',
        ],
      },
    ],
  },
  {
    key: 'art',
    owners: [COLLABORATOR_IDS.ines],
    daysAgo: 22,
    reviewed: false,
    blocks: [
      {
        type: 'text',
        markdown: 'Bright, stylized, and readable at a glance — silhouettes and rarity colors have to win over gritty realism every time they conflict.',
      },
      {
        type: 'gallery',
        assetIds: [ASSET_IDS.silhouetteOperator, ASSET_IDS.silhouetteBuilderPose, ASSET_IDS.environmentStormFront],
      },
      {
        type: 'palette',
        swatches: [
          { hex: '#1B2A4A', name: 'Storm Navy' },
          { hex: '#3D5AFE', name: 'Electric Blue' },
          { hex: '#FF6B35', name: 'Warning Orange' },
          { hex: '#F7C548', name: 'Loot Gold' },
          { hex: '#2ED9C3', name: 'Signal Teal' },
          { hex: '#E8E8F0', name: 'Cloud White' },
        ],
      },
    ],
  },
  {
    key: 'constraints',
    owners: [COLLABORATOR_IDS.deshawn, COLLABORATOR_IDS.priya],
    daysAgo: 60,
    reviewed: true,
    blocks: [
      {
        type: 'table',
        headers: ['Constraint', 'Value'],
        rows: [
          ['Target Platforms', 'PC, PS5, Xbox Series X|S, Mobile (stretch)'],
          ['Performance', '60 FPS target, 60-player live match'],
          ['Team Size', '22'],
          ['Budget', 'Medium'],
          ['Engine', 'Unreal Engine 5'],
          ['Season 1 Launch Window', 'Q1 2027'],
          ['Business Model', 'Free-to-play, seasonal Battle Pass + cosmetic shop'],
          ['Rating Target', 'ESRB T / PEGI 12'],
        ],
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Platform lineup',
        body: "No Switch in v1 — a 60-player live match at the target tick rate needs a dedicated performance and netcode pass we don't have room for yet.",
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Scope is tracked separately',
        body: 'What\'s in, out, or stretch — and why — now lives on its own Scope Matrix screen, not as a block buried in this section.',
      },
      { type: 'heading', level: 2, text: 'Systems architecture' },
      {
        type: 'text',
        markdown:
          'One `GameManager` owns match state and wires up everything below it — this is the top-level dependency shape, not a full class diagram.',
      },
      {
        type: 'diagram',
        mermaid:
          'graph TD\n' +
          '  GM[GameManager] --> Storm[StormController]\n' +
          '  GM --> Build[BuildingSystem]\n' +
          '  GM --> Loot[LootEconomySystem]\n' +
          '  GM --> Move[MovementController]\n' +
          '  GM --> Squad[SquadCommsSystem]\n' +
          '  Build --> MatInv[MaterialInventory]\n' +
          '  Loot --> MatInv\n' +
          '  Storm --> Move',
      },
    ],
  },
  {
    key: 'level',
    owners: [COLLABORATOR_IDS.malik],
    daysAgo: 33,
    reviewed: false,
    blocks: [
      {
        type: 'text',
        markdown: 'Dropzone Island is the Season 1 map — a ring of distinct points of interest around a central, contested Refinery.',
      },
      {
        type: 'annotatedMap',
        assetId: ASSET_IDS.levelMapDropzone,
        pins: [
          { id: 'pin:refinery', x: 50, y: 46, label: 'Refinery (central POI)' },
          { id: 'pin:harbor', x: 18, y: 72, label: 'Harbor Docks' },
          { id: 'pin:signal-tower', x: 74, y: 22, label: 'Signal Tower (high ground)' },
        ],
      },
      { type: 'heading', level: 2, text: 'POI catalog' },
      {
        type: 'text',
        markdown: 'Every named zone on the island, tracked separately from the map callout above — production status included.',
      },
      { type: 'levelCatalog' },
    ],
  },
  {
    key: 'ui-ux',
    owners: [COLLABORATOR_IDS.ines, COLLABORATOR_IDS.deshawn],
    daysAgo: 44,
    reviewed: false,
    blocks: [
      { type: 'heading', level: 2, text: 'HUD' },
      { type: 'text', markdown: 'HUD stays out of the way during rotation and expands only what the current fight or build action needs.' },
      { type: 'image', assetId: ASSET_IDS.hudWireframe, caption: 'HUD wireframe — health/shield, storm timer, material counts' },
      { type: 'heading', level: 2, text: 'Controls' },
      {
        type: 'controlsDiagram',
        entries: [
          { id: 1, keys: 'Z, Q, S, D', codes: ['KeyW', 'KeyA', 'KeyS', 'KeyD'], action: 'Move player', gameState: 'In-game' },
          { id: 2, keys: 'Espace', codes: ['Space'], action: 'Jump / mantle', gameState: 'In-game' },
          { id: 3, keys: '1, 2, 3, 4', codes: ['Digit1', 'Digit2', 'Digit3', 'Digit4'], action: 'Select build piece (wall / floor / ramp / roof)', gameState: 'In-game' },
          { id: 4, keys: 'E', codes: ['KeyE'], action: 'Harvest material / interact', gameState: 'In-game' },
          { id: 5, keys: 'Clic gauche', codes: [], action: 'Shoot, or confirm a build placement', gameState: 'In-game' },
          { id: 6, keys: 'Échap', codes: ['Escape'], action: 'Open menu', gameState: 'In-game, all views' },
        ],
      },
    ],
  },
  {
    key: 'audio',
    owners: [COLLABORATOR_IDS.sofia],
    daysAgo: 10,
    reviewed: false,
    blocks: [
      {
        type: 'text',
        markdown: 'Storm-tension-scored combat layering over footstep-driven positional audio — see the decision against open-world proximity voice.',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Reference track',
        body: 'High storm-tension combat target is captured in the reference-track-combat asset.',
      },
    ],
  },
  {
    key: 'milestones',
    owners: [COLLABORATOR_IDS.priya],
    daysAgo: 8,
    reviewed: false,
    blocks: [
      {
        type: 'text',
        markdown:
          "The timeline favors two visible checkpoints — Closed Playtest, then Alpha — over one big-bang launch date, so the team gets real player signal on the core building/storm loop before content production scales up. Exit criteria, dates, and linked feature cards live on the dedicated Milestones screen; this section is the *why*, not the *when*.",
      },
      {
        type: 'callout',
        variant: 'risk',
        title: 'Alpha is at risk',
        body: 'The Squad Revive divergence needs to resolve before Alpha can close — see the Gameplay & Systems section and the Squad Revive & Reboot Van feature card.',
      },
    ],
  },
  {
    key: 'appendix',
    owners: [COLLABORATOR_IDS.priya],
    daysAgo: 90,
    reviewed: false,
    blocks: [
      { type: 'heading', level: 2, text: 'Stretch goals' },
      {
        type: 'text',
        markdown: 'Seasonal Vaulted Weapon Rotation and Bot-Fill Matchmaking are both fully designed but not committed to v1 — see the decision log.',
      },
      { type: 'heading', level: 2, text: 'Marketing & monetization' },
      {
        type: 'text',
        markdown:
          '**Positioning**: a fast-paced, building-first battle royale for players who want mechanical skill expression to go beyond aim alone. **Competitors**: Fortnite, Apex Legends, PUBG, and Call of Duty: Warzone — Stormline\'s wedge is combat-speed building as the primary skill ceiling, not a secondary system. **Business model**: free-to-play, funded by a seasonal Battle Pass and a rotating cosmetic shop — see the decision log for the no-pay-to-win commitment.',
      },
      { type: 'heading', level: 2, text: 'External docs' },
      { type: 'list', ordered: false, items: ['Ranked signal playtest report (external)', 'Duos mode playtest report (external)'] },
    ],
  },
]

export function buildSections(): Section[] {
  const definitionByKey = new Map(SECTION_DEFINITIONS.map((def) => [def.key, def]))

  return SECTION_SEEDS.map((seed) => {
    const definition = definitionByKey.get(seed.key)
    if (!definition) throw new Error(`No SECTION_DEFINITIONS entry for key "${seed.key}"`)

    const updatedAt = daysBeforeAnchor(seed.daysAgo)
    return {
      id: sectionId(seed.key),
      projectId: PROJECT_ID,
      index: definition.index,
      key: definition.key,
      title: definition.title,
      icon: definition.icon,
      blocks: seed.blocks,
      owners: seed.owners,
      freshness: computeFreshness(updatedAt, SEED_ANCHOR),
      reviewedAt: seed.reviewed ? updatedAt : null,
      createdAt: daysBeforeAnchor(148),
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    }
  })
}
