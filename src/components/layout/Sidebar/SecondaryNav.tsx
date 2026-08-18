import { resolveIcon } from '../../../lib/icons'
import { SECONDARY_NAV_ITEMS } from '../../../nav/secondaryNav.config'
import { useTabsStore } from '../../../stores/useTabsStore'

export function SecondaryNav() {
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const openTab = useTabsStore((s) => s.openTab)

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Changelog and team">
      {SECONDARY_NAV_ITEMS.map((item) => {
        const Icon = resolveIcon(item.icon)
        const active = activeTabId === `${item.key}:default`
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => openTab({ kind: item.key, title: item.title, icon: item.icon })}
            aria-current={active ? 'page' : undefined}
            className={`flex h-8 items-center rounded-md pl-2.5 text-left text-sm font-medium transition-colors ${
              active ? 'bg-inset text-text1' : 'text-text2 hover:bg-inset/60'
            }`}
          >
            <Icon size={15} className={active ? 'text-text1' : 'text-text3'} />
            <span className="ml-2.5">{item.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
