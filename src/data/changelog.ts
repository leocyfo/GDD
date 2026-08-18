import { versionBumpForTarget } from '../lib/versioning'
import type { Repository } from './repository/types'
import type { ChangeKind, ChangeTargetType } from './types/entities'

/** The one place an edit becomes a changelog row — every editable screen
 * calls this after a successful save so "what changed and when" stays a
 * real, queryable record instead of something only `updatedAt` hints at.
 * `versionBump` is derived the same way everywhere (`versionBumpForTarget`),
 * never chosen ad hoc per call site. */
export async function logChange(
  repo: Repository,
  params: {
    projectId: string
    by: string
    target: { type: ChangeTargetType; id: string; label: string }
    kind: ChangeKind
    diffSummary: string
  },
): Promise<void> {
  await repo.changeEntries.create({
    projectId: params.projectId,
    at: new Date().toISOString(),
    by: params.by,
    target: params.target,
    kind: params.kind,
    diffSummary: params.diffSummary,
    versionBump: versionBumpForTarget(params.target.type),
    updatedBy: params.by,
  })
}

/** The "who's editing" identity every live edit (as opposed to seeded demo
 * data) is attributed to. Defaults to `'you'` for fully-offline Dexie mode,
 * which has no auth/login at all. When Supabase auth is configured,
 * `AuthProvider` calls `setLocalActor` on sign-in/sign-out to swap this to
 * the signed-in user's email (and back on sign-out) — every one of the 16+
 * call sites across the app imports `LOCAL_ACTOR` as a named binding, and
 * ES modules resolve named imports live, so reassigning the `let` here is
 * enough to update all of them with no per-call-site change. */
export let LOCAL_ACTOR = 'you'

export function setLocalActor(actor: string): void {
  LOCAL_ACTOR = actor
}
