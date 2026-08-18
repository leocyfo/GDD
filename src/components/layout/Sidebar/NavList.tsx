import { LayoutDashboard } from 'lucide-react'
import { useActiveProject, useSections } from '../../../data/hooks/entityHooks'
import { resolveIcon } from '../../../lib/icons'
import { toneForFreshness } from '../../../lib/tones'
import { useTabsStore } from '../../../stores/useTabsStore'
import { StatusDot } from '../../common/StatusDot'

function navItemClass(active: boolean): string {
  return `flex h-8 items-center rounded-md pl-2.5 pr-2 text-left text-sm font-medium transition-colors ${
    active ? 'bg-inset text-text1' : 'text-text2 hover:bg-inset/60'
  }`
}

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-1 py-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 rounded-md bg-inset/60" />
      ))}
    </div>
  )
}

export function NavList() {
  const { data: project } = useActiveProject()
  const { data: sections, loading } = useSections(project?.id)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const openTab = useTabsStore((s) => s.openTab)

  const isOverviewActive = activeTabId === 'overview:default'

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Game design document sections">
      <button
        type="button"
        onClick={() => openTab({ kind: 'overview', title: 'Overview', icon: 'LayoutDashboard' })}
        aria-current={isOverviewActive ? 'page' : undefined}
        className={navItemClass(isOverviewActive)}
      >
        <LayoutDashboard size={15} className={isOverviewActive ? 'text-text1' : 'text-text3'} />
        <span className="ml-2.5 truncate">Overview</span>
      </button>

      {loading && <NavSkeleton />}

      {sections?.map((section) => {
        const Icon = resolveIcon(section.icon)
        const active = activeTabId === `section:${section.key}`
        return (
          <button
            key={section.id}
            type="button"
            onClick={() =>
              openTab({ kind: 'section', refId: section.key, title: section.title, icon: section.icon })
            }
            aria-current={active ? 'page' : undefined}
            className={navItemClass(active)}
          >
            <Icon size={15} className={active ? 'text-text1' : 'text-text3'} />
            <span className="ml-2.5 min-w-0 flex-1 truncate text-left">
              <span className="text-text3">{section.index}.</span> {section.title}
            </span>
            <StatusDot tone={toneForFreshness(section.freshness)} className="ml-1.5" />
          </button>
        )
      })}
    </nav>
  )
}
