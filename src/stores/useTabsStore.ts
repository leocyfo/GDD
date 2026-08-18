import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TabKind =
  | 'overview'
  | 'section'
  | 'note'
  | 'changelog'
  | 'team'
  | 'features'
  | 'decisions'
  | 'milestones'
  | 'scopeMatrix'
  | 'loops'
  | 'assets'

export interface Tab {
  /** Deterministic from `(kind, refId)` — computed in `openTab`, never
   * passed in — so opening the same document twice focuses the existing
   * tab instead of duplicating it. */
  id: string
  kind: TabKind
  refId?: string
  title: string
  icon?: string
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (tab: Omit<Tab, 'id'>) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  closeOthers: (id: string) => void
}

function tabId(kind: TabKind, refId?: string): string {
  return `${kind}:${refId ?? 'default'}`
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (tab) => {
        const id = tabId(tab.kind, tab.refId)
        const exists = get().tabs.some((t) => t.id === id)
        set((state) => ({
          tabs: exists ? state.tabs : [...state.tabs, { ...tab, id }],
          activeTabId: id,
        }))
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get()
        const index = tabs.findIndex((t) => t.id === id)
        if (index === -1) return
        const nextTabs = tabs.filter((t) => t.id !== id)

        let nextActiveTabId = activeTabId
        if (activeTabId === id) {
          // Fall back to the tab that was to the left, else the new first
          // tab, else nothing.
          const fallback = nextTabs[Math.min(index, nextTabs.length - 1)]
          nextActiveTabId = fallback ? fallback.id : null
        }

        set({ tabs: nextTabs, activeTabId: nextActiveTabId })
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      reorderTabs: (fromIndex, toIndex) => {
        const tabs = [...get().tabs]
        if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) return
        const [moved] = tabs.splice(fromIndex, 1)
        tabs.splice(toIndex, 0, moved)
        set({ tabs })
      },

      closeOthers: (id) => {
        const tab = get().tabs.find((t) => t.id === id)
        if (!tab) return
        set({ tabs: [tab], activeTabId: id })
      },
    }),
    { name: 'gdd:tabs' },
  ),
)
