import type { Repository } from './repository/types'
import type { Milestone } from './types/entities'

export async function createMilestone(
  repo: Repository,
  params: { projectId: string; name: string; createdBy?: string },
): Promise<Milestone> {
  return repo.milestones.create({
    projectId: params.projectId,
    name: params.name,
    date: new Date().toISOString().slice(0, 10),
    state: 'upcoming',
    exitCriteria: [],
    linkedFeatureIds: [],
    updatedBy: params.createdBy ?? 'you',
  })
}
