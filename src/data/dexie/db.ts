import Dexie, { type Table } from 'dexie'
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
} from '../types/entities'

/** Key/value row for small bits of app state that don't deserve their own
 * table — currently just the "has the demo project been seeded" flag and
 * future user settings. */
export interface MetaRow {
  key: string
  value: unknown
}

/**
 * IndexedDB schema, one table per domain entity. Indexes are deliberately
 * minimal: `projectId` plus the one or two scalar fields each screen
 * actually filters/sorts by. Nested-object fields (`Decision.affects[]`,
 * `ChangeEntry.target`, `Comment.anchor`) are NOT indexed — Phase 1's
 * dataset is a few hundred rows, so filtering those in JS after a
 * `.where('projectId').equals(id).toArray()` is simpler and fast enough.
 *
 * Nothing outside `data/repository` should import this file directly —
 * components talk to the `Repository` interface so a future backend can
 * replace this implementation without touching UI code.
 */
export class GddDatabase extends Dexie {
  projects!: Table<Project, string>
  sections!: Table<Section, string>
  pillars!: Table<Pillar, string>
  nonGoals!: Table<NonGoal, string>
  loops!: Table<Loop, string>
  featureCards!: Table<FeatureCard, string>
  scopeEntries!: Table<ScopeEntry, string>
  decisions!: Table<Decision, string>
  logicNotes!: Table<LogicNote, string>
  tags!: Table<Tag, string>
  milestones!: Table<Milestone, string>
  collaborators!: Table<Collaborator, string>
  changeEntries!: Table<ChangeEntry, string>
  assets!: Table<Asset, string>
  productionAssets!: Table<ProductionAsset, string>
  levels!: Table<Level, string>
  comments!: Table<Comment, string>
  meta!: Table<MetaRow, string>

  constructor(name = 'gdd') {
    super(name)
    this.version(1).stores({
      projects: 'id',
      sections: 'id, projectId, index, key',
      pillars: 'id, projectId, order',
      nonGoals: 'id, projectId',
      loops: 'id, projectId',
      featureCards: 'id, projectId, status',
      scopeEntries: 'id, matrixId, verdict',
      decisions: 'id, projectId, date',
      logicNotes: 'id, projectId, folderPath, kind, *tags',
      tags: 'id, path',
      milestones: 'id, projectId, date',
      collaborators: 'id, projectId',
      changeEntries: 'id, projectId, at',
      assets: 'id, projectId, kind',
      comments: 'id',
      meta: 'key',
    })
    // v2: adds the production-asset checklist and level/POI catalog tables.
    // A version bump (not just editing `version(1)`) is required for these
    // new stores to actually get created in a browser that already seeded
    // under v1 — Dexie only creates stores declared in a version transition
    // the installed database hasn't run yet.
    this.version(2).stores({
      productionAssets: 'id, projectId, status, kind',
      levels: 'id, projectId, order',
    })
  }
}

/** Default app-wide database instance. Tests construct their own
 * `new GddDatabase('some-unique-name')` instead, so they never share state
 * with this one or with each other. */
export const db = new GddDatabase()
