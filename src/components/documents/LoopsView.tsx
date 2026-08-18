import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import { useActiveProject, useLoops } from '../../data/hooks/entityHooks'
import { createLoop } from '../../data/newLoop'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { Loop, LoopEdge, LoopNode } from '../../data/types/entities'
import { useAutosave } from '../../lib/useAutosave'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { SaveIndicator } from '../common/SaveIndicator'
import { LoopDiagram } from './blocks/LinkedBlocks'
import { EmptyDocument } from './EmptyDocument'

const cellInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-text1 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-card'
/** Same "grows with the text instead of clipping it" fix as the Scope
 * Matrix and Asset List tables — a plain `<input>` can't wrap, so a
 * longer step/note/label just got clipped with no sign there was more. */
const cellTextareaClass = `${cellInputClass} resize-none overflow-hidden [field-sizing:content]`

function LoopEditor({ loop }: { loop: Loop }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [name, setName] = useState(loop.name)
  const [nodes, setNodes] = useState(loop.nodes)
  const [edges, setEdges] = useState(loop.edges)

  async function persist(fields: Partial<Loop>, summary: string) {
    await repo.loops.update(loop.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'loop', id: loop.id, label: fields.name ?? loop.name },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => persist({ name: v }, 'Renamed a loop.'))
  const graphSave = useAutosave<{ nodes: LoopNode[]; edges: LoopEdge[] }>((v) => persist({ nodes: v.nodes, edges: v.edges }, 'Edited loop steps.'))

  function commitGraph(nextNodes: LoopNode[], nextEdges: LoopEdge[]) {
    setNodes(nextNodes)
    setEdges(nextEdges)
    graphSave.schedule({ nodes: nextNodes, edges: nextEdges })
  }

  function updateNode(index: number, patch: Partial<LoopNode>) {
    commitGraph(
      nodes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
      edges,
    )
  }
  function removeNode(index: number) {
    const removedId = nodes[index].id
    commitGraph(
      nodes.filter((_, i) => i !== index),
      edges.filter((e) => e.from !== removedId && e.to !== removedId),
    )
  }
  function addNode() {
    commitGraph([...nodes, { id: `node:${crypto.randomUUID()}`, verb: '', note: '' }], edges)
  }
  function moveNode(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= nodes.length) return
    const next = [...nodes]
    ;[next[index], next[target]] = [next[target], next[index]]
    commitGraph(next, edges)
  }

  function updateEdge(index: number, patch: Partial<LoopEdge>) {
    commitGraph(
      nodes,
      edges.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    )
  }
  function removeEdge(index: number) {
    commitGraph(
      nodes,
      edges.filter((_, i) => i !== index),
    )
  }
  function addEdge() {
    const from = nodes[nodes.length - 1]?.id ?? ''
    commitGraph(nodes, [...edges, { from, to: '' }])
  }

  async function removeLoop() {
    await repo.loops.delete(loop.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'loop', id: loop.id, label: loop.name },
        kind: 'deleted',
        diffSummary: 'Removed a loop.',
      })
    }
    notifyDataChanged()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            nameSave.schedule(event.target.value)
          }}
          onBlur={nameSave.flush}
          placeholder="Loop name"
          className={`${inputClass} min-w-0 max-w-xs flex-1 text-sm-plus font-semibold`}
        />
        <div className="flex flex-shrink-0 items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs-plus text-text2">
            <input
              type="checkbox"
              checked={loop.isCycle}
              onChange={(event) => persist({ isCycle: event.target.checked }, 'Toggled whether the loop repeats.')}
              className="h-3.5 w-3.5 accent-accent"
            />
            Repeats (cycle)
          </label>
          <SaveIndicator state={nameSave.state === 'idle' ? graphSave.state : nameSave.state} />
          <button type="button" aria-label="Delete loop" onClick={removeLoop} className="text-text3 hover:text-red">
            <X size={14} />
          </button>
        </div>
      </div>

      <LoopDiagram nodes={nodes} isCycle={loop.isCycle} />

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] border-collapse text-sm-plus">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '58%' }} />
            <col style={{ width: '4%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-inset">
              <th className="w-12 px-2 py-1.5" />
              <th className="px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Step</th>
              <th className="px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Note</th>
              <th className="w-8 px-1 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {nodes.map((node, index) => (
              <tr key={node.id} className="border-b border-border last:border-b-0">
                <td className="px-1 py-1 align-top">
                  <div className="flex items-center gap-0.5">
                    <button type="button" aria-label="Move step up" disabled={index === 0} onClick={() => moveNode(index, -1)} className="text-text3 hover:text-text1 disabled:opacity-30">
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="Move step down"
                      disabled={index === nodes.length - 1}
                      onClick={() => moveNode(index, 1)}
                      className="text-text3 hover:text-text1 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="px-1 py-1 align-top">
                  <textarea
                    value={node.verb}
                    onChange={(event) => updateNode(index, { verb: event.target.value })}
                    rows={1}
                    placeholder="Drop, Loot…"
                    className={cellTextareaClass}
                  />
                </td>
                <td className="px-1 py-1 align-top">
                  <textarea
                    value={node.note}
                    onChange={(event) => updateNode(index, { note: event.target.value })}
                    rows={1}
                    placeholder="What happens here"
                    className={cellTextareaClass}
                  />
                </td>
                <td className="px-1 py-1 text-center align-top">
                  <button type="button" aria-label="Remove step" onClick={() => removeNode(index)} className="text-text3 hover:text-red">
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-sm text-text3">
                  No steps yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addNode} className="mt-1.5 flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2">
        <Plus size={11} />
        Add step
      </button>

      {nodes.length > 1 && (
        <>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] border-collapse text-sm-plus">
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-inset">
                  <th className="px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-text3">From</th>
                  <th className="px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-text3">To</th>
                  <th className="px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Label</th>
                  <th className="w-8 px-1 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {edges.map((edge, index) => (
                  <tr key={index} className="border-b border-border last:border-b-0">
                    <td className="px-1.5 py-1 align-top">
                      <select value={edge.from} onChange={(event) => updateEdge(index, { from: event.target.value })} className={`${selectClass} w-full`}>
                        <option value="">Choose a step…</option>
                        {nodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.verb || '(untitled step)'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1.5 py-1 align-top">
                      <select value={edge.to} onChange={(event) => updateEdge(index, { to: event.target.value })} className={`${selectClass} w-full`}>
                        <option value="">Choose a step…</option>
                        {nodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.verb || '(untitled step)'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1 align-top">
                      <textarea
                        value={edge.label ?? ''}
                        onChange={(event) => updateEdge(index, { label: event.target.value })}
                        rows={1}
                        placeholder="Optional label"
                        className={cellTextareaClass}
                      />
                    </td>
                    <td className="px-1 py-1 text-center align-top">
                      <button type="button" aria-label="Remove connection" onClick={() => removeEdge(index)} className="text-text3 hover:text-red">
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {edges.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-center text-sm text-text3">
                      No branches — the diagram above just chains the steps in order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addEdge} className="mt-1.5 flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2">
            <Plus size={11} />
            Add named connection
          </button>
        </>
      )}
    </div>
  )
}

