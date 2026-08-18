import { SCOPE_MATRIX_ID } from '../scopeMatrixId'
import type { ScopeEntry } from '../types/entities'
import { SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'
import { DECISION_IDS } from './decisions.seed'
import { mkId } from './ids'

export function buildScopeEntries(): ScopeEntry[] {
  const base = { matrixId: SCOPE_MATRIX_ID, updatedBy: SEED_UPDATED_BY }
  const createdAt = daysBeforeAnchor(140)

  const rows: Array<Omit<ScopeEntry, 'id' | 'matrixId' | 'updatedBy' | 'createdAt' | 'updatedAt'> & { slug: string; daysAgo: number }> = [
    { slug: 'building-in-combat', item: 'Real-time building in combat', verdict: 'in', decisionId: DECISION_IDS.coreBuildingMechanic, evidenceUrl: null, daysAgo: 148 },
    { slug: 'material-harvesting', item: 'Material harvesting economy', verdict: 'in', decisionId: DECISION_IDS.coreBuildingMechanic, evidenceUrl: null, daysAgo: 148 },
    { slug: 'squad-revive-reboot-van', item: 'Squad revive via reboot van', verdict: 'in', decisionId: DECISION_IDS.rebootPerPlayerTimed, evidenceUrl: null, daysAgo: 12 },
    { slug: 'cross-play-matchmaking', item: 'Cross-play matchmaking', verdict: 'out', decisionId: DECISION_IDS.noCrossPlayLaunch, evidenceUrl: null, daysAgo: 120 },
    { slug: 'cross-platform-parties', item: 'Cross-platform party invites', verdict: 'out', decisionId: DECISION_IDS.noCrossPlayLaunch, evidenceUrl: null, daysAgo: 120 },
    { slug: 'seasonal-vaulted-weapon-rotation', item: 'Seasonal vaulted weapon rotation', verdict: 'stretch', decisionId: DECISION_IDS.stretchGoalsVaultBotFill, evidenceUrl: null, daysAgo: 15 },
    { slug: 'bot-fill-practice-lobbies', item: 'Bot-fill for slow practice lobbies', verdict: 'stretch', decisionId: DECISION_IDS.stretchGoalsVaultBotFill, evidenceUrl: null, daysAgo: 15 },
    { slug: 'proximity-voice-chat', item: 'Open-world proximity voice chat', verdict: 'out', decisionId: DECISION_IDS.noProximityVoiceChat, evidenceUrl: null, daysAgo: 90 },
    { slug: 'platform-pc', item: 'PC platform', verdict: 'in', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 148 },
    { slug: 'platform-ps5', item: 'PS5 platform', verdict: 'in', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 148 },
    { slug: 'platform-xbox', item: 'Xbox Series X|S platform', verdict: 'in', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 148 },
    { slug: 'platform-mobile', item: 'Mobile platform (iOS/Android)', verdict: 'stretch', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 55 },
    { slug: 'platform-switch', item: 'Nintendo Switch platform', verdict: 'out', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 148 },
    { slug: 'achievements-trophies', item: 'Achievements / trophies', verdict: 'in', decisionId: DECISION_IDS.platformLineup, evidenceUrl: null, daysAgo: 148 },
    { slug: 'ranked-competitive-mode', item: 'Ranked competitive mode', verdict: 'in', decisionId: null, evidenceUrl: 'docs/playtest-2026-07-ranked-signal.md', daysAgo: 25 },
    { slug: 'duos-mode', item: 'Duos mode', verdict: 'in', decisionId: null, evidenceUrl: 'docs/playtest-2026-06-duos.md', daysAgo: 45 },
    { slug: 'solo-queue-mode', item: 'Solo queue mode', verdict: 'in', decisionId: null, evidenceUrl: 'docs/matchmaking-solo-queue-analysis.md', daysAgo: 45 },
    { slug: 'clan-tags', item: 'Clan tags', verdict: 'undecided', decisionId: null, evidenceUrl: null, daysAgo: 10 },
    { slug: 'in-match-item-trading', item: 'In-match item trading between teammates', verdict: 'undecided', decisionId: null, evidenceUrl: null, daysAgo: 10 },
    { slug: 'spectator-broadcast-delay-tools', item: 'Spectator broadcast delay tools', verdict: 'undecided', decisionId: null, evidenceUrl: 'docs/esports-team-request-2026-07.md', daysAgo: 10 },
  ]

  return rows.map((row) => ({
    id: mkId('scope', row.slug),
    matrixId: base.matrixId,
    item: row.item,
    verdict: row.verdict,
    decisionId: row.decisionId,
    evidenceUrl: row.evidenceUrl,
    createdAt,
    updatedAt: daysBeforeAnchor(row.daysAgo),
    updatedBy: SEED_UPDATED_BY,
  }))
}
