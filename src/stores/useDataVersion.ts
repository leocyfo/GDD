import { create } from 'zustand'

/**
 * The app has no per-entity cache to invalidate (`useRepoQuery` just reads
 * straight from the repository) — so instead of wiring precise
 * invalidation for every mutation, every live edit bumps this one counter,
 * and `useRepoQuery` treats it as an implicit dependency. Every mounted
 * query anywhere in the app refetches after any change anywhere. Wasteful
 * in theory; at this dataset size (a few hundred rows, IndexedDB reads),
 * genuinely free in practice — and it's what keeps the sidebar's freshness
 * dots, the status bar, and open tabs from going stale the moment you
 * start editing.
 */
interface DataVersionState {
  version: number
  bump: () => void
}

export const useDataVersion = create<DataVersionState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))

/** Call after any successful repository mutation from a component/handler
 * (not from `data/` helpers themselves — that layer stays store-free). */
export function notifyDataChanged(): void {
  useDataVersion.getState().bump()
}
