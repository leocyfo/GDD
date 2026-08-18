import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { resolveIcon } from '../../../lib/icons'
import { useTabsStore } from '../../../stores/useTabsStore'

const TAB_WIDTH_PX = 130

/** Native horizontal scrollbars are unreliable to keep visible across
 * platforms — Windows Chromium in particular fades an overlay scrollbar in
 * only while actively scrolling. Tabs stay a fixed width and never
 * compress (that's the point — a stable strip you can scan), so once
 * enough are open the strip overflows and we draw our own thin, always-on
 * track/thumb underneath, mirrored from real scroll position — the same
 * thing VS Code's own tab strip does. */
function ScrollTrack({ scrollerRef, refreshToken }: { scrollerRef: React.RefObject<HTMLDivElement | null>; refreshToken: number }) {
  const [metrics, setMetrics] = useState({ thumbPct: 100, offsetPct: 0, overflowing: false })

  function readMetrics() {
    const el = scrollerRef.current
    if (!el) return
    const { scrollWidth, clientWidth, scrollLeft } = el
    const overflowing = scrollWidth > clientWidth + 1
    setMetrics({
      thumbPct: overflowing ? Math.max((clientWidth / scrollWidth) * 100, 4) : 100,
      offsetPct: overflowing ? (scrollLeft / scrollWidth) * 100 : 0,
      overflowing,
    })
  }

  useEffect(() => {
    readMetrics()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', readMetrics, { passive: true })
    const observer = new ResizeObserver(readMetrics)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', readMetrics)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

  if (!metrics.overflowing) return null

  function jumpTo(clientX: number, trackEl: HTMLDivElement) {
    const el = scrollerRef.current
    if (!el) return
    const rect = trackEl.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    el.scrollLeft = ratio * el.scrollWidth - el.clientWidth / 2
  }

  function beginDrag(event: React.PointerEvent) {
    event.stopPropagation()
    event.preventDefault()
    const el = scrollerRef.current
    if (!el) return
    const startX = event.clientX
    const startScrollLeft = el.scrollLeft
    // Arrow functions assigned to `const`, not `function` declarations —
    // TS only carries the `el` non-null narrowing from the guard above
    // into these closures this way (a hoisted `function` is treated as
    // callable before the narrowing, so TS forgets it).
    const onMove = (moveEvent: PointerEvent) => {
      const scale = el.scrollWidth / el.clientWidth
      el.scrollLeft = startScrollLeft + (moveEvent.clientX - startX) * scale
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="relative h-[5px] flex-shrink-0 cursor-pointer bg-inset"
      onPointerDown={(event) => jumpTo(event.clientX, event.currentTarget)}
    >
      <div
        className="absolute inset-y-0 cursor-grab rounded-full bg-border-hover active:cursor-grabbing"
        style={{ width: `${metrics.thumbPct}%`, left: `${metrics.offsetPct}%` }}
        onPointerDown={beginDrag}
      />
    </div>
  )
}

export function TabBar() {
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const setActiveTab = useTabsStore((s) => s.setActiveTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const reorderTabs = useTabsStore((s) => s.reorderTabs)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (tabs.length === 0) {
    return <div className="h-10 flex-shrink-0 border-b border-border" aria-hidden="true" />
  }

  return (
    <div className="flex-shrink-0 border-b border-border">
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Open documents"
        className="tabbar-scroll flex h-9 items-stretch overflow-x-auto"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon ? resolveIcon(tab.icon) : null
          const active = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) reorderTabs(dragIndex, index)
                setDragIndex(null)
              }}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveTab(tab.id)
                }
              }}
              style={{ width: TAB_WIDTH_PX }}
              className={`group flex flex-shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-2.5 text-xs-plus transition-colors ${
                active ? 'bg-app text-text1' : 'bg-sidebar text-text3 hover:text-text2'
              }`}
            >
              {Icon && <Icon size={12} className="flex-shrink-0" />}
              <span className="min-w-0 flex-1 truncate">{tab.title}</span>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  closeTab(tab.id)
                }}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-inset focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>
      <ScrollTrack scrollerRef={scrollerRef} refreshToken={tabs.length} />
    </div>
  )
}
