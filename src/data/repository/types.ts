import type { BaseEntity } from '../types/common'
import type {
  Project,
  Section,
  Pillar,
  NonGoal,
  Loop,
  FeatureCard,
  ScopeEntry,
  Decision,
  LogicNote,
  Tag,
  Milestone,
  Collaborator,
  ChangeEntry,
  Asset,
  ProductionAsset,
  Level,
  Comment,
  AffectedType,
  CommentAnchor,
} from '../types/entities'

/** Generic CRUD shape every entity repository implements. `create` assigns
 * `id`/`createdAt`/`updatedAt`; `bulkPut` is the escape hatch for seeding
 * and import, where records already carry every field. */
export interface CrudRepository<T extends BaseEntity> {
  get(id: string): Promise<T | undefined>
  list(filter?: Partial<T>): Promise<T[]>
  create(input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, patch: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>
  delete(id: string): Promise<void>
  bulkPut(items: T[]): Promise<void>
}

export interface PillarsRepository extends CrudRepository<Pillar> {
  listByProject(projectId: string): Promise<Pillar[]>
}

export interface NonGoalsRepository extends CrudRepository<NonGoal> {
  listByProject(projectId: string): Promise<NonGoal[]>
}

export interface LoopsRepository extends CrudRepository<Loop> {
  listByProject(projectId: string): Promise<Loop[]>
}

export interface SectionsRepository extends CrudRepository<Section> {
  listByProject(projectId: string): Promise<Section[]>
}

export interface FeatureCardsRepository extends CrudRepository<FeatureCard> {
  listByProject(projectId: string): Promise<FeatureCard[]>
  listByStatus(projectId: string, status: FeatureCard['status']): Promise<FeatureCard[]>
}

export interface ScopeEntriesRepository extends CrudRepository<ScopeEntry> {
  listByMatrix(matrixId: string): Promise<ScopeEntry[]>
}

export interface DecisionsRepository extends CrudRepository<Decision> {
  listByProject(projectId: string): Promise<Decision[]>
  listAffecting(type: AffectedType, id: string): Promise<Decision[]>
}

export interface LogicNotesRepository extends CrudRepository<LogicNote> {
  listByProject(projectId: string): Promise<LogicNote[]>
  listByFolder(folderPath: string): Promise<LogicNote[]>
  listByTag(tagPath: string): Promise<LogicNote[]>
  /** Resolves `note.inbound` ids to the actual notes that link here. */
  getBacklinks(noteId: string): Promise<LogicNote[]>
}

export interface TagsRepository extends CrudRepository<Tag> {
  getByPath(path: string): Promise<Tag | undefined>
}

export interface MilestonesRepository extends CrudRepository<Milestone> {
  listByProject(projectId: string): Promise<Milestone[]>
}

export interface CollaboratorsRepository extends CrudRepository<Collaborator> {
  listByProject(projectId: string): Promise<Collaborator[]>
}

export interface ChangeEntriesRepository extends CrudRepository<ChangeEntry> {
  listByProject(projectId: string, opts?: { since?: string; limit?: number }): Promise<ChangeEntry[]>
}

export interface AssetsRepository extends CrudRepository<Asset> {
  listByProject(projectId: string): Promise<Asset[]>
}

export interface ProductionAssetsRepository extends CrudRepository<ProductionAsset> {
  listByProject(projectId: string): Promise<ProductionAsset[]>
}

export interface LevelsRepository extends CrudRepository<Level> {
  listByProject(projectId: string): Promise<Level[]>
}

export interface CommentsRepository extends CrudRepository<Comment> {
  listByAnchor(anchor: CommentAnchor): Promise<Comment[]>
}

export interface MetaRepository {
  isSeeded(): Promise<boolean>
  markSeeded(): Promise<void>
  getSetting<T>(key: string): Promise<T | undefined>
  setSetting<T>(key: string, value: T): Promise<void>
}

/**
 * The single door components walk through to reach persisted data. Never
 * import `data/dexie` directly from a component — swap this interface's
 * implementation (e.g. for a Postgres/REST backend later) and every
 * consumer keeps working unchanged.
 */
export interface Repository {
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
}
