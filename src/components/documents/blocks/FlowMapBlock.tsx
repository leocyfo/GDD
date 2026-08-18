import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Block, FlowMapEdge, FlowMapNode, FlowMapShape } from '../../../data/types/entities'

type FlowMapBlockType = Extract<Block, { type: 'flowMap' }>

interface ConnectorLine {
  key: string
  path: string
  labelX: number
  labelY: number
  label?: string
}

const SHAPE_LABEL: Record<FlowMapShape, string> = {
  start: 'Start',
  end: 'End',
  process: 'Process',
  decision: 'Decision',
}

const SHAPE_CLASS: Record<FlowMapShape, string> = {
  start: 'rounded-full border-2 border-green bg-green/10',
  end: 'rounded-full border-2 border-blue bg-blue/10',
  process: 'rounded-md border border-border bg-card',
  decision: 'border-2 border-amber bg-amber/10',
}

/** A node's column is however many hops it is from the nearest node with
 * no incoming edges — computed from `edges` rather than authored, so a
 * node that says who it connects to is already positioned correctly; there
 * is no separate column number that could ever drift out of sync with what
 * the connections actually say. Cycle-safe: a node still being resolved
 * higher up the call stack just reports column 0 instead of recursing
 * forever (a real flow shouldn't have cycles — this only stops a malformed
 * one from hanging the page). */
function computeColumns(nodes: FlowMapNode[], edges: FlowMapEdge[]): Map<string, number> {
  const predecessors = new Map<string, string[]>(nodes.map((n) => [n.id, []]))
  for (const edge of edges) {
    predecessors.get(edge.to)?.push(edge.from)
  }
  const columns = new Map<string, number>()
  const resolving = new Set<string>()
  function columnFor(id: string): number {
    if (columns.has(id)) return columns.get(id)!
    if (resolving.has(id)) return 0
    resolving.add(id)
    const preds = predecessors.get(id) ?? []
    const column = preds.length === 0 ? 0 : Math.max(...preds.map(columnFor)) + 1
    resolving.delete(id)
    columns.set(id, column)
    return column
  }
  for (const node of nodes) columnFor(node.id)
  return columns
}

/** Diamond shape via `clip-path` rather than a rotated square — a rotated
 * element's own bounding box (what `getBoundingClientRect` reports) would
 * be its 45°-rotated footprint, not its visual diamond, which would throw
 * off the arrow anchors computed below. `clip-path` keeps the box's real
 * rect equal to what's visually drawn. */
const DIAMOND_CLIP = 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)'

function FlowMapNodeCard({ node }: { node: FlowMapNode }) {
  const isDecision = node.shape === 'decision'
  return (
    <div
      title={node.note}
      className={`flex flex-col items-center justify-center gap-0.5 text-center ${SHAPE_CLASS[node.shape]} ${
        isDecision ? 'h-24 w-36 px-6' : 'min-h-[3.25rem] min-w-[6.5rem] px-3 py-2'
      }`}
      style={isDecision ? { clipPath: DIAMOND_CLIP } : undefined}
    >
      {isDecision && <span className="text-2xs font-semibold uppercase tracking-wide text-amber">Decision</span>}
      <span className="text-sm-plus font-medium leading-tight text-text1">{node.label}</span>
    </div>
  )
}

/** The diagram itself — nodes placed on a grid (row authored, column
 * computed from `edges` — see `computeColumns`), connectors drawn as an
 * absolutely-positioned SVG overlay on top. Positions are measured
 * from the real rendered DOM (`getBoundingClientRect`, same technique the
 * Controls Diagram uses for its key callouts) rather than computed from
 * `row`/`col` math, so a connector always points at wherever a node
 * actually ended up on screen, including on window resize.
 *
 * Anchors are always "source's right edge → target's left edge", curving
 * vertically between them when the two nodes aren't on the same row — a
 * deliberate simplification for flows that read predominantly left to
 * right (every flow authored in this app so far), rather than full
 * orthogonal routing. */
export function FlowMapDiagram({ nodes, edges }: { nodes: FlowMapNode[]; edges: FlowMapEdge[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())
  const [lines, setLines] = useState<ConnectorLine[]>([])
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    function measure() {
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const nextLines: ConnectorLine[] = []
      for (const edge of edges) {
        const fromEl = nodeRefs.current.get(edge.from)
        const toEl = nodeRefs.current.get(edge.to)
        if (!fromEl || !toEl) continue
        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()
        const fromX = fromRect.right - containerRect.left
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2
        const toX = toRect.left - containerRect.left
        const toY = toRect.top - containerRect.top + toRect.height / 2
        const midX = (fromX + toX) / 2
        nextLines.push({
          key: `${edge.from}->${edge.to}`,
          path: `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`,
          labelX: midX,
          labelY: (fromY + toY) / 2,
          label: edge.label,
        })
      }
      setLines(nextLines)
      setOverlaySize({ width: container.scrollWidth, height: container.scrollHeight })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [nodes, edges])

  const columnById = useMemo(() => computeColumns(nodes, edges), [nodes, edges])
  const columnCount = Math.max(0, ...Array.from(columnById.values())) + 1
  const rowCount = Math.max(0, ...nodes.map((n) => n.row)) + 1

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-inset p-5">
      <div
        ref={containerRef}
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(7rem, 1fr))`,
          gridTemplateRows: `repeat(${rowCount}, minmax(4rem, auto))`,
          columnGap: '2.25rem',
          rowGap: '1.5rem',
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={overlaySize.width}
          height={overlaySize.height}
          aria-hidden="true"
        >
          <defs>
            <marker id="flowmap-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-text3" />
            </marker>
          </defs>
          {lines.map((line) => (
            <g key={line.key}>
              <path d={line.path} className="fill-none stroke-text3" strokeWidth={1.5} markerEnd="url(#flowmap-arrowhead)" />
              {line.label && (
                <text x={line.labelX} y={line.labelY - 7} textAnchor="middle" className="fill-text3 text-[10px]">
                  {line.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(node.id, el)
              return () => {
                nodeRefs.current.delete(node.id)
              }
            }}
            style={{ gridColumn: (columnById.get(node.id) ?? 0) + 1, gridRow: node.row + 1 }}
            className="relative z-10 flex items-center justify-self-center"
          >
            <FlowMapNodeCard node={node} />
          </div>
        ))}

        {nodes.length === 0 && <p className="text-sm text-text3">No steps yet.</p>}
      </div>
    </div>
  )
}

export function FlowMapLegend() {
  const shapes: FlowMapShape[] = ['start', 'process', 'decision', 'end']
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-0.5 text-2xs text-text3">
      {shapes.map((shape) => (
        <span key={shape} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-block h-3 w-3 ${
              shape === 'start' || shape === 'end' ? 'rounded-full' : shape === 'decision' ? '' : 'rounded-sm'
            } ${SHAPE_CLASS[shape]}`}
            style={shape === 'decision' ? { clipPath: DIAMOND_CLIP } : undefined}
          />
          {SHAPE_LABEL[shape]}
        </span>
      ))}
    </div>
  )
}

export function FlowMapBlockView({ block }: { block: FlowMapBlockType }) {
  return (
    <div className="flex flex-col gap-2">
      <FlowMapDiagram nodes={block.nodes} edges={block.edges} />
      <FlowMapLegend />
    </div>
  )
}
