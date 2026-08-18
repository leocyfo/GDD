import { LayoutDashboard } from 'lucide-react'
import { useTabsStore } from '../../stores/useTabsStore'

export function EmptyMainArea() {
  const openTab = useTabsStore((s) => s.openTab)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <LayoutDashboard size={22} className="text-text3" />
      <div className="text-sm-plus font-medium text-text1">No document open</div>
      <p className="max-w-xs text-xs-plus text-text3">Pick a section from the sidebar, or start from the Overview.</p>
      <button
        type="button"
        onClick={() => openTab({ kind: 'overview', title: 'Overview', icon: 'LayoutDashboard' })}
        className="mt-1 rounded-md border border-border bg-inset px-3 py-1.5 text-xs-plus text-text2 transition-colors hover:border-border-hover"
      >
        Open Overview
      </button>
    </div>
  )
}
