import type { Repository } from './repository/types'
import type { Loop } from './types/entities'

/** Same "sensible defaults, not a blank shell" idea as `createMilestone` —
 * a brand-new loop starts cyclic (the common case: most gameplay loops
 * repeat) with no nodes yet, ready for the author to build up via
 * `LoopsView`. */
export async function createLoop(
  repo: Repository,
  params: { projectId: string; name: string; createdBy?: string },
): Promise<Loop> {
  return repo.loops.create({
    projectId: params.projectId,
    name: params.name,
    nodes: [],
    edges: [],
    isCycle: true,
    updatedBy: params.createdBy ?? 'you',
  })
}
