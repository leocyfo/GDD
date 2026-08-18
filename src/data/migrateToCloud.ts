import { db } from './dexie/db'
import { DexieRepository } from './repository/DexieRepository'
import type { Repository } from './repository/types'

/**
 * One-time copy of everything in the local Dexie/IndexedDB database into a
 * freshly-authenticated Supabase repository. Called once per account right
 * after its first sign-in (see `App.tsx`) — the user already chose
 * "migrate everything" up front when picking Supabase over staying local,
 * so this isn't a separate confirmation step, just a straight copy.
 *
 * Every record already carries its real `id`/`createdAt`/`updatedAt`
 * (Dexie and Supabase generate both identically — see `crud.ts`), so this
 * is a verbatim copy via `bulkPut`, never a re-create. Per-project
 * collections are copied project by project; `scopeEntries`/`tags`/
 * `comments` aren't project-scoped locally (a known, pre-existing gap —
 * see `supabase/migrations/0001_init.sql`'s header) so they're copied in
 * one pass across the whole local database instead.
 *
 * Two ordering details matter, both because Postgres checks foreign keys
 * as each row lands (`assets`/`decisions` aren't deferrable):
 *  - `production_assets."assetId"` and `levels."assetId"` reference
 *    `assets` — assets must finish inserting before either of those.
 *  - `decisions.supersedes` references another row in the same table —
 *    a decision that supersedes one inserted later in the same batch would
 *    fail. Every decision goes in with `supersedes` nulled out first, then
 *    a second pass patches the real value back in, by which point every id
 *    in the batch already exists as a row.
 *
 * Finally, the local `meta` table's raw key/value rows — in particular the
 * seed-content version — are copied over verbatim so `ensureSeeded` sees
 * the exact same "already seeded" state in the cloud that it already sees
 * locally. Without this, a fresh cloud account looks unseeded and
 * `ensureSeeded` would delete-and-rebuild the project that was just
 * migrated from the pristine demo seed, destroying any local edits.
 */
export async function migrateLocalDataToCloud(cloud: Repository): Promise<void> {
  const local = new DexieRepository(db)

  const projects = await local.projects.list()
  for (const project of projects) {
    await cloud.projects.bulkPut([project])

    const [
      sections,
      pillars,
      nonGoals,
      loops,
      featureCards,
      decisions,
      milestones,
      collaborators,
      changeEntries,
      assets,
      productionAssets,
      levels,
    ] = await Promise.all([
      local.sections.listByProject(project.id),
      local.pillars.listByProject(project.id),
      local.nonGoals.listByProject(project.id),
      local.loops.listByProject(project.id),
      local.featureCards.listByProject(project.id),
      local.decisions.listByProject(project.id),
      local.milestones.listByProject(project.id),
      local.collaborators.listByProject(project.id),
      local.changeEntries.listByProject(project.id),
      local.assets.listByProject(project.id),
      local.productionAssets.listByProject(project.id),
      local.levels.listByProject(project.id),
    ])
    // logicNotes has no per-entity FK dependency on anything else copied
    // here, but its own table is fetched below alongside the rest — kept
    // separate only because `listByProject` isn't its lookup (all its
    // records are already project-scoped the same way).
    const logicNotes = await local.logicNotes.listByProject(project.id)

    await Promise.all([
      cloud.sections.bulkPut(sections),
      cloud.pillars.bulkPut(pillars),
      cloud.nonGoals.bulkPut(nonGoals),
      cloud.loops.bulkPut(loops),
      cloud.featureCards.bulkPut(featureCards),
      cloud.decisions.bulkPut(decisions.map((d) => ({ ...d, supersedes: null }))),
      cloud.logicNotes.bulkPut(logicNotes),
      cloud.milestones.bulkPut(milestones),
      cloud.collaborators.bulkPut(collaborators),
      cloud.changeEntries.bulkPut(changeEntries),
      cloud.assets.bulkPut(assets),
    ])

    await Promise.all([
      cloud.productionAssets.bulkPut(productionAssets),
      cloud.levels.bulkPut(levels),
      ...decisions
        .filter((d) => d.supersedes)
        .map((d) => cloud.decisions.update(d.id, { supersedes: d.supersedes })),
    ])
  }

  const [scopeEntries, tags, comments, metaRows] = await Promise.all([
    local.scopeEntries.list(),
    local.tags.list(),
    local.comments.list(),
    db.meta.toArray(),
  ])

  await Promise.all([
    cloud.scopeEntries.bulkPut(scopeEntries),
    cloud.tags.bulkPut(tags),
    cloud.comments.bulkPut(comments),
    ...metaRows.map((row) => cloud.meta.setSetting(row.key, row.value)),
  ])
}
