import type { LogicNote } from '../types/entities'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { useRepoQuery } from './useRepoQuery'

export function useProjects() {
  return useRepoQuery((repo) => repo.projects.list(), [])
}

/** Whichever project the Hub sent the user into (`useWorkspaceStore`) —
 * `AppShell` only ever renders once a project is selected, so this
 * resolves to a real project everywhere it's used inside it. */
export function useActiveProject() {
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  return useRepoQuery(
    (repo) => (activeProjectId ? repo.projects.get(activeProjectId) : Promise.resolve(undefined)),
    [activeProjectId],
  )
}

export function useSections(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.sections.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useSection(sectionId: string | undefined) {
  return useRepoQuery((repo) => (sectionId ? repo.sections.get(sectionId) : Promise.resolve(undefined)), [sectionId])
}

/** Sections are keyed by their spec-defined `key` (`'core-concept'`, …) in
 * navigation and tabs, not by their storage id — this resolves one from
 * the 10-item list already fetched by `useSections` rather than adding a
 * dedicated repository lookup for such a small collection. */
export function useSectionByKey(projectId: string | undefined, key: string | undefined) {
  const { data: sections, loading, error } = useSections(projectId)
  return { data: key ? sections?.find((s) => s.key === key) : undefined, loading, error }
}

export function usePillars(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.pillars.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useNonGoals(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.nonGoals.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useCollaborators(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.collaborators.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useLogicNotes(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.logicNotes.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useLogicNote(id: string | undefined) {
  return useRepoQuery<LogicNote | undefined>(
    (repo) => (id ? repo.logicNotes.get(id) : Promise.resolve(undefined)),
    [id],
  )
}

export function useLogicNotesByIds(ids: readonly string[]) {
  return useRepoQuery(
    async (repo) => {
      const notes = await Promise.all(ids.map((id) => repo.logicNotes.get(id)))
      return notes.filter((n): n is LogicNote => n !== undefined)
    },
    [ids.join(',')],
  )
}

export function useBacklinks(noteId: string | undefined) {
  return useRepoQuery((repo) => (noteId ? repo.logicNotes.getBacklinks(noteId) : Promise.resolve([])), [noteId])
}

export function useFeatureCards(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.featureCards.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useDecisions(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.decisions.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useMilestones(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.milestones.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useChangeEntries(projectId: string | undefined, limit?: number) {
  return useRepoQuery(
    (repo) => (projectId ? repo.changeEntries.listByProject(projectId, { limit }) : Promise.resolve([])),
    [projectId, limit],
  )
}

export function useLoops(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.loops.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useLoop(loopId: string | undefined) {
  return useRepoQuery((repo) => (loopId ? repo.loops.get(loopId) : Promise.resolve(undefined)), [loopId])
}

export function useFeatureCardsByIds(ids: readonly string[]) {
  return useRepoQuery(
    async (repo) => {
      const cards = await Promise.all(ids.map((id) => repo.featureCards.get(id)))
      return cards.filter((c): c is NonNullable<typeof c> => c !== undefined)
    },
    [ids.join(',')],
  )
}

export function useScopeEntries(matrixId: string | undefined) {
  return useRepoQuery(
    (repo) => (matrixId ? repo.scopeEntries.listByMatrix(matrixId) : Promise.resolve([])),
    [matrixId],
  )
}

export function useAssets(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.assets.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useProductionAssets(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.productionAssets.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useLevels(projectId: string | undefined) {
  return useRepoQuery(
    (repo) => (projectId ? repo.levels.listByProject(projectId) : Promise.resolve([])),
    [projectId],
  )
}

export function useTags() {
  return useRepoQuery((repo) => repo.tags.list(), [])
}

/** Every note + section title a `[[` wikilink can target, for the editor's
 * suggestion popup. Sections are addressed by their spec `key`
 * (`'core-concept'`, …), not their storage id — that's how section tabs
 * and `useSectionByKey` already resolve them everywhere else in the app,
 * and unlike notes, a section's storage id isn't guaranteed stable across
 * projects (seeded ids are deterministic; `createNewProject`-provisioned
 * ones are random). */
export function useLinkableItems(projectId: string | undefined) {
  return useRepoQuery(
    async (repo) => {
      if (!projectId) return []
      const [notes, sections] = await Promise.all([
        repo.logicNotes.listByProject(projectId),
        repo.sections.listByProject(projectId),
      ])
      return [
        ...notes.map((n) => ({ id: n.id, label: n.title, kind: 'note' as const })),
        ...sections.map((s) => ({ id: s.key, label: `${s.index}. ${s.title}`, kind: 'section' as const })),
      ]
    },
    [projectId],
  )
}
