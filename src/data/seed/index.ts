import { deleteProject } from '../deleteProject'
import { PROJECT_ID } from './constants'
import type { Repository } from '../repository/types'
import { buildSeedGraph } from './build'
import { persistSeedGraph } from './persist'
import { validateSeedGraph } from './validate'

export { buildSeedGraph } from './build'
export type { SeedGraph } from './build'
export { validateSeedGraph } from './validate'
export type { ValidationResult } from './validate'

/** The demo project's id from before the seed content changed from
 * "Echoes of Aether" to "Stormline". Cleared out one time at boot below —
 * without this, a browser that already ran the old seed keeps that
 * project sitting in the Hub forever, since `bulkPut`-ing new content
 * under a new project id doesn't touch old rows under the old one. */
const RETIRED_PROJECT_IDS = ['project:echoes-of-aether']

/** Bump this any time the seed *content* changes (new blocks, new fields,
 * reworded copy) — not just when the demo project's identity changes. A
 * browser that already seeded once has `isSeeded` permanently true, so
 * without this, edits to `sections.seed.ts` et al. would only ever show up
 * for people who've never opened the app before. On a mismatch the seeded
 * project is deleted and rebuilt from scratch — simpler and more reliably
 * correct than trying to patch individual rows in place. */
const SEED_CONTENT_VERSION = '2026-08-14.2'
const SEED_VERSION_KEY = 'seedContentVersion'

/** Idempotent boot-time entry point: builds and validates the demo dataset
 * in memory, persists it once, then marks the repository as seeded so a
 * later reload never re-runs this. Throws instead of silently persisting a
 * broken graph — a corrupt seed should fail loudly at boot, not surface as
 * a confusing bug three screens later. */
export async function ensureSeeded(repo: Repository): Promise<void> {
  for (const retiredId of RETIRED_PROJECT_IDS) {
    if (await repo.projects.get(retiredId)) {
      await deleteProject(repo, retiredId)
    }
  }

  const seededVersion = await repo.meta.getSetting<string>(SEED_VERSION_KEY)
  if (seededVersion === SEED_CONTENT_VERSION) return

  // Version mismatch — either first boot ever, or the seed content moved on
  // since this browser last ran it. Either way, clear out whatever's
  // sitting at the current project id before rebuilding, so stale content
  // never lingers alongside (or instead of) the new seed.
  if (await repo.projects.get(PROJECT_ID)) {
    await deleteProject(repo, PROJECT_ID)
  }

  const graph = buildSeedGraph()
  const result = validateSeedGraph(graph)
  if (!result.ok) {
    throw new Error(`Seed data failed validation:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`)
  }

  await persistSeedGraph(repo, graph)
  await repo.meta.markSeeded()
  await repo.meta.setSetting(SEED_VERSION_KEY, SEED_CONTENT_VERSION)
}
