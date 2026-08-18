import type { Repository } from './repository/types'
import type { FeatureCard } from './types/entities'

export async function createFeatureCard(
  repo: Repository,
  params: { projectId: string; name: string; createdBy?: string },
): Promise<FeatureCard> {
  return repo.featureCards.create({
    projectId: params.projectId,
    name: params.name,
    playerPromise: '',
    summary: '',
    logic: '',
    dependencies: [],
    logicNoteIds: [],
    status: 'idea',
    owner: '',
    risk: 'low',
    updatedBy: params.createdBy ?? 'you',
  })
}
