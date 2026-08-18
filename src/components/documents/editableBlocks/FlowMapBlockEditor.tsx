import { ChevronDown, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { Block, FlowMapEdge, FlowMapNode, FlowMapShape } from '../../../data/types/entities'
import { selectClass } from '../../editor/fieldStyles'
import { FlowMapDiagram, FlowMapLegend } from '../blocks/FlowMapBlock'

type FlowMapBlockType = Extract<Block, { type: 'flowMap' }>

const SHAPES: FlowMapShape[] = ['start', 'process', 'decision', 'end']

/** Same "looks like plain table text at rest" treatment as the Controls
 * Diagram editor's table — border and background only show up on
 * hover/focus, so this reads like the read-only view with editable cells
 * underneath rather than a separate, bulkier input table. */
const cellInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-text1 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-card'

export function FlowMapBlockEditor({ block, onChange }: { block: FlowMapBlockType; onChange: (b: Block) => void }) {
  // Editing steps is the rare action — reading the diagram is the common
  // one — so the table stays tucked away behind this toggle instead of
  // always taking up space under every flow map in the document.
  const [showEditor, setShowEditor] = useState(false)

  function updateNode(index: number, patch: Partial<FlowMapNode>) {
    onChange({ ...block, nodes: block.nodes.map((node, i) => (i === index ? { ...node, ...patch } : node)) })
  }

  function removeNode(index: number) {
    const removedId = block.nodes[index].id
    // Drop any edge touching the removed node too — otherwise it lingers
    // in `edges` referencing an id nothing has anymore.
    onChange({
      ...block,
      nodes: block.nodes.filter((_, i) => i !== index),
      edges: block.edges.filter((edge) => edge.from !== removedId && edge.to !== removedId),
    })
  }

  function addNode() {
    const previous = block.nodes[block.nodes.length - 1]
    const node: FlowMapNode = { id: `node:${crypto.randomUUID()}`, label: '', shape: 'process', row: previous?.row ?? 0 }
    // Auto-chain from whatever step was added last — right for the common
    // case (a straight line), and for a branch it's still less work than
    // wiring the connection from scratch: just remove it below if it's the
    // wrong source.
    const edges = previous ? [...block.edges, { from: previous.id, to: node.id }] : block.edges
    onChange({ ...block, nodes: [...block.nodes, node], edges })
  }

  function updateEdge(index: number, patch: Partial<FlowMapEdge>) {
    onChange({ ...block, edges: block.edges.map((edge, i) => (i === index ? { ...edge, ...patch } : edge)) })
  }

  function removeEdge(index: number) {
    onChange({ ...block, edges: block.edges.filter((_, i) => i !== index) })
  }

  function connect(fromId: string, toId: string) {
    onChange({ ...block, edges: [...block.edges, { from: fromId, to: toId }] })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <FlowMapDiagram nodes={block.nodes} edges={block.edges} />
        <button
          type="button"
          onClick={() => setShowEditor((v) => !v)}
          aria-expanded={showEditor}
          aria-label={showEditor ? 'Hide steps and connections' : 'Edit steps and connections'}
          title={showEditor ? 'Hide steps and connections' : 'Edit steps and connections'}
          className="absolute -bottom-3.5 right-5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-text3 shadow-card transition-colors hover:border-border-hover hover:text-text1"
        >
          <ChevronDown size={15} className={`transition-transform duration-200 ${showEditor ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <FlowMapLegend />

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showEditor ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] border-collapse text-sm-plus">
              <thead>
                <tr className="border-b border-border bg-inset">
                  <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Shape</th>
                  <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Label</th>
                  <th className="w-14 px-2 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Row</th>
                  <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Connects to</th>
                  <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Note</th>
                  <th className="w-8 px-1 py-2" />
                </tr>
              </thead>
              <tbody>
                {block.nodes.map((node, index) => {
                  const outgoing = block.edges
                    .map((edge, edgeIndex) => ({ edge, edgeIndex }))
                    .filter(({ edge }) => edge.from === node.id)
                  const connectedIds = new Set(outgoing.map(({ edge }) => edge.to))
                  const availableTargets = block.nodes.filter((n) => n.id !== node.id && !connectedIds.has(n.id))

                  return (
                    <tr key={node.id} className="border-b border-border last:border-b-0">
                      <td className="px-1.5 py-1.5 align-top">
                        <select
                          value={node.shape}
                          onChange={(event) => updateNode(index, { shape: event.target.value as FlowMapShape })}
                          className={`${selectClass} w-full capitalize`}
                        >
                          {SHAPES.map((shape) => (
                            <option key={shape} value={shape}>
                              {shape}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1.5 align-top">
                        <input
                          value={node.label}
                          onChange={(event) => updateNode(index, { label: event.target.value })}
                          placeholder="Step"
                          className={cellInputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5 align-top">
                        <input
                          type="number"
                          value={node.row}
                          onChange={(event) => updateNode(index, { row: Number(event.target.value) })}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="px-1.5 py-1.5 align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {outgoing.map(({ edge, edgeIndex }) => {
                            const target = block.nodes.find((n) => n.id === edge.to)
                            return (
                              <span
                                key={edgeIndex}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-inset py-0.5 pl-2 pr-1 text-2xs text-text2"
                              >
                                → {target?.label || '(untitled step)'}
                                <input
                                  value={edge.label ?? ''}
                                  onChange={(event) => updateEdge(edgeIndex, { label: event.target.value })}
                                  placeholder="label"
                                  className="w-14 min-w-0 rounded border-none bg-transparent px-0.5 py-0 text-2xs text-text3 outline-none placeholder:text-text3/60 focus-visible:bg-card"
                                />
                                <button
                                  type="button"
                                  aria-label={`Remove connection to ${target?.label || 'step'}`}
                                  onClick={() => removeEdge(edgeIndex)}
                                  className="text-text3 hover:text-red"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            )
                          })}
                          {availableTargets.length > 0 && (
                            <select
                              value=""
                              onChange={(event) => {
                                if (event.target.value) connect(node.id, event.target.value)
                              }}
                              className="rounded-full border border-dashed border-border bg-transparent px-2 py-0.5 text-2xs text-text3 outline-none transition-colors hover:border-border-hover"
                            >
                              <option value="">+ connect…</option>
                              {availableTargets.map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.label || '(untitled step)'}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-1.5 align-top">
                        <input
                          value={node.note ?? ''}
                          onChange={(event) => updateNode(index, { note: event.target.value })}
                          placeholder="Optional note (shows on hover)"
                          className={cellInputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center align-top">
                        <button type="button" aria-label="Remove step" onClick={() => removeNode(index)} className="text-text3 hover:text-red">
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {block.nodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-text3">
                      No steps yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addNode} className="flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2">
            <Plus size={11} />
            Add step
          </button>
        </div>
      </div>
    </div>
  )
}
