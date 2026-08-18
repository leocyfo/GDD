import { SCOPE_MATRIX_ID } from './scopeMatrixId'
import type { Repository } from './repository/types'

/**
 * The counterpart to `newProject.ts`'s `createNewProject` — removes a
 * project and every record scoped to it. Most entities carry `projectId`
 * directly and can be swept with `listByProject` + `delete`; two don't:
 *
 * - `ScopeEntry` has no `projectId` at all — there is exactly one scope
 *   matrix app-wide (`SCOPE_MATRIX_ID`, see that file's own note on this
 *   being a real, if narrow, limitation), so deleting "the" project's
 *   scope entries means clearing that shared matrix.
 * - `Tag` records are derived from vault note usage and aren't
 *   project-scoped in the data model either (see README's known gaps) —
 *   cleared in full for the same reason.
 *
 * Safe to call on a project with no content at all (every list comes back
 * empty, every delete loop is a no-op).
 */
export async function deleteProject(repo: Repository, projectId: string): Promise<void> {
  const [pillars, nonGoals, loops, sections, featureCards, scopeEntries, decisions, logicNotes, tags, milestones, collaborators, changeEntries, assets] =
    await Promise.all([
      repo.pillars.listByProject(projectId),
      repo.nonGoals.listByProject(projectId),
      repo.loops.listByProject(projectId),
      repo.sections.listByProject(projectId),
      repo.featureCards.listByProject(projectId),
      repo.scopeEntries.listByMatrix(SCOPE_MATRIX_ID),
      repo.decisions.listByProject(projectId),
      repo.logicNotes.listByProject(projectId),
      repo.tags.list(),
      repo.milestones.listByProject(projectId),
      repo.collaborators.listByProject(projectId),
      repo.changeEntries.listByProject(projectId),
      repo.assets.listByProject(projectId),
    ])

  await Promise.all([
    ...pillars.map((item) => repo.pillars.delete(item.id)),
    ...nonGoals.map((item) => repo.nonGoals.delete(item.id)),
    ...loops.map((item) => repo.loops.delete(item.id)),
    ...sections.map((item) => repo.sections.delete(item.id)),
    ...featureCards.map((item) => repo.featureCards.delete(item.id)),
    ...scopeEntries.map((item) => repo.scopeEntries.delete(item.id)),
    ...decisions.map((item) => repo.decisions.delete(item.id)),
    ...logicNotes.map((item) => repo.logicNotes.delete(item.id)),
    ...tags.map((item) => repo.tags.delete(item.id)),
    ...milestones.map((item) => repo.milestones.delete(item.id)),
    ...collaborators.map((item) => repo.collaborators.delete(item.id)),
    ...changeEntries.map((item) => repo.changeEntries.delete(item.id)),
    ...assets.map((item) => repo.assets.delete(item.id)),
  ])

  await repo.projects.delete(projectId)
}
