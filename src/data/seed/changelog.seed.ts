import type { ChangeEntry, ChangeKind, ChangeTargetType } from '../types/entities'
import { versionBumpForTarget } from '../../lib/versioning'
import { COLLABORATOR_IDS } from './collaborators.seed'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { DECISION_IDS } from './decisions.seed'
import { FEATURE_IDS } from './featureCards.seed'
import { mkId, noteId, sectionId, tagId } from './ids'
import { LOOP_IDS } from './loop.seed'
import { MILESTONE_IDS } from './milestones.seed'
import { PILLAR_IDS } from './pillarsNonGoals.seed'

interface ChangeSeed {
  daysAgo: number
  by: string
  kind: ChangeKind
  type: ChangeTargetType
  id: string
  label: string
  diffSummary: string
}

const CHANGE_SEEDS: ChangeSeed[] = [
  { daysAgo: 145, by: COLLABORATOR_IDS.deshawn, kind: 'edited', type: 'feature', id: FEATURE_IDS.editUnderFireBuilding, label: 'Edit-Under-Fire Building', diffSummary: 'Tuned the build-edit window after the first internal playtest.' },
  { daysAgo: 142, by: COLLABORATOR_IDS.priya, kind: 'status-changed', type: 'feature', id: FEATURE_IDS.crossPlayMatchmaking, label: 'Cross-Play Matchmaking', diffSummary: 'Status moved from `designed` to `cut`.' },
  { daysAgo: 130, by: COLLABORATOR_IDS.malik, kind: 'edited', type: 'section', id: sectionId('level'), label: 'Level / World Design', diffSummary: 'Added the annotated map for Dropzone Island.' },
  { daysAgo: 125, by: COLLABORATOR_IDS.ines, kind: 'edited', type: 'section', id: sectionId('art'), label: 'Art Direction', diffSummary: 'Uploaded the storm-front environment concept pass.' },
  { daysAgo: 118, by: COLLABORATOR_IDS.deshawn, kind: 'created', type: 'note', id: noteId('lootPoolWeights'), label: 'lootPoolWeights', diffSummary: 'New logic note for the weighted drop table.' },
  { daysAgo: 112, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'milestone', id: MILESTONE_IDS.beta, label: 'Beta (Content Complete)', diffSummary: 'Removed cross-play references from the Beta exit criteria.' },
  { daysAgo: 105, by: COLLABORATOR_IDS.sofia, kind: 'created', type: 'note', id: noteId('footstepAudioRadius'), label: 'footstepAudioRadius', diffSummary: 'First pass on positional footstep audio.' },
  { daysAgo: 100, by: COLLABORATOR_IDS.priya, kind: 'created', type: 'decision', id: DECISION_IDS.rebootInstantWholeSquad, label: 'Reboot van revives the whole squad instantly on interact', diffSummary: 'Initial reboot design, logged for the record.' },
  { daysAgo: 98, by: COLLABORATOR_IDS.deshawn, kind: 'edited', type: 'note', id: noteId('rebootCardActive'), label: 'rebootCardActive', diffSummary: 'Documented the interact-to-revive flow.' },
  { daysAgo: 92, by: COLLABORATOR_IDS.malik, kind: 'edited', type: 'loop', id: LOOP_IDS.session, label: 'Match Session Loop', diffSummary: 'Renamed the lobby-entry node label for clarity.' },
  { daysAgo: 88, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'pillar', id: PILLAR_IDS.stormIsTheFinalBoss, label: 'The storm is the real final boss', diffSummary: 'Clarified the rationale after a team disagreement on late-game squad density.' },
  { daysAgo: 82, by: COLLABORATOR_IDS.deshawn, kind: 'status-changed', type: 'feature', id: FEATURE_IDS.weaponRarityLootPool, label: 'Weapon Rarity & Loot Pool', diffSummary: 'Status moved from `designed` to `in-build`.' },
  { daysAgo: 76, by: COLLABORATOR_IDS.ines, kind: 'edited', type: 'tag', id: tagId('system/visual'), label: 'system/visual', diffSummary: 'Re-tagged three notes from system/building to system/visual after a folder cleanup.' },
  { daysAgo: 70, by: COLLABORATOR_IDS.deshawn, kind: 'created', type: 'note', id: noteId('spectateCamTargetIndex'), label: 'spectateCamTargetIndex', diffSummary: 'Split spectate camera targeting out from elimination feed logic.' },
  { daysAgo: 65, by: COLLABORATOR_IDS.sofia, kind: 'edited', type: 'note', id: noteId('musicLayerIntensity'), label: 'musicLayerIntensity', diffSummary: 'Documented the still-missing Downed-state music layer as a known gap.' },
  { daysAgo: 60, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'section', id: sectionId('constraints'), label: 'Constraints', diffSummary: 'Locked the platform lineup table after the Switch performance review.' },
  { daysAgo: 55, by: COLLABORATOR_IDS.deshawn, kind: 'edited', type: 'note', id: noteId('stormRadiusCurrent'), label: 'stormRadiusCurrent', diffSummary: 'Flagged the phase-transition pop as a known visual rough edge.' },
  { daysAgo: 50, by: COLLABORATOR_IDS.malik, kind: 'edited', type: 'section', id: sectionId('ui-ux'), label: 'UI / UX', diffSummary: 'Replaced the HUD wireframe with the material-count variant.' },
  { daysAgo: 45, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'note', id: noteId('vaultedWeaponList'), label: 'vaultedWeaponList', diffSummary: 'Documented the already-owned-weapons edge case.' },
  { daysAgo: 42, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'collaborator', id: COLLABORATOR_IDS.sofia, label: 'Sofia', diffSummary: 'Updated discipline label to Audio for consistency with the Systems section.' },
  { daysAgo: 38, by: COLLABORATOR_IDS.deshawn, kind: 'edited', type: 'note', id: noteId('editSensitivityCurve'), label: 'editSensitivityCurve', diffSummary: 'Logged the combat-to-edit-aim curve swap bug.' },
  { daysAgo: 32, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'scope-entry', id: mkId('scope', 'ranked-competitive-mode'), label: 'Ranked competitive mode', diffSummary: 'Linked to playtest evidence instead of leaving it undecided.' },
  { daysAgo: 28, by: COLLABORATOR_IDS.sofia, kind: 'status-changed', type: 'feature', id: FEATURE_IDS.adaptiveStormTensionScore, label: 'Adaptive Storm Tension Score', diffSummary: 'Status set to `idea` after the Audio planning review.' },
  { daysAgo: 22, by: COLLABORATOR_IDS.deshawn, kind: 'edited', type: 'note', id: noteId('rebootCardExpiresAt'), label: 'rebootCardExpiresAt', diffSummary: 'Clarified the intended 90-second expiry window ahead of implementation.' },
  { daysAgo: 18, by: COLLABORATOR_IDS.malik, kind: 'edited', type: 'milestone', id: MILESTONE_IDS.alpha, label: 'Alpha (Feature Complete)', diffSummary: 'Updated exit criteria to call out the Squad Revive divergence explicitly.' },
  { daysAgo: 15, by: COLLABORATOR_IDS.priya, kind: 'created', type: 'feature', id: FEATURE_IDS.botFillMatchmaking, label: 'Bot-Fill Matchmaking', diffSummary: 'New feature card, still at `idea`.' },
  { daysAgo: 12, by: COLLABORATOR_IDS.priya, kind: 'created', type: 'decision', id: DECISION_IDS.rebootPerPlayerTimed, label: 'Reboot van revives one squad member at a time, each on a 90-second card timer', diffSummary: 'Supersedes the instant whole-squad revive decision after Closed Playtest feedback.' },
  { daysAgo: 10, by: COLLABORATOR_IDS.deshawn, kind: 'status-changed', type: 'feature', id: FEATURE_IDS.squadReviveRebootVan, label: 'Squad Revive & Reboot Van', diffSummary: 'Status set to `in-build-diverged` — the build has not caught up to the per-player-timed decision yet.' },
  { daysAgo: 4, by: COLLABORATOR_IDS.ines, kind: 'edited', type: 'section', id: sectionId('art'), label: 'Art Direction', diffSummary: 'Swapped in the key art teaser composition.' },
  { daysAgo: 1, by: COLLABORATOR_IDS.priya, kind: 'edited', type: 'project', id: PROJECT_ID, label: 'Stormline', diffSummary: 'Refreshed the document intro paragraph.' },
]

export function buildChangeEntries(): ChangeEntry[] {
  return CHANGE_SEEDS.map((seed, index) => {
    const at = daysBeforeAnchor(seed.daysAgo)
    return {
      id: mkId('change', String(index + 1).padStart(2, '0')),
      projectId: PROJECT_ID,
      at,
      by: seed.by,
      target: { type: seed.type, id: seed.id, label: seed.label },
      kind: seed.kind,
      diffSummary: seed.diffSummary,
      versionBump: versionBumpForTarget(seed.type),
      createdAt: at,
      updatedAt: at,
      updatedBy: SEED_UPDATED_BY,
    }
  })
}
