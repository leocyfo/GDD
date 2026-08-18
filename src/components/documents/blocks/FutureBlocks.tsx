import { GitBranch, Search, TriangleAlert } from 'lucide-react'
import type { Block } from '../../../data/types/entities'
import { useMermaidRender } from '../../../lib/useMermaidRender'

type QueryBlock = Extract<Block, { type: 'query' }>
type DiagramBlock = Extract<Block, { type: 'diagram' }>

/** The query language is still Phase 4 work — the expression is real,
 * stored data, so it's shown as-authored rather than hidden, with a clear
 * (not silent) note that live evaluation isn't wired up yet. */
export function QueryBlockView({ block }: { block: QueryBlock }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-inset p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-text3">
        <Search size={12} />
        Live query — results ship in a later phase
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs-plus text-text2">{block.expression}</pre>
    </div>
  )
}

/** Diagram rendering *is* wired up (`useMermaidRender`) — real mermaid
 * source becomes a real SVG. Three states beyond the happy path: empty
 * (nothing authored yet), loading (the mermaid chunk is still being
 * fetched — only happens the first time a diagram block is on screen),
 * and a render error (invalid syntax) — the last one falls back to the
 * raw source instead of a blank block, same as a bad seed graph fails
 * loudly rather than silently. */
export function DiagramBlockView({ block }: { block: DiagramBlock }) {
  const { svg, error, loading } = useMermaidRender(block.mermaid)

  if (!block.mermaid.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-inset p-3.5">
        <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-text3">
          <GitBranch size={12} />
          Diagram
        </div>
        <p className="mt-2 text-sm text-text3">No diagram source yet.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-inset" aria-hidden="true" />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-red/40 bg-inset p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-red">
          <TriangleAlert size={12} />
          Couldn&rsquo;t render this diagram
        </div>
        <p className="mb-2 text-xs-plus text-red">{error}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs-plus text-text2">{block.mermaid}</pre>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border bg-inset p-3.5 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  )
}
