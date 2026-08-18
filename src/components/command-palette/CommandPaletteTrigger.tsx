import { Search } from 'lucide-react'
import { useCommandPaletteStore } from '../../stores/useCommandPaletteStore'

export function CommandPaletteTrigger() {
  const open = useCommandPaletteStore((s) => s.open)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  return (
    <button
      type="button"
      onClick={open}
      className="mb-3.5 flex h-8 w-full items-center gap-2 rounded-md border border-border bg-inset px-2.5 text-left text-xs-plus text-text3 transition-colors hover:border-border-hover"
    >
      <Search size={13} />
      <span className="flex-1">Search…</span>
      <kbd className="rounded border border-border px-1 py-0.5 font-mono text-2xs">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  )
}
