export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'gdd:theme'

function readStorage(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    // localStorage can throw in locked-down/private-browsing contexts —
    // fall back to system preference rather than crash the app.
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Non-fatal: theme still applies for this session, just won't persist.
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function resolveInitialTheme(): Theme {
  return readStorage() ?? getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}
