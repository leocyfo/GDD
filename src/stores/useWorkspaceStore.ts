import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTabsStore } from './useTabsStore'

interface WorkspaceState {
  /** `null` means "at the Hub" — no project is open. Persisted, so a
   * returning visitor resumes in the same document instead of always
   * landing back on the Hub. */
  activeProjectId: string | null
  /** Which repository/account `activeProjectId` was last valid under —
   * `'offline'` for Dexie, a Supabase user id for cloud mode. Also
   * persisted, purely so `syncIdentity` can tell "same session reloaded"
   * apart from "different backend or account than last time." */
  lastIdentity: string | null
  openProject: (id: string) => void
  goToHub: () => void
  /** Call once per boot with whichever repository is active
   * (`App.tsx`/`BootedApp`). `activeProjectId` is one global persisted
   * value with no idea which backend or account it came from — reusing it
   * across a switch from offline to a cloud account (or between two cloud
   * accounts in the same browser) would try to open a project id that
   * means nothing (or the wrong thing) under the new identity. Resets to
   * the Hub whenever the identity actually changed; a no-op on a plain
   * reload while staying signed into the same thing. */
  syncIdentity: (identity: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      lastIdentity: null,
      openProject: (id) => {
        // Open tabs belong to whichever project was active when they were
        // opened — a leftover "playerHealth" tab from another project would
        // resolve to the wrong document once we're inside a new one.
        // Switching to a different project starts with a clean tab bar;
        // re-opening the same project leaves it alone.
        if (get().activeProjectId !== id) {
          useTabsStore.setState({ tabs: [], activeTabId: null })
        }
        set({ activeProjectId: id })
      },
      goToHub: () => set({ activeProjectId: null }),
      syncIdentity: (identity) => {
        if (get().lastIdentity === identity) return
        useTabsStore.setState({ tabs: [], activeTabId: null })
        set({ lastIdentity: identity, activeProjectId: null })
      },
    }),
    { name: 'gdd:workspace' },
  ),
)
