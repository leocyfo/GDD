import type { LogicNote, NoteKind, NoteScope, ValueType } from '../../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from '../constants'
import { daysBeforeAnchor } from '../dates'
import { noteId } from '../ids'
import type { VaultFolder } from '../../vaultFolders'

/**
 * One entry per note, authored by hand (not generated from lorem ipsum).
 * `relatedTitles` drives both the `[[Wikilink]]` mentions embedded in
 * `logic` and the note's computed `outbound` links — `resolveNotes()` below
 * turns titles into ids and inverts the graph into `inbound`, so backlinks
 * can never drift out of sync with what a note actually declares.
 */
interface LogicNoteSeed {
  folderPath: VaultFolder
  title: string
  scope: NoteScope
  kind: NoteKind
  valueType: ValueType
  values: string
  logic: string
  tags: string[]
  extras: string
  engineRef: string | null
  relatedTitles: string[]
  daysAgo: number
}

const PLAYER = 'GAME LOGIC/PLAYER' as const
const SYSTEM_AND_CORE = 'GAME LOGIC/SYSTEM AND CORE' as const
const NPC = 'GAME LOGIC/NPC' as const
const WORLD = 'GAME LOGIC/WORLD' as const
const ECONOMY = 'GAME LOGIC/ECONOMY' as const
const INVENTORY = 'GAME LOGIC/INVENTORY AND STORAGE' as const
const ACTIVITIES = 'GAME LOGIC/ACTIVITIES' as const
const AUDIO = 'GAME LOGIC/AUDIO' as const
const INPUT = 'GAME LOGIC/INPUT' as const
const VISUAL = 'GAME LOGIC/VISUAL' as const
const SAVE_AND_LOAD = 'GAME LOGIC/SAVE AND LOAD' as const
const HEADLINES = 'MARKETING/Headlines' as const
const MESSY = 'ORGANIZATION/MESSY STUFF' as const
const TEMPLATES = 'ORGANIZATION/TEMPLATES' as const
const TESTS = 'ORGANIZATION/TESTS' as const

