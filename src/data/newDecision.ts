import type { Repository } from './repository/types'
import type { Decision } from './types/entities'

export async function createDecision(
  repo: Repository,
  params: { projectId: string; title: string; createdBy?: string },
): Promise<Decision> {
  return repo.decisions.create({
    projectId: params.projectId,
    title: params.title,
    date: new Date().toISOString().slice(0, 10),
    decidedBy: [],
    context: '',
    choice: '',
    alternatives: '',
    consequences: '',
    supersedes: null,
    affects: [],
    syncState: 'unknown',
    updatedBy: params.createdBy ?? 'you',
  })
}
