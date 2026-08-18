import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../stores/useThemeStore'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <IconButton
      icon={theme === 'dark' ? Sun : Moon}
      label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
    />
  )
}
