import type { Repository } from './repository/types'
import type { AssetKind, ProductionAsset } from './types/entities'

export async function createProductionAsset(
  repo: Repository,
  params: { projectId: string; name: string; kind: AssetKind; createdBy?: string },
): Promise<ProductionAsset> {
  return repo.productionAssets.create({
    projectId: params.projectId,
    name: params.name,
    kind: params.kind,
    purpose: '',
    status: 'todo',
    notes: '',
    assetId: null,
    updatedBy: params.createdBy ?? 'you',
  })
}
