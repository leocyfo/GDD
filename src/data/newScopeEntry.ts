import type { Repository } from './repository/types'
import type { ScopeEntry } from './types/entities'

export async function createScopeEntry(
  repo: Repository,
  params: { matrixId: string; item: string; createdBy?: string },
): Promise<ScopeEntry> {
  return repo.scopeEntries.create({
    matrixId: params.matrixId,
    item: params.item,
    verdict: 'undecided',
    decisionId: null,
    evidenceUrl: null,
    updatedBy: params.createdBy ?? 'you',
  })
}
