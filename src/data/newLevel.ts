import type { Repository } from './repository/types'
import type { Level } from './types/entities'

export async function createLevel(
  repo: Repository,
  params: { projectId: string; name: string; nextOrder: number; createdBy?: string },
): Promise<Level> {
  return repo.levels.create({
    projectId: params.projectId,
    name: params.name,
    summary: '',
    uniqueFeatures: '',
    assetId: null,
    status: 'concept',
    order: params.nextOrder,
    updatedBy: params.createdBy ?? 'you',
  })
}
