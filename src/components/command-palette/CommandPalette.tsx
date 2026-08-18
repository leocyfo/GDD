import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useActiveProject, useSections } from '../../data/hooks/entityHooks'
import { resolveIcon } from '../../lib/icons'
import { SECONDARY_NAV_ITEMS } from '../../nav/secondaryNav.config'
import { useCommandPaletteStore } from '../../stores/useCommandPaletteStore'
import { useTabsStore } from '../../stores/useTabsStore'
import { Modal } from '../common/Modal'
import { STUB_COMMANDS } from './commands'

interface PaletteItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  disabledReason?: string
  run?: () => void
}

export function CommandPalette() {
  const isOpen = useCommandPaletteStore((s) => s.isOpen)
  const query = useCommandPaletteStore((s) => s.query)
  const close = useCommandPaletteStore((s) => s.close)
  const setQuery = useCommandPaletteStore((s) => s.setQuery)
  const openTab = useTabsStore((s) => s.openTab)
  const { data: project } = useActiveProject()
  const { data: sections } = useSections(project?.id)
  const [activeIndex, setActiveIndex] = useState(0)

  // The toggle shortcut must work whether or not the palette is currently
  // open, so this listener is always mounted — `Modal` (rendered only once
  // `isOpen`) owns Escape-to-close for the open case.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        useCommandPaletteStore.getState().toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) setActiveIndex(0)
  }, [isOpen])

  const items: PaletteItem[] = useMemo(() => {
    const navigate: PaletteItem[] = [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'LayoutDashboard',
        run: () => openTab({ kind: 'overview', title: 'Overview', icon: 'LayoutDashboard' }),
      },
      ...(sections ?? []).map((section) => ({
        id: `section:${section.key}`,
        label: `${section.index}. ${section.title}`,
        icon: section.icon,
        run: () => openTab({ kind: 'section', refId: section.key, title: section.title, icon: section.icon }),
      })),
      ...SECONDARY_NAV_ITEMS.map((item) => ({
        id: item.key,
        label: item.title,
        icon: item.icon,
        run: () => openTab({ kind: item.key, title: item.title, icon: item.icon }),
      })),
    ]
    const stubs: PaletteItem[] = STUB_COMMANDS.map((command) => ({
      id: command.id,
      label: command.label,
      disabled: true,
      disabledReason: command.disabledReason,
    }))
    return [...navigate, ...stubs]
  }, [sections, openTab])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items
  }, [items, query])

  if (!isOpen) return null

  const runItem = (item: PaletteItem) => {
    if (item.disabled || !item.run) return
    item.run()
    close()
  }

  return (
    <Modal onClose={close} ariaLabel="Command palette" widthClassName="max-w-lg" align="start">
      <div className="flex items-center gap-2 border-b border-border px-3.5">
        <Search size={15} className="flex-shrink-0 text-text3" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              const item = filtered[activeIndex]
              if (item) runItem(item)
            }
          }}
          placeholder="Navigate, create, insert a block…"
          aria-label="Command palette search"
          className="h-11 flex-1 bg-transparent text-sm-plus text-text1 outline-none placeholder:text-text3"
        />
        <kbd className="flex-shrink-0 rounded border border-border px-1.5 py-0.5 text-2xs text-text3">Esc</kbd>
      </div>

      <div role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-1.5">
        {filtered.length === 0 && <div className="p-4 text-center text-xs-plus text-text3">No matches.</div>}
        {filtered.map((item, index) => {
          const Icon = item.icon ? resolveIcon(item.icon) : null
          const active = index === activeIndex
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              disabled={item.disabled}
              title={item.disabledReason}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runItem(item)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm-plus transition-colors ${
                item.disabled ? 'cursor-not-allowed text-text3' : active ? 'bg-inset text-text1' : 'text-text2'
              }`}
            >
              {Icon && <Icon size={14} className="flex-shrink-0" />}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.disabled && <span className="flex-shrink-0 text-2xs text-text3">Soon</span>}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
