import type { GddDatabase } from '../dexie/db'
import { createDexieCrud } from './crud'
import type {
  Repository,
  SectionsRepository,
  PillarsRepository,
  NonGoalsRepository,
  LoopsRepository,
  FeatureCardsRepository,
  ScopeEntriesRepository,
  DecisionsRepository,
  LogicNotesRepository,
  TagsRepository,
  MilestonesRepository,
  CollaboratorsRepository,
  ChangeEntriesRepository,
  AssetsRepository,
  ProductionAssetsRepository,
  LevelsRepository,
  CommentsRepository,
  MetaRepository,
} from './types'
import type { Project } from '../types/entities'
import type { CrudRepository } from './types'

const SEEDED_KEY = 'seeded'

/** `Repository` backed by Dexie/IndexedDB. Every custom query method reads
 * straight from the Dexie table it's scoped to, filtering in JS for
 * anything not covered by the schema's minimal indexes — see the note atop
 * `data/dexie/db.ts`. */
export class DexieRepository implements Repository {
  projects: CrudRepository<Project>
  sections: SectionsRepository
  pillars: PillarsRepository
  nonGoals: NonGoalsRepository
  loops: LoopsRepository
  featureCards: FeatureCardsRepository
  scopeEntries: ScopeEntriesRepository
  decisions: DecisionsRepository
  logicNotes: LogicNotesRepository
  tags: TagsRepository
  milestones: MilestonesRepository
  collaborators: CollaboratorsRepository
  changeEntries: ChangeEntriesRepository
  assets: AssetsRepository
  productionAssets: ProductionAssetsRepository
  levels: LevelsRepository
  comments: CommentsRepository
  meta: MetaRepository

  constructor(db: GddDatabase) {
    this.projects = createDexieCrud(db.projects, 'project')

    this.sections = {
      ...createDexieCrud(db.sections, 'section'),
      listByProject: (projectId) =>
        db.sections.where('projectId').equals(projectId).sortBy('index'),
    }

    this.pillars = {
      ...createDexieCrud(db.pillars, 'pillar'),
      listByProject: (projectId) =>
        db.pillars.where('projectId').equals(projectId).sortBy('order'),
    }

    this.nonGoals = {
      ...createDexieCrud(db.nonGoals, 'nonGoal'),
      listByProject: (projectId) => db.nonGoals.where('projectId').equals(projectId).toArray(),
    }

    this.loops = {
      ...createDexieCrud(db.loops, 'loop'),
      listByProject: (projectId) => db.loops.where('projectId').equals(projectId).toArray(),
    }

    this.featureCards = {
      ...createDexieCrud(db.featureCards, 'feature'),
      listByProject: (projectId) =>
        db.featureCards.where('projectId').equals(projectId).toArray(),
      listByStatus: async (projectId, status) => {
        const rows = await db.featureCards.where('status').equals(status).toArray()
        return rows.filter((row) => row.projectId === projectId)
      },
    }

    this.scopeEntries = {
      ...createDexieCrud(db.scopeEntries, 'scope'),
      listByMatrix: (matrixId) => db.scopeEntries.where('matrixId').equals(matrixId).toArray(),
    }

    this.decisions = {
      ...createDexieCrud(db.decisions, 'decision'),
      listByProject: async (projectId) => {
        const rows = await db.decisions.where('projectId').equals(projectId).toArray()
        return rows.sort((a, b) => b.date.localeCompare(a.date))
      },
      listAffecting: async (type, id) => {
        const all = await db.decisions.toArray()
        return all.filter((decision) =>
          decision.affects.some((ref) => ref.type === type && ref.id === id),
        )
      },
    }

    this.logicNotes = {
      ...createDexieCrud(db.logicNotes, 'note'),
      listByProject: (projectId) =>
        db.logicNotes.where('projectId').equals(projectId).toArray(),
      listByFolder: (folderPath) =>
        db.logicNotes.where('folderPath').equals(folderPath).toArray(),
      listByTag: (tagPath) => db.logicNotes.where('tags').equals(tagPath).toArray(),
      getBacklinks: async (noteId) => {
        const note = await db.logicNotes.get(noteId)
        if (!note) return []
        const notes = await Promise.all(note.inbound.map((id) => db.logicNotes.get(id)))
        return notes.filter((n): n is NonNullable<typeof n> => n !== undefined)
      },
    }

    this.tags = {
      ...createDexieCrud(db.tags, 'tag'),
      getByPath: (path) => db.tags.where('path').equals(path).first(),
    }

    this.milestones = {
      ...createDexieCrud(db.milestones, 'milestone'),
      listByProject: async (projectId) => {
        const rows = await db.milestones.where('projectId').equals(projectId).toArray()
        return rows.sort((a, b) => a.date.localeCompare(b.date))
      },
    }

    this.collaborators = {
      ...createDexieCrud(db.collaborators, 'collaborator'),
      listByProject: (projectId) =>
        db.collaborators.where('projectId').equals(projectId).toArray(),
    }

    this.changeEntries = {
      ...createDexieCrud(db.changeEntries, 'change'),
      listByProject: async (projectId, opts) => {
        let rows = await db.changeEntries.where('projectId').equals(projectId).toArray()
        rows.sort((a, b) => b.at.localeCompare(a.at))
        if (opts?.since) rows = rows.filter((row) => row.at >= opts.since!)
        if (opts?.limit) rows = rows.slice(0, opts.limit)
        return rows
      },
    }

    this.assets = {
      ...createDexieCrud(db.assets, 'asset'),
      listByProject: (projectId) => db.assets.where('projectId').equals(projectId).toArray(),
    }

    this.productionAssets = {
      ...createDexieCrud(db.productionAssets, 'passet'),
      listByProject: (projectId) => db.productionAssets.where('projectId').equals(projectId).toArray(),
    }

    this.levels = {
      ...createDexieCrud(db.levels, 'level'),
      listByProject: (projectId) => db.levels.where('projectId').equals(projectId).sortBy('order'),
    }

    this.comments = {
      ...createDexieCrud(db.comments, 'comment'),
      listByAnchor: async (anchor) => {
        const all = await db.comments.toArray()
        return all.filter((c) => c.anchor.type === anchor.type && c.anchor.id === anchor.id)
      },
    }

    this.meta = {
      isSeeded: async () => {
        const row = await db.meta.get(SEEDED_KEY)
        return row?.value === true
      },
      markSeeded: async () => {
        await db.meta.put({ key: SEEDED_KEY, value: true })
      },
      getSetting: async <T>(key: string) => {
        const row = await db.meta.get(key)
        return row?.value as T | undefined
      },
      setSetting: async <T>(key: string, value: T) => {
        await db.meta.put({ key, value })
      },
    }
  }
}
