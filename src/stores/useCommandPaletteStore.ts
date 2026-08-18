import { create } from 'zustand'

interface CommandPaletteState {
  isOpen: boolean
  query: string
  open: () => void
  close: () => void
  toggle: () => void
  setQuery: (query: string) => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({
  isOpen: false,
  query: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => (get().isOpen ? get().close() : get().open()),
  setQuery: (query) => set({ query }),
}))