function NewLoopForm() {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const loop = await createLoop(repo, { projectId: project.id, name: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'loop', id: loop.id, label: loop.name },
        kind: 'created',
        diffSummary: 'New loop.',
      })
      notifyDataChanged()
      setName('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs-plus text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={12} />
        New loop
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-md border border-dashed border-border bg-inset p-2">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Core Loop" className={inputClass} />
      <button type="submit" disabled={!name.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
        {busy ? 'Creating…' : 'Create'}
      </button>
      <button type="button" aria-label="Cancel" onClick={() => setCreating(false)} className="flex-shrink-0 rounded-md border border-border p-1.5 text-text2 hover:border-border-hover">
        <X size={14} />
      </button>
    </form>
  )
}

export function LoopsView() {
  const { data: project } = useActiveProject()
  const { data: loops, loading } = useLoops(project?.id)

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-8" aria-hidden="true">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-inset" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-8 py-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-md font-semibold text-text1">Gameplay Loops</h1>
          <p className="mt-1 text-xs-plus text-text3">
            {(loops ?? []).length} {(loops ?? []).length === 1 ? 'loop' : 'loops'} — reference them from any section with a "Gameplay loop"
            block.
          </p>
        </div>
        <NewLoopForm />
      </div>

      {(!loops || loops.length === 0) && (
        <EmptyDocument title="No loops yet" body="Add the first one — what does a player do, over and over, every match?" />
      )}

      <div className="flex flex-col gap-4">
        {(loops ?? []).map((loop) => (
          <LoopEditor key={loop.id} loop={loop} />
        ))}
      </div>
    </div>
  )
}
