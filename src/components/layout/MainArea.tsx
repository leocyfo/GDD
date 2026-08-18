import { Menu } from 'lucide-react'
import { DocumentView } from '../documents/DocumentView'
import { EmptyMainArea } from '../documents/EmptyMainArea'
import { useTabsStore } from '../../stores/useTabsStore'
import { Breadcrumb } from './TabBar/Breadcrumb'
import { TabBar } from './TabBar/TabBar'
import { StatusBar } from './StatusBar/StatusBar'

export function MainArea({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center border-b border-border md:hidden">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenMobileSidebar}
          className="m-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text2 transition-colors hover:bg-inset"
        >
          <Menu size={16} />
        </button>
      </div>

      <TabBar />
      <Breadcrumb tab={activeTab} />

      <div className="min-h-0 flex-1 overflow-y-auto">{activeTab ? <DocumentView tab={activeTab} /> : <EmptyMainArea />}</div>

      {activeTab && <StatusBar tab={activeTab} />}
    </div>
  )
}
