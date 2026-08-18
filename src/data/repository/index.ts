import { db } from '../dexie/db'
import { DexieRepository } from './DexieRepository'
import type { Repository } from './types'

/** App-wide singleton — the one `Repository` instance real (non-test) code
 * should use. Seeding code imports this directly; components should prefer
 * `useRepository()` from `RepositoryProvider` so tests can substitute an
 * isolated instance. */
export const repo: Repository = new DexieRepository(db)

export type {
  Repository,
  CrudRepository,
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
