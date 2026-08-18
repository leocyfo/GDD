import type { Repository } from '../repository/types'
import type { SeedGraph } from './build'

/**
 * Writes a validated `SeedGraph` through the `Repository` — never touches
 * Dexie directly, so seeding stays swappable along with everything else.
 * This isn't wrapped in one atomic multi-table transaction (the Repository
 * interface deliberately doesn't expose the underlying db for that), but
 * every write here is a keyed `bulkPut`/upsert, not an append — so if a
 * write throws partway through, `ensureSeeded` simply never calls
 * `markSeeded`, and the next boot's retry safely overwrites the same ids
 * again rather than duplicating anything.
 */
export async function persistSeedGraph(repo: Repository, graph: SeedGraph): Promise<void> {
  await repo.projects.bulkPut([graph.project])
  await repo.pillars.bulkPut(graph.pillars)
  await repo.nonGoals.bulkPut(graph.nonGoals)
  await repo.loops.bulkPut(graph.loops)
  await repo.sections.bulkPut(graph.sections)
  await repo.featureCards.bulkPut(graph.featureCards)
  await repo.scopeEntries.bulkPut(graph.scopeEntries)
  await repo.decisions.bulkPut(graph.decisions)
  await repo.logicNotes.bulkPut(graph.logicNotes)
  await repo.tags.bulkPut(graph.tags)
  await repo.milestones.bulkPut(graph.milestones)
  await repo.collaborators.bulkPut(graph.collaborators)
  await repo.changeEntries.bulkPut(graph.changeEntries)
  await repo.assets.bulkPut(graph.assets)
  await repo.productionAssets.bulkPut(graph.productionAssets)
  await repo.levels.bulkPut(graph.levels)
}