const NOTE_SEEDS: LogicNoteSeed[] = [
  // ---------------------------------------------------------------- PLAYER
  {
    folderPath: PLAYER,
    title: 'playerHealth',
    scope: 'save',
    kind: 'variable',
    valueType: 'float',
    values: '0–100, default 100',
    logic:
      'Standard damage pool. Reaching 0 in a squad mode triggers [[playerReviveState]] moving to Downed rather than an instant elimination. Edge case: solo queue skips Downed entirely — zero health is a direct elimination when there is no teammate to revive you, a genuinely different rule that is easy to forget when reusing this note for solo balance.',
    tags: ['status/implemented', 'system/player'],
    extras: '',
    engineRef: 'BP_PlayerState::Health',
    relatedTitles: ['playerReviveState'],
    daysAgo: 30,
  },
  {
    folderPath: PLAYER,
    title: 'playerShield',
    scope: 'save',
    kind: 'variable',
    valueType: 'float',
    values: '0–100, default 0 at drop, refilled by shield consumables',
    logic:
      'Absorbs damage before [[playerHealth]] is touched at all. Edge case: shield does not regenerate on its own — it is consumable-only, a deliberate rule that keeps shield potions a real loot decision instead of a free wait-it-out mechanic.',
    tags: ['status/implemented', 'system/player'],
    extras: '',
    engineRef: 'BP_PlayerState::Shield',
    relatedTitles: ['playerHealth'],
    daysAgo: 30,
  },
  {
    folderPath: PLAYER,
    title: 'playerMaterialWood',
    scope: 'save',
    kind: 'variable',
    valueType: 'int',
    values: '0–999, default 0',
    logic:
      'Spent building Wood-tier [[buildPieceType]] pieces, earned via [[harvestYieldRate]]. Edge case: capped at 999 per material, not per inventory slot — materials never take up carry-weight the way items do, on purpose.',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_PlayerState::MaterialWood',
    relatedTitles: ['buildPieceType', 'harvestYieldRate'],
    daysAgo: 55,
  },
  {
    folderPath: PLAYER,
    title: 'playerMaterialStone',
    scope: 'save',
    kind: 'variable',
    valueType: 'int',
    values: '0–999, default 0',
    logic:
      'Stone-tier [[buildPieceType]] pieces cost more Stone than Wood but survive more damage, per [[buildPieceHealth]]. Edge case: same 999 cap and no carry-weight rule as [[playerMaterialWood]].',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_PlayerState::MaterialStone',
    relatedTitles: ['buildPieceType', 'buildPieceHealth', 'playerMaterialWood'],
    daysAgo: 55,
  },
  {
    folderPath: PLAYER,
    title: 'playerMaterialMetal',
    scope: 'save',
    kind: 'variable',
    valueType: 'int',
    values: '0–999, default 0',
    logic:
      'Metal-tier pieces are the slowest to build and the toughest defensively. Edge case: metal is deliberately the rarest harvest yield of the three — see [[harvestYieldRate]] — so metal walls read as a real commitment, not a default choice.',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_PlayerState::MaterialMetal',
    relatedTitles: ['harvestYieldRate'],
    daysAgo: 55,
  },
  {
    folderPath: PLAYER,
    title: 'playerReviveState',
    scope: 'save',
    kind: 'state-machine',
    valueType: 'enum',
    values: 'Healthy | Downed | Eliminated, default Healthy',
    logic:
      "Governs whether a player can be revived by a teammate or needs [[squadDownedCount]]'s reboot-van path instead. Edge case: in solo modes this state machine is skipped entirely — see [[playerHealth]] — so a UI built against this note alone will assume Downed always exists, which is false outside squad modes.",
    tags: ['status/implemented', 'system/player'],
    extras: '',
    engineRef: 'BP_PlayerState::ReviveState',
    relatedTitles: ['squadDownedCount', 'playerHealth'],
    daysAgo: 30,
  },

  // ------------------------------------------------------- SYSTEM AND CORE
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'buildPieceHealth',
    scope: 'scene',
    kind: 'variable',
    valueType: 'float',
    values: 'Wood wall 150 / Stone wall 200 / Metal wall 400, per [[buildPieceType]] tier',
    logic:
      "HP a placed piece has before it is destroyed; damaged pieces show cracked states at 50%. Edge case: a piece mid-edit (see [[buildEditWindowMs]]) keeps its prior HP rather than resetting to full — editing a damaged wall shouldn't be a free repair.",
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_BuildPiece::Health',
    relatedTitles: ['buildPieceType', 'buildEditWindowMs'],
    daysAgo: 55,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'buildEditWindowMs',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: '350ms input window',
    logic:
      'How long a player has to confirm an edit (a window, a door) cut into a placed piece before it cancels back to a plain piece. Edge case: canceling an edit mid-window refunds zero material — the [[buildMaterialCost]] was already spent on placement, editing itself is free but not refundable.',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_BuildComponent::EditWindowMs',
    relatedTitles: ['buildMaterialCost'],
    daysAgo: 55,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'buildMaterialCost',
    scope: 'global',
    kind: 'variable',
    valueType: 'int',
    values: 'Wood wall 10 / Stone wall 20 / Metal wall 30',
    logic:
      'Material spent per placed piece, deducted from [[playerMaterialWood]] and its siblings by tier. Edge case: a placement that would leave the material below zero is blocked at the input layer, never partially deducted.',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_BuildComponent::MaterialCost',
    relatedTitles: ['playerMaterialWood'],
    daysAgo: 55,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'buildPieceType',
    scope: 'local',
    kind: 'variable',
    valueType: 'enum',
    values: 'Wall | Floor | Ramp | Roof, default Wall',
    logic:
      'Which of the four base shapes the current placement ghost is; edit sub-options (window, door, stair) apply on top of this base. Edge case: switching type mid-placement, before confirming, is free — cost is only charged on confirm, matching [[buildMaterialCost]].',
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_BuildComponent::PieceType',
    relatedTitles: ['buildMaterialCost'],
    daysAgo: 55,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'rebootCardActive',
    scope: 'scene',
    kind: 'switch',
    valueType: 'bool',
    values: 'false by default',
    logic:
      "True while an eliminated player's reboot card is live on the map, waiting for a teammate to grab it and deliver it to a reboot van. Edge case: this is the note at the center of the current build/design gap — see [[rebootCardExpiresAt]] for the actual divergence.",
    tags: ['status/implemented', 'system/building'],
    extras: '',
    engineRef: 'BP_RebootCard::bActive',
    relatedTitles: ['rebootCardExpiresAt'],
    daysAgo: 12,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'rebootCardExpiresAt',
    scope: 'scene',
    kind: 'variable',
    valueType: 'float',
    values: 'Set on drop as a timestamp; no expiry currently enforced in build',
    logic:
      "Design calls for a reboot card to expire 90 seconds after it drops, forcing a real decision about detouring for a teammate versus rotating with the storm — see the decision log entry that supersedes the old instant-reboot rule. Edge case, and this is the real one: the build never checks this timestamp at all right now, so cards sit live indefinitely; that's exactly the divergence the Squad Revive & Reboot Van feature card flags as `in-build-diverged`.",
    tags: ['status/diverged', 'system/building'],
    extras: 'Tracked against the decision "Reboot van revives one squad member at a time" — build has not caught up yet.',
    engineRef: 'BP_RebootCard::ExpiresAt',
    relatedTitles: ['rebootCardActive'],
    daysAgo: 12,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'squadDownedCount',
    scope: 'save',
    kind: 'variable',
    valueType: 'int',
    values: '0–3, default 0',
    logic:
      "How many of a squad's teammates are currently Downed or Eliminated, read by the HUD's squad status strip. Edge case: does not distinguish Downed from Eliminated in this raw count — [[playerReviveState]] is the one source of truth for which state each teammate is actually in.",
    tags: ['status/implemented', 'system/player'],
    extras: '',
    engineRef: 'BP_SquadState::DownedCount',
    relatedTitles: ['playerReviveState'],
    daysAgo: 12,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'pingActiveMarker',
    scope: 'scene',
    kind: 'variable',
    valueType: 'ref',
    values: 'null by default; ref to a world-space marker while active',
    logic:
      "The shared marker a ping drops for the whole squad to see — loot, enemy, rotation target — decaying after a few seconds unless refreshed. Edge case: pinging while [[pingCooldownSeconds]] is still counting down queues nothing — the input is simply dropped, not buffered.",
    tags: ['status/wip', 'system/building'],
    extras: '',
    engineRef: 'BP_PingComponent::ActiveMarker',
    relatedTitles: ['pingCooldownSeconds'],
    daysAgo: 20,
  },
  {
    folderPath: SYSTEM_AND_CORE,
    title: 'pingCooldownSeconds',
    scope: 'global',
    kind: 'constant',
    valueType: 'float',
    values: '0.4s between pings',
    logic:
      "Prevents ping-spam from flooding a squad's minimap. Edge case: enemy pings (spotting another squad) bypass this cooldown entirely — a genuinely time-sensitive callout shouldn't queue behind the general-purpose cooldown.",
    tags: ['status/wip', 'system/building'],
    extras: '',
    engineRef: 'BP_PingComponent::CooldownSeconds',
    relatedTitles: ['pingActiveMarker'],
    daysAgo: 20,
  },

  // ----------------------------------------------------------------- NPC
  {
    folderPath: NPC,
    title: 'matchmakingBotFillThreshold',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: 'Below 40 players in queue after a 90s wait, fill remaining slots with bots',
    logic:
      'Keeps off-peak lobbies from taking too long to fill; feeds the Bot-Fill Matchmaking feature card. Edge case: bots never fill a ranked-mode lobby regardless of queue time — see the scope matrix, ranked is real-player-only.',
    tags: ['status/wip', 'system/ai'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 6,
  },
  {
    folderPath: NPC,
    title: 'botAimAssistLevel',
    scope: 'local',
    kind: 'variable',
    valueType: 'float',
    values: '0.0–1.0, tuned per difficulty tier, default 0.3',
    logic:
      "How forgiving a bot's aim cone is; scales down as a bot survives longer into a match to avoid late-game bots feeling unbeatable. Edge case: intentionally never reaches 1.0 — a perfectly-aiming bot was cut early in prototyping, it read as unfair rather than challenging.",
    tags: ['status/wip', 'system/ai'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 6,
  },
  {
    folderPath: NPC,
    title: 'botTargetPriority',
    scope: 'local',
    kind: 'variable',
    valueType: 'enum',
    values: 'Nearest | LowestHealth | LastDamagedBy, default Nearest',
    logic:
      'Which rule a bot uses to pick its current target among visible players. Edge case: switches to LastDamagedBy for 3 seconds after taking any damage, overriding whatever the default was — bots that never "notice" being shot at read as obviously fake.',
    tags: ['status/wip', 'system/ai'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 6,
  },

  // ---------------------------------------------------------------- WORLD
  {
    folderPath: WORLD,
    title: 'stormRadiusCurrent',
    scope: 'session',
    kind: 'variable',
    valueType: 'float',
    values: 'Meters, starts at full map radius, shrinks each phase',
    logic:
      "The live radius of the safe zone, read every frame by the HUD's storm-distance indicator. Edge case: never shrinks mid-phase, only jumps to its new value the instant a phase transition completes — a smoothly animating radius was tried and made edge-of-circle position calls feel inconsistent.",
    tags: ['status/wip', 'system/storm'],
    extras: '',
    engineRef: 'BP_StormManager::RadiusCurrent',
    relatedTitles: ['stormPhaseIndex'],
    daysAgo: 40,
  },
  {
    folderPath: WORLD,
    title: 'stormDamagePerTick',
    scope: 'global',
    kind: 'variable',
    valueType: 'float',
    values: '2 HP/s phase 1, scaling up to 10 HP/s by the final phase',
    logic:
      'Damage applied once per second to any player outside [[stormRadiusCurrent]]. Edge case: this damage ignores [[playerShield]] entirely and hits health directly — storm damage was never meant to be soaked by a shield potion.',
    tags: ['status/wip', 'system/storm'],
    extras: '',
    engineRef: 'BP_StormManager::DamagePerTick',
    relatedTitles: ['stormRadiusCurrent'],
    daysAgo: 40,
  },
  {
    folderPath: WORLD,
    title: 'stormPhaseIndex',
    scope: 'session',
    kind: 'variable',
    valueType: 'int',
    values: '0–8, default 0, increments once per circle close',
    logic:
      "Which numbered phase the match is currently in, driving both [[stormRadiusCurrent]]'s next target and [[stormDamagePerTick]]'s scaling. Edge case: clamps at 8 rather than continuing to climb in an unusually long match — the final-phase values are the hard ceiling, not a formula that keeps extrapolating.",
    tags: ['status/wip', 'system/storm'],
    extras: '',
    engineRef: 'BP_StormManager::PhaseIndex',
    relatedTitles: ['stormRadiusCurrent', 'stormDamagePerTick'],
    daysAgo: 40,
  },
  {
    folderPath: WORLD,
    title: 'stormNextCloseTimer',
    scope: 'session',
    kind: 'variable',
    valueType: 'float',
    values: "Seconds remaining until the current phase ends, counts down from each phase's fixed duration",
    logic:
      "Feeds the countdown ring on the storm HUD element. Edge case: keeps counting down even while a player is dead-center safe — this is a match-wide clock, not a per-player warning, a common confusion for new engineers reading this note.",
    tags: ['status/wip', 'system/storm'],
    extras: '',
    engineRef: 'BP_StormManager::NextCloseTimer',
    relatedTitles: [],
    daysAgo: 40,
  },

  // -------------------------------------------------------------- ECONOMY
  {
    folderPath: ECONOMY,
    title: 'lootPoolWeights',
    scope: 'global',
    kind: 'variable',
    valueType: 'ref',
    values: "Points at the active season's weighted drop table",
    logic:
      'Determines spawn odds per [[weaponRarityTier]] across floor loot, chests, and supply drops. Edge case: supply drops read from a separate, richer-odds table than ground loot — reusing this note\'s weights for supply drops was an actual production bug once, flagged here so it doesn\'t happen again.',
    tags: ['status/implemented', 'system/economy'],
    extras: '',
    engineRef: null,
    relatedTitles: ['weaponRarityTier'],
    daysAgo: 45,
  },
  {
    folderPath: ECONOMY,
    title: 'weaponRarityTier',
    scope: 'local',
    kind: 'variable',
    valueType: 'enum',
    values: 'Common | Uncommon | Rare | Epic | Legendary',
    logic:
      'Drives both the color-coded pickup outline and the damage/reload-speed curve for a given weapon instance. Edge case: the same weapon model can roll any tier — rarity is a property of the drop, not the weapon type, which is why two players can carry the same gun with very different stats.',
    tags: ['status/implemented', 'system/economy'],
    extras: '',
    engineRef: null,
    relatedTitles: ['lootPoolWeights'],
    daysAgo: 45,
  },
  {
    folderPath: ECONOMY,
    title: 'vaultedWeaponList',
    scope: 'global',
    kind: 'variable',
    valueType: 'ref',
    values: "Points at the current season's list of weapons pulled from the loot pool",
    logic:
      "Vaulted weapons stay in the game files but drop with zero weight in [[lootPoolWeights]] — feeds the Seasonal Vaulted Weapon Rotation feature card, still `designed`. Edge case: a vaulted weapon already in a player's inventory when a season rotates is NOT retroactively removed — only future drops are affected.",
    tags: ['status/wip', 'system/economy'],
    extras: 'Design-only for now — Seasonal Vaulted Weapon Rotation is still `designed`, not `in-build`.',
    engineRef: null,
    relatedTitles: ['lootPoolWeights'],
    daysAgo: 18,
  },

  // ------------------------------------------------------- INVENTORY ETC.
  {
    folderPath: INVENTORY,
    title: 'inventorySlotCount',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: '5 weapon/item slots, fixed for v1',
    logic:
      'Hard cap on carried weapons and consumables; materials are tracked separately by [[playerMaterialWood]] and its siblings and never consume a slot. Edge case: picking up an item while full prompts a swap rather than blocking the pickup — the prompt shows the new item\'s stats side-by-side with the full inventory before committing.',
    tags: ['status/implemented', 'system/inventory'],
    extras: '',
    engineRef: 'BP_PlayerState::InventorySlotCount',
    relatedTitles: ['playerMaterialWood'],
    daysAgo: 50,
  },
  {
    folderPath: INVENTORY,
    title: 'harvestYieldRate',
    scope: 'global',
    kind: 'variable',
    valueType: 'float',
    values: '~12 material per hit, environment-dependent (trees > cars > walls)',
    logic:
      'How much material a swing yields, feeding [[playerMaterialWood]] and its siblings depending on what is harvested. Edge case: harvesting the same object past its "depleted" visual state is blocked at the interact layer — no infinite-farm exploit on a single tree.',
    tags: ['status/implemented', 'system/inventory'],
    extras: '',
    engineRef: 'BP_HarvestComponent::YieldRate',
    relatedTitles: ['playerMaterialWood'],
    daysAgo: 55,
  },
  {
    folderPath: INVENTORY,
    title: 'consumableStackLimit',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: 'Shields 2 / Med kits 3 / Minis 6, per consumable type',
    logic:
      'Max quantity of one consumable type in a single inventory slot. Edge case: picking up a stack-limited item while already at cap for that type auto-drops the overflow at the player\'s feet rather than blocking the pickup outright — matches the swap-prompt behaviour in [[inventorySlotCount]] instead of contradicting it.',
    tags: ['status/implemented', 'system/inventory'],
    extras: '',
    engineRef: null,
    relatedTitles: ['inventorySlotCount'],
    daysAgo: 50,
  },

  // ----------------------------------------------------------- ACTIVITIES
  {
    folderPath: ACTIVITIES,
    title: 'seasonNumber',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: '1, increments on each content season',
    logic:
      'Gates [[vaultedWeaponList]] and the active Battle Pass track together, so a season boundary always moves both at once. Edge case: a match that starts in the final minute of a season and ends after rollover still awards XP against the OLD season\'s pass — season transitions never retroactively invalidate an in-progress match.',
    tags: ['status/wip', 'system/activities'],
    extras: '',
    engineRef: null,
    relatedTitles: ['vaultedWeaponList'],
    daysAgo: 18,
  },
  {
    folderPath: ACTIVITIES,
    title: 'weeklyChallengeProgress',
    scope: 'save',
    kind: 'variable',
    valueType: 'int',
    values: '0 default, resets each Monday per challenge',
    logic:
      "Tracks progress toward the current week's challenge set, which feeds bonus Battle Pass XP. Edge case: progress made in a match that's still running at the weekly reset boundary is credited to the OLD week — same don't-retroactively-invalidate rule as [[seasonNumber]].",
    tags: ['status/wip', 'system/activities'],
    extras: '',
    engineRef: null,
    relatedTitles: ['seasonNumber'],
    daysAgo: 14,
  },
  {
    folderPath: ACTIVITIES,
    title: 'dailyQuestSlotCount',
    scope: 'global',
    kind: 'constant',
    valueType: 'int',
    values: '3 active daily quests at a time',
    logic:
      'How many daily quests a player can have queued; completing one immediately offers a replacement. Edge case: quests never expire mid-match even if their day rolls over while the player is in a lobby — expiry is only checked at the main menu, never during active play.',
    tags: ['status/wip', 'system/activities'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 14,
  },

  // ---------------------------------------------------------------- AUDIO
  {
    folderPath: AUDIO,
    title: 'stormTensionScore',
    scope: 'session',
    kind: 'formula',
    valueType: 'int',
    values: '0–100, derived',
    logic:
      '`(9 - stormPhaseRemaining)*8 + (squadAlive<3 ? 20:0) + (playerHealthPct<30 ? 15:0)`, feeding [[musicLayerIntensity]]. Edge case: the result is clamped to 0–100 only after the formula runs, so a raw debug log of the score can still show a value above 100 — harmless in practice, but has confused a level designer reviewing logs before.',
    tags: ['status/wip', 'system/audio'],
    extras: '',
    engineRef: null,
    relatedTitles: ['musicLayerIntensity'],
    daysAgo: 9,
  },
  {
    folderPath: AUDIO,
    title: 'musicLayerIntensity',
    scope: 'session',
    kind: 'variable',
    valueType: 'float',
    values: '0.0–1.0, default 0.0',
    logic:
      'Crossfades combat music layers, driven by [[stormTensionScore]]. Edge case: does not react to being Downed at all right now — design wants a distinct, quieter "downed" music state that hasn\'t been built yet, tracked here rather than left as a silent gap.',
    tags: ['status/wip', 'system/audio'],
    extras: '',
    engineRef: null,
    relatedTitles: ['stormTensionScore'],
    daysAgo: 9,
  },
  {
    folderPath: AUDIO,
    title: 'footstepAudioRadius',
    scope: 'global',
    kind: 'variable',
    valueType: 'float',
    values: '12m default, 18m while sprinting, halved while crouched',
    logic:
      "How far a player's footsteps are audible to other players, a core information-warfare tool in a match with no minimap enemy dots. Edge case: building material affects nothing here — footsteps sound identical on wood, stone, and metal floors today, a known simplification flagged for a later audio pass.",
    tags: ['status/needs-review', 'system/audio'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 9,
  },

  // ---------------------------------------------------------------- INPUT
  {
    folderPath: INPUT,
    title: 'mantleLedgeCheckRange',
    scope: 'global',
    kind: 'constant',
    valueType: 'float',
    values: '0.9m forward check for a mantle-able ledge',
    logic:
      'How far ahead of the player the mantle system probes for a valid ledge on jump input. Edge case: does not check for a ledge on a player-built [[buildPieceType]] Floor piece placed less than one frame ago — mantling onto a piece the instant it is placed can silently fail, a known timing edge case.',
    tags: ['status/wip', 'system/input'],
    extras: '',
    engineRef: null,
    relatedTitles: ['buildPieceType'],
    daysAgo: 22,
  },
  {
    folderPath: INPUT,
    title: 'slideSpeedMultiplier',
    scope: 'global',
    kind: 'variable',
    valueType: 'float',
    values: '1.35x base movement speed while sliding',
    logic:
      "Speed boost applied during a slide, decaying back to 1.0x over the slide's duration rather than cutting off instantly. Edge case: canceling a slide early (by jumping) keeps whatever multiplier was active at the moment of cancel — sliding briefly then jumping is a legitimate, if minor, speed tech.",
    tags: ['status/wip', 'system/input'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 22,
  },
  {
    folderPath: INPUT,
    title: 'editSensitivityCurve',
    scope: 'global',
    kind: 'variable',
    valueType: 'ref',
    values: 'Points at the active input-curve asset for build-edit aim',
    logic:
      'A separate, generally lower sensitivity curve than combat aim, since edit placement rewards precision over speed. Edge case: switching from combat aim to edit aim mid-input (very fast weapon-to-build swaps) can read one frame of the wrong curve — cosmetic today, not a fairness issue, but flagged.',
    tags: ['status/needs-review', 'system/input'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 7,
  },

  // --------------------------------------------------------------- VISUAL
  {
    folderPath: VISUAL,
    title: 'eliminationFeedEntry',
    scope: 'session',
    kind: 'event',
    valueType: 'string',
    values: 'One entry per elimination: {eliminator, eliminated, weapon}',
    logic:
      'Feeds the top-left elimination feed UI, most recent five entries visible. Edge case: a storm-damage or fall-damage elimination has no `eliminator` — the feed renders "was eliminated by the storm" / "fell" instead of blanking the attacker field.',
    tags: ['status/implemented', 'system/visual'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 50,
  },
  {
    folderPath: VISUAL,
    title: 'spectateCamTargetIndex',
    scope: 'session',
    kind: 'variable',
    valueType: 'int',
    values: "Index into the player's current squad, cycles on input after elimination",
    logic:
      "Which surviving teammate the eliminated player's spectate camera is currently following. Edge case: if the whole squad is eliminated, this falls back to following the match's current leading squad rather than freezing on a black screen.",
    tags: ['status/implemented', 'system/visual'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 50,
  },
  {
    folderPath: VISUAL,
    title: 'killCamDelaySeconds',
    scope: 'global',
    kind: 'constant',
    valueType: 'float',
    values: '2.5s replay shown before the elimination feed permanently logs the kill',
    logic:
      'Brief kill-cam replay shown to the eliminated player only, never broadcast to the eliminator or spectators. Edge case: skippable with any input — the delay is a default pacing choice, not a forced-viewing mechanic.',
    tags: ['status/implemented', 'system/visual'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 50,
  },
  {
    folderPath: VISUAL,
    title: 'buildGhostPlacementColor',
    scope: 'local',
    kind: 'variable',
    valueType: 'enum',
    values: 'Green (valid) | Red (invalid) | Amber (valid but low material), default Green',
    logic:
      'The placement-preview tint shown before a build piece is confirmed, reusing [[buildMaterialCost]] to decide the Amber case. Edge case: colorblind-safe mode swaps the red/green pair for a blue/orange pair rather than relying on hue alone — see the accessibility note in UX/UI.',
    tags: ['status/needs-review', 'system/visual'],
    extras: '',
    engineRef: null,
    relatedTitles: ['buildMaterialCost'],
    daysAgo: 11,
  },

  // ---------------------------------------------------------- SAVE & LOAD
  {
    folderPath: SAVE_AND_LOAD,
    title: 'matchSettingsProfile',
    scope: 'global',
    kind: 'variable',
    valueType: 'ref',
    values: "Points at the player's saved video/audio/gameplay settings bundle",
    logic:
      'Loaded once at boot and applied before the main menu renders, so a returning player never sees default settings flash first. Edge case: a corrupted settings file falls back to defaults for that session only — it does not overwrite the saved file, so a bad read doesn\'t turn into permanent data loss.',
    tags: ['status/implemented', 'system/save'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 60,
  },
  {
    folderPath: SAVE_AND_LOAD,
    title: 'controllerBindingPreset',
    scope: 'global',
    kind: 'variable',
    valueType: 'ref',
    values: 'Points at the active control-scheme prompt asset — keyboard, pad, or touch glyphs',
    logic:
      'Resolved once per input-device change and cached for the HUD to read cheaply. Edge case: swapping device mid-match (touching the keyboard while on a pad) takes a couple of frames to re-resolve, so prompts can briefly show the wrong glyph — a known, minor bug.',
    tags: ['status/needs-review', 'system/save'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 5,
  },
  {
    folderPath: SAVE_AND_LOAD,
    title: 'crossplayOptOut',
    scope: 'save',
    kind: 'switch',
    valueType: 'bool',
    values: 'false by default',
    logic:
      'Lets a player opt out of cross-platform lobbies even though cross-play itself is out of v1 scope — see the decision log — kept here so the setting exists and is a no-op until cross-play ships, rather than needing a later save-schema change. Edge case: reads as permanently true-equivalent today since there is no cross-play to opt out of; the field exists ahead of the feature deliberately.',
    tags: ['status/wip', 'system/save'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 5,
  },

  // ----------------------------------------------------- MARKETING/HEADLINES
  {
    folderPath: HEADLINES,
    title: 'taglineLastSquadStanding',
    scope: 'global',
    kind: 'constant',
    valueType: 'string',
    values: 'Working headline, not final copy',
    logic:
      'Candidate store-page tagline: "Build the wall. Win the storm." Leads with the mechanic, then the stakes — matches pillar *building is combat, not a menu* by putting the verb first.',
    tags: ['status/wip', 'system/marketing'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 16,
  },
  {
    folderPath: HEADLINES,
    title: 'keyArtHookStormLine',
    scope: 'global',
    kind: 'constant',
    valueType: 'string',
    values: 'Working hook line, not final copy',
    logic:
      'Short store-page hook: "Sixty drop in. One storm decides who\'s left." Sells the format and the theme in one line, ahead of any mechanic explanation.',
    tags: ['status/wip', 'system/marketing'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 16,
  },

  // ---------------------------------------------------- ORGANIZATION/MESSY
  {
    folderPath: MESSY,
    title: 'untitledBuildIdeaScratch',
    scope: 'local',
    kind: 'variable',
    valueType: 'string',
    values: 'n/a — not a real variable yet',
    logic:
      'Scratch note from an early brainstorm: what if a fully-built structure could be "packed up" and redeployed elsewhere for a material refund? Never scoped, never assigned an owner. Leaving it here instead of deleting it in case it\'s worth revisiting after Beta.',
    tags: ['status/wip'],
    extras: '',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 100,
  },
  {
    folderPath: MESSY,
    title: 'dupeRebootNoteScratch',
    scope: 'local',
    kind: 'variable',
    valueType: 'string',
    values: 'n/a — superseded draft',
    logic:
      'Early, rougher draft of [[rebootCardActive]] written before the expiring-card design was finalized. Kept for history; the real note is the one to edit going forward.',
    tags: ['status/deprecated'],
    extras: '',
    engineRef: null,
    relatedTitles: ['rebootCardActive'],
    daysAgo: 90,
  },

  // ------------------------------------------------ ORGANIZATION/TEMPLATES
  {
    folderPath: TEMPLATES,
    title: 'Template - Game Logic',
    scope: 'global',
    kind: 'variable',
    valueType: 'string',
    values: 'Domain, default value, and bounds go here.',
    logic:
      "This is the template every new logic note starts from — edit the fields below, don't edit this description. **Scope**: global / scene / session / save / local. **Type**: Variable, Switch, Event, Formula, State Machine, or Constant. **Values**: the domain, default, and bounds. **Logic**: rules and at least one edge case — a note without an edge case is a note nobody has stress-tested yet. **Tags**: at least one `type/`, one `status/`, and one `system/` tag. Naming convention: camelCase, e.g. `playerHealth`, `stormPhaseIndex`, `weaponRarityTier`, `matchSettingsProfile`.",
    tags: ['status/verified'],
    extras: 'Edit this file to change what every future note starts from.',
    engineRef: null,
    relatedTitles: [],
    daysAgo: 148,
  },

  // ---------------------------------------------------- ORGANIZATION/TESTS
  {
    folderPath: TESTS,
    title: 'qaRebootEdgeCaseChecklist',
    scope: 'global',
    kind: 'event',
    valueType: 'string',
    values: 'n/a — checklist, not a variable',
    logic:
      "QA pass checklist for reboot edge cases: does [[rebootCardActive]] correctly clear when a teammate is fully eliminated instead of downed; does [[squadDownedCount]] stay in sync with playerReviveState across all three teammates; does the card correctly NOT expire yet, since [[rebootCardExpiresAt]] isn't enforced in build. Edge case of the checklist itself: only run against PC so far, not console — flagged so it isn't mistaken for full coverage.",
    tags: ['status/wip'],
    extras: '',
    engineRef: null,
    relatedTitles: ['rebootCardActive', 'squadDownedCount', 'rebootCardExpiresAt'],
    daysAgo: 4,
  },
  {
    folderPath: TESTS,
    title: 'qaStormClampTestPlan',
    scope: 'global',
    kind: 'event',
    valueType: 'string',
    values: 'n/a — test plan, not a variable',
    logic:
      'Test plan for [[stormPhaseIndex]]\'s clamp at phase 8: force a match to run long via a debug command, confirm [[stormDamagePerTick]] and [[stormRadiusCurrent]] hold their final-phase values rather than extrapolating past them. Edge case to specifically cover: a squad that is the sole survivor before phase 8 even triggers — the clamp test needs a debug-forced long match, not a naturally-occurring one.',
    tags: ['status/wip'],
    extras: '',
    engineRef: null,
    relatedTitles: ['stormPhaseIndex', 'stormDamagePerTick', 'stormRadiusCurrent'],
    daysAgo: 4,
  },
]

/** Resolves seed specs into full `LogicNote[]`, with `outbound` set from
 * `relatedTitles` and `inbound` computed by inverting that graph — never
 * hand-authored, so backlinks can't drift out of sync. */
export function buildLogicNotes(): LogicNote[] {
  const idByTitle = new Map(NOTE_SEEDS.map((seed) => [seed.title, noteId(seed.title)]))

  const notes: LogicNote[] = NOTE_SEEDS.map((seed) => {
    const outbound = seed.relatedTitles.map((title) => {
      const id = idByTitle.get(title)
      if (!id) throw new Error(`Seed note "${seed.title}" links to unknown title "${title}"`)
      return id
    })
    const createdAt = daysBeforeAnchor(seed.daysAgo + 30)
    const updatedAt = daysBeforeAnchor(seed.daysAgo)
    return {
      id: noteId(seed.title),
      projectId: PROJECT_ID,
      folderPath: seed.folderPath,
      title: seed.title,
      scope: seed.scope,
      kind: seed.kind,
      valueType: seed.valueType,
      values: seed.values,
      logic: seed.logic,
      inbound: [],
      outbound,
      tags: [`type/${seed.kind}`, ...seed.tags],
      extras: seed.extras,
      engineRef: seed.engineRef,
      createdAt,
      updatedAt,
      updatedBy: SEED_UPDATED_BY,
    }
  })

  const inboundByNoteId = new Map<string, string[]>()
  for (const note of notes) {
    for (const targetId of note.outbound) {
      const list = inboundByNoteId.get(targetId) ?? []
      list.push(note.id)
      inboundByNoteId.set(targetId, list)
    }
  }
  for (const note of notes) {
    note.inbound = inboundByNoteId.get(note.id) ?? []
  }

  return notes
}
