import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NavMode = 'gdd' | 'vault'

interface NavState {
  mode: NavMode
  activeVaultPath: string | null
  expandedVaultPaths: string[]
  setMode: (mode: NavMode) => void
  setActiveVaultPath: (path: string | null) => void
  toggleVaultPath: (path: string) => void
  isVaultPathExpanded: (path: string) => boolean
}

export const useNavStore = create<NavState>()(
  persist(
    (set, get) => ({
      mode: 'gdd',
      activeVaultPath: null,
      expandedVaultPaths: [],
      setMode: (mode) => set({ mode }),
      setActiveVaultPath: (path) => set({ activeVaultPath: path }),
      toggleVaultPath: (path) =>
        set((state) => ({
          expandedVaultPaths: state.expandedVaultPaths.includes(path)
            ? state.expandedVaultPaths.filter((p) => p !== path)
            : [...state.expandedVaultPaths, path],
        })),
      isVaultPathExpanded: (path) => get().expandedVaultPaths.includes(path),
    }),
    { name: 'gdd:nav' },
  ),
)
