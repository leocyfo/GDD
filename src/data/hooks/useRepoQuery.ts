import { useCallback, useEffect, useState } from 'react'
import { useDataVersion } from '../../stores/useDataVersion'
import { useRepository } from '../repository/RepositoryProvider'
import type { Repository } from '../repository/types'

interface RepoQueryState<T> {
  data: T | undefined
  loading: boolean
  error: Error | null
}

/** Generic `{data, loading, error}` read against the repository. Domain
 * data is never cached in a Zustand store (see the architecture notes in
 * the plan) — every screen reads it live through a hook like this one.
 * Also implicitly re-runs whenever `useDataVersion`'s counter changes (any
 * edit anywhere bumps it — see that module), but only shows the loading
 * skeleton on the very first fetch: a background revalidation after
 * someone edits a note elsewhere shouldn't flash the sidebar to a
 * skeleton, it should just quietly pick up the new data. `refetch` is
 * still there for a caller that wants to force one explicitly. */
export function useRepoQuery<T>(
  fn: (repo: Repository) => Promise<T>,
  deps: readonly unknown[],
): RepoQueryState<T> & { refetch: () => void } {
  const repo = useRepository()
  const dataVersion = useDataVersion((s) => s.version)
  const [state, setState] = useState<RepoQueryState<T>>({ data: undefined, loading: true, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((prev) => (prev.data === undefined ? { ...prev, loading: true } : prev))
    fn(repo)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      })
    return () => {
      cancelled = true
    }
    // `fn` is intentionally excluded — callers pass an inline closure, and
    // `deps` is the caller-declared list of values that should trigger a
    // re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, tick, dataVersion, ...deps])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { ...state, refetch }
}
