import { create } from 'zustand'
import { applyTheme, resolveInitialTheme, storeTheme, type Theme } from '../lib/theme'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialTheme = resolveInitialTheme()
// Applied at module-evaluation time (before React's first render) so the
// correct palette is already active for first paint — no flash of the
// wrong theme.
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme)
    storeTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))
