import type { SupabaseClient } from '@supabase/supabase-js'
import type { BaseEntity } from '../types/common'
import { generateId, nowIso } from './crud'
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
  CrudRepository,
} from './types'
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

/** Throws with the Postgres/PostgREST error message instead of returning
 * it silently — every call site already expects a rejected promise on
 * failure (same contract `DexieRepository` has), never a `{data, error}`
 * pair it has to remember to check. */
function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

/** One generic implementation of `CrudRepository<T>` per Postgres table —
 * the exact same role `createDexieCrud` plays for Dexie, so the two
 * backends stay easy to compare line by line. `idPrefix` matches whatever
 * `DexieRepository` uses for the same entity, so an id generated under one
 * backend is indistinguishable from one generated under the other (matters
 * for the local→cloud migration tool, which copies ids as-is). */
function createSupabaseCrud<T extends BaseEntity>(supabase: SupabaseClient, table: string, idPrefix: string): CrudRepository<T> {
  return {
    async get(id) {
      const { data, error } = await supabase.from(table).select().eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      return (data as T) ?? undefined
    },
    async list(filter) {
      let query = supabase.from(table).select()
      for (const [key, value] of Object.entries(filter ?? {})) {
        query = query.eq(key, value as string | number | boolean)
      }
      return unwrap(await query) as T[]
    },
    async create(input) {
      const record = { ...input, id: generateId(idPrefix), createdAt: nowIso(), updatedAt: nowIso() } as T
      return unwrap(await supabase.from(table).insert([record]).select().single())
    },
    async update(id, patch) {
      const record = { ...patch, updatedAt: nowIso() }
      return unwrap(await supabase.from(table).update(record).eq('id', id).select().single())
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    async bulkPut(items) {
      if (items.length === 0) return
      const { error } = await supabase.from(table).upsert(items as unknown as Record<string, unknown>[])
      if (error) throw new Error(error.message)
    },
  }
}

/**
 * `Repository` backed by Supabase/Postgres instead of Dexie/IndexedDB —
 * same interface, so every component and hook in the app keeps working
 * completely unchanged (see `RepositoryProvider.tsx`, which is the only
 * place that decides which of the two actually gets constructed).
 *
 * Custom query methods stay behaviorally identical to `DexieRepository`'s
 * versions even where a more "proper" Postgres query exists (e.g.
 * `listAffecting`/`listByAnchor` fetch-then-filter in JS rather than a
 * `jsonb` containment query) — correctness and being trivially easy to
 * compare against the Dexie version mattered more here than raw query
 * efficiency, and these tables are small (tens of rows, not thousands).
 */
export class SupabaseRepository implements Repository {
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

  /** `userId` is the signed-in Supabase auth user's id — `RepositoryProvider`
   * only ever constructs this once a session exists, so there's always a
   * real user here (never anonymous). Used for `projects.owner_id` on
   * create, and to scope the per-account `meta` table. */
  constructor(supabase: SupabaseClient, userId: string) {
    const baseProjects = createSupabaseCrud<Project>(supabase, 'projects', 'project')
    this.projects = {
      ...baseProjects,
      // `owner_id` isn't part of the `Project` type (it's Supabase-only
      // plumbing RLS needs) — the generic helper doesn't know to set it,
      // so `create` is the one method this repo overrides instead of
      // reusing wholesale.
      async create(input) {
        const record = { ...input, id: generateId('project'), owner_id: userId, createdAt: nowIso(), updatedAt: nowIso() }
        // Deliberately not `.insert([record]).select().single()` — that
        // chains `Prefer: return=representation`, which asks Postgres to
        // re-check the `projects` SELECT policy (`is_project_member`)
        // against the row it just inserted. `is_project_member` depends
        // on `project_members`, which only gets its row from the
        // `on_project_created` AFTER trigger — and that trigger's effect
        // isn't reliably visible yet to the RETURNING clause's policy
        // re-check within the *same* statement, so the whole insert gets
        // rejected with a misleading "new row violates row-level security
        // policy" even though the row (and the trigger's own insert) would
        // otherwise have gone through cleanly. Confirmed empirically: the
        // exact same insert without `.select()` succeeds and the trigger
        // fires correctly. `record` already has every field a real
        // `Project` needs, so there's nothing RETURNING would tell us
        // that we don't already know.
        const { error } = await supabase.from('projects').insert([record])
        if (error) throw new Error(error.message)
        return record
      },
      // Same reasoning as `create` above — `owner_id` isn't part of the
      // `Project` type, so the generic `bulkPut` from `createSupabaseCrud`
      // would insert rows missing a NOT NULL column. Used by the
      // local→cloud migration tool (`migrateToCloud.ts`), which only ever
      // has plain `Project` records to hand it.
      async bulkPut(items) {
        if (items.length === 0) return
        const records = items.map((item) => ({ ...item, owner_id: userId }))
        const { error } = await supabase.from('projects').upsert(records)
        if (error) throw new Error(error.message)
      },
    }

    // Every custom query below is an `async` arrow using `await` rather
    // than `.then(unwrap)` — Supabase's query builder is "thenable" but not
    // a real `Promise` (no `.catch`/`.finally`/`Symbol.toStringTag`), which
    // `.then()`-chaining surfaces back up as a type mismatch against the
    // `Repository` interface's real `Promise<T[]>` return types. `await`
    // sidesteps that entirely, and `unwrap<T>()` gets an explicit type
    // argument everywhere inference can't otherwise reach through it.
    this.sections = {
      ...createSupabaseCrud(supabase, 'sections', 'section'),
      listByProject: async (projectId) =>
        unwrap<Section[]>(await supabase.from('sections').select().eq('projectId', projectId).order('index')),
    }

    this.pillars = {
      ...createSupabaseCrud(supabase, 'pillars', 'pillar'),
      listByProject: async (projectId) =>
        unwrap<Pillar[]>(await supabase.from('pillars').select().eq('projectId', projectId).order('order')),
    }

    this.nonGoals = {
      ...createSupabaseCrud(supabase, 'non_goals', 'nonGoal'),
      listByProject: async (projectId) => unwrap<NonGoal[]>(await supabase.from('non_goals').select().eq('projectId', projectId)),
    }

    this.loops = {
      ...createSupabaseCrud(supabase, 'loops', 'loop'),
      listByProject: async (projectId) => unwrap<Loop[]>(await supabase.from('loops').select().eq('projectId', projectId)),
    }

    this.featureCards = {
      ...createSupabaseCrud(supabase, 'feature_cards', 'feature'),
      listByProject: async (projectId) =>
        unwrap<FeatureCard[]>(await supabase.from('feature_cards').select().eq('projectId', projectId)),
      listByStatus: async (projectId, status) =>
        unwrap<FeatureCard[]>(await supabase.from('feature_cards').select().eq('projectId', projectId).eq('status', status)),
    }

    this.scopeEntries = {
      ...createSupabaseCrud(supabase, 'scope_entries', 'scope'),
      listByMatrix: async (matrixId) =>
        unwrap<ScopeEntry[]>(await supabase.from('scope_entries').select().eq('matrixId', matrixId)),
    }

    this.decisions = {
      ...createSupabaseCrud(supabase, 'decisions', 'decision'),
      listByProject: async (projectId) =>
        unwrap<Decision[]>(
          await supabase.from('decisions').select().eq('projectId', projectId).order('date', { ascending: false }),
        ),
      listAffecting: async (type, id) => {
        const all = unwrap<Decision[]>(await supabase.from('decisions').select())
        return all.filter((decision) => decision.affects.some((ref) => ref.type === type && ref.id === id))
      },
    }

    this.logicNotes = {
      ...createSupabaseCrud(supabase, 'logic_notes', 'note'),
      listByProject: async (projectId) =>
        unwrap<LogicNote[]>(await supabase.from('logic_notes').select().eq('projectId', projectId)),
      listByFolder: async (folderPath) =>
        unwrap<LogicNote[]>(await supabase.from('logic_notes').select().eq('folderPath', folderPath)),
      listByTag: async (tagPath) => unwrap<LogicNote[]>(await supabase.from('logic_notes').select().contains('tags', [tagPath])),
      getBacklinks: async (noteId) => {
        const note = unwrap<LogicNote | null>(await supabase.from('logic_notes').select().eq('id', noteId).maybeSingle())
        if (!note) return []
        const notes = await Promise.all(
          note.inbound.map(async (id) => unwrap<LogicNote | null>(await supabase.from('logic_notes').select().eq('id', id).maybeSingle())),
        )
        return notes.filter((n): n is LogicNote => n !== null)
      },
    }

    this.tags = {
      ...createSupabaseCrud(supabase, 'tags', 'tag'),
      getByPath: async (path) => unwrap<Tag | null>(await supabase.from('tags').select().eq('path', path).maybeSingle()) ?? undefined,
    }

    this.milestones = {
      ...createSupabaseCrud(supabase, 'milestones', 'milestone'),
      listByProject: async (projectId) =>
        unwrap<Milestone[]>(await supabase.from('milestones').select().eq('projectId', projectId).order('date')),
    }

    this.collaborators = {
      ...createSupabaseCrud(supabase, 'collaborators', 'collaborator'),
      listByProject: async (projectId) =>
        unwrap<Collaborator[]>(await supabase.from('collaborators').select().eq('projectId', projectId)),
    }

    this.changeEntries = {
      ...createSupabaseCrud(supabase, 'change_entries', 'change'),
      listByProject: async (projectId, opts) => {
        let query = supabase.from('change_entries').select().eq('projectId', projectId).order('at', { ascending: false })
        if (opts?.since) query = query.gte('at', opts.since)
        if (opts?.limit) query = query.limit(opts.limit)
        return unwrap<ChangeEntry[]>(await query)
      },
    }

    this.assets = {
      ...createSupabaseCrud(supabase, 'assets', 'asset'),
      listByProject: async (projectId) => unwrap<Asset[]>(await supabase.from('assets').select().eq('projectId', projectId)),
    }

    this.productionAssets = {
      ...createSupabaseCrud(supabase, 'production_assets', 'passet'),
      listByProject: async (projectId) =>
        unwrap<ProductionAsset[]>(await supabase.from('production_assets').select().eq('projectId', projectId)),
    }

    this.levels = {
      ...createSupabaseCrud(supabase, 'levels', 'level'),
      listByProject: async (projectId) =>
        unwrap<Level[]>(await supabase.from('levels').select().eq('projectId', projectId).order('order')),
    }

    this.comments = {
      ...createSupabaseCrud(supabase, 'comments', 'comment'),
      listByAnchor: async (anchor) => {
        const all = unwrap<Comment[]>(await supabase.from('comments').select())
        return all.filter((c) => c.anchor.type === anchor.type && c.anchor.id === anchor.id)
      },
    }

    this.meta = {
      isSeeded: async () => {
        const { data } = await supabase.from('meta').select().eq('owner_id', userId).eq('key', 'seeded').maybeSingle()
        return data?.value === true
      },
      markSeeded: async () => {
        const { error } = await supabase.from('meta').upsert({ owner_id: userId, key: 'seeded', value: true })
        if (error) throw new Error(error.message)
      },
      getSetting: async <T>(key: string) => {
        const { data } = await supabase.from('meta').select().eq('owner_id', userId).eq('key', key).maybeSingle()
        return data?.value as T | undefined
      },
      setSetting: async <T>(key: string, value: T) => {
        const { error } = await supabase.from('meta').upsert({ owner_id: userId, key, value })
        if (error) throw new Error(error.message)
      },
    }
  }
}
