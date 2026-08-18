import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CommandPalette } from '../command-palette/CommandPalette'
import { MainArea } from './MainArea'
import { Sidebar } from './Sidebar/Sidebar'

export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Closing the drawer on every route change would need a router; instead
  // close it whenever the viewport grows past the mobile breakpoint so it
  // never gets stuck open behind the now-visible desktop sidebar.
  // `matchMedia` is absent in some test/embedded environments — guard
  // rather than let the whole shell crash over a resize convenience.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setMobileSidebarOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-app text-text1">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative z-10 flex">
            <Sidebar />
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute -right-10 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-inset text-text2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <MainArea onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <CommandPalette />
    </div>
  )
}
