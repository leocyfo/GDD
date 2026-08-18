import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, useDecisions, useFeatureCards, useLogicNotes, useLoops, useScopeEntries } from '../../../data/hooks/entityHooks'
import { createScopeEntry } from '../../../data/newScopeEntry'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { Block, ScopeEntry, ScopeVerdict } from '../../../data/types/entities'
import { useAutosave } from '../../../lib/useAutosave'
import { toneForScopeVerdict } from '../../../lib/tones'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { StatusDot } from '../../common/StatusDot'
import { EmbedNoteBlockView, FeatureCardsBlockView, LoopBlockView } from '../blocks/LinkedBlocks'
import { inputClass, selectClass } from '../../editor/fieldStyles'

type LoopBlock = Extract<Block, { type: 'loop' }>
type FeatureCardsBlock = Extract<Block, { type: 'featureCards' }>
type ScopeMatrixBlock = Extract<Block, { type: 'scopeMatrix' }>
type EmbedNoteBlock = Extract<Block, { type: 'embedNote' }>

const SCOPE_VERDICTS: ScopeVerdict[] = ['undecided', 'in', 'out', 'stretch']
/** The type's own contract (see `ScopeEntry.decisionId` in entities.ts):
 * an "in"/"out" verdict is a real commitment, so it must point at a
 * decision or a piece of evidence — enforced here, the one place scope
 * entries are actually edited. */
const VERDICTS_REQUIRING_JUSTIFICATION: ScopeVerdict[] = ['in', 'out']

// These blocks reference other data (a loop, a set of feature cards, a
// note) rather than holding content directly — so editing means "which
// one", and the real, already-built read view is what shows the result.
// Showing that preview by default (instead of always defaulting to a bare
// picker) is what keeps a section that already references a loop reading
// as a real GDD page, not a form.

export function LoopBlockEditor({ block, onChange }: { block: LoopBlock; onChange: (b: Block) => void }) {
  const { data: project } = useActiveProject()
  const { data: loops } = useLoops(project?.id)
  return (
    <div className="flex flex-col gap-2">
      {block.loopId && <LoopBlockView block={block} />}
      <select value={block.loopId} onChange={(event) => onChange({ ...block, loopId: event.target.value })} className={selectClass}>
        <option value="">Choose a loop…</option>
        {(loops ?? []).map((loop) => (
          <option key={loop.id} value={loop.id}>
            {loop.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FeatureCardsBlockEditor({ block, onChange }: { block: FeatureCardsBlock; onChange: (b: Block) => void }) {
  const { data: project } = useActiveProject()
  const { data: cards } = useFeatureCards(project?.id)
  const available = (cards ?? []).filter((card) => !block.featureIds.includes(card.id))

  return (
    <div className="flex flex-col gap-2">
      {block.featureIds.length > 0 && <FeatureCardsBlockView block={block} />}
      <div className="flex flex-wrap gap-1.5">
        {block.featureIds.map((id) => {
          const card = (cards ?? []).find((c) => c.id === id)
          return (
            <span key={id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-2xs text-text2">
              {card?.name ?? id}
              <button
                type="button"
                aria-label="Remove feature card"
                onClick={() => onChange({ ...block, featureIds: block.featureIds.filter((existing) => existing !== id) })}
                className="text-text3 hover:text-red"
              >
                <X size={10} />
              </button>
            </span>
          )
        })}
      </div>
      {available.length > 0 && (
        <select
          value=""
          onChange={(event) => event.target.value && onChange({ ...block, featureIds: [...block.featureIds, event.target.value] })}
          className={selectClass}
        >
          <option value="">Add a feature card…</option>
          {available.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

/** Exported alongside `NewScopeEntryForm` below — the dedicated Scope
 * Matrix screen (`ScopeMatrixView.tsx`) reuses both directly rather than
 * forking the guard-rail logic, since a `scopeMatrix` block can still be
 * dropped into any section via "Add block" and needs to keep working
 * exactly the same way. */
export function ScopeEntryRow({ entry, decisions, onRemoved }: { entry: ScopeEntry; decisions: { id: string; title: string }[]; onRemoved: () => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [item, setItem] = useState(entry.item)
  const [evidenceUrl, setEvidenceUrl] = useState(entry.evidenceUrl ?? '')
  const [guardMessage, setGuardMessage] = useState<string | null>(null)

  async function patch(fields: Partial<ScopeEntry>, summary: string) {
    await repo.scopeEntries.update(entry.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'scope-entry', id: entry.id, label: entry.item },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const itemSave = useAutosave<string>((v) => patch({ item: v }, 'Renamed a scope item.'))
  const evidenceSave = useAutosave<string>(async (v) => {
    if (VERDICTS_REQUIRING_JUSTIFICATION.includes(entry.verdict) && !v && !entry.decisionId) {
      setGuardMessage('This item is in/out — link a decision before clearing its evidence.')
      setEvidenceUrl(entry.evidenceUrl ?? '')
      return
    }
    setGuardMessage(null)
    await patch({ evidenceUrl: v || null }, 'Updated the evidence link.')
  })

  const isJustified = Boolean(entry.decisionId || entry.evidenceUrl)

  function changeVerdict(verdict: ScopeVerdict) {
    if (VERDICTS_REQUIRING_JUSTIFICATION.includes(verdict) && !isJustified) {
      setGuardMessage('Link a decision or evidence before marking this in or out.')
      return
    }
    setGuardMessage(null)
    patch({ verdict }, `Marked "${entry.item}" as ${verdict}.`)
  }

  function changeDecision(decisionId: string) {
    const nextDecisionId = decisionId || null
    if (!nextDecisionId && !entry.evidenceUrl && VERDICTS_REQUIRING_JUSTIFICATION.includes(entry.verdict)) {
      setGuardMessage('This item is in/out — link evidence before removing its decision.')
      return
    }
    setGuardMessage(null)
    patch({ decisionId: nextDecisionId }, 'Linked a decision.')
  }

  async function remove() {
    await repo.scopeEntries.delete(entry.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'scope-entry', id: entry.id, label: entry.item },
        kind: 'deleted',
        diffSummary: 'Removed a scope item.',
      })
    }
    notifyDataChanged()
    onRemoved()
  }

  return (
    <>
      <tr className="border-b border-border last:border-b-0">
        <td className="px-3 py-1.5 align-top">
          {/* A plain `<input>` can't wrap — a longer scope item just got
           * clipped inside it with no sign there was more. `field-sizing:
           * content` grows the box with the text instead of cutting it
           * off — same fix as the table block's cells (`TextBlockEditors.tsx`). */}
          <textarea
            value={item}
            onChange={(event) => {
              setItem(event.target.value)
              itemSave.schedule(event.target.value)
            }}
            onBlur={itemSave.flush}
            rows={1}
            className={`${inputClass} resize-none overflow-hidden text-sm-plus [field-sizing:content]`}
          />
        </td>
        <td className="px-3 py-1.5 align-top">
          <div className="flex items-center gap-1.5">
            <StatusDot tone={toneForScopeVerdict(entry.verdict)} />
            <select
              value={entry.verdict}
              onChange={(event) => changeVerdict(event.target.value as ScopeVerdict)}
              className={`${selectClass} w-full text-2xs capitalize`}
            >
              {SCOPE_VERDICTS.map((verdict) => (
                <option key={verdict} value={verdict}>
                  {verdict}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-3 py-1.5 align-top">
          <select value={entry.decisionId ?? ''} onChange={(event) => changeDecision(event.target.value)} className={`${selectClass} w-full text-2xs`}>
            <option value="">No decision</option>
            {decisions.map((decision) => (
              <option key={decision.id} value={decision.id}>
                {decision.title}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-1.5 align-top">
          <input
            value={evidenceUrl}
            placeholder="Evidence URL"
            onChange={(event) => {
              setEvidenceUrl(event.target.value)
              evidenceSave.schedule(event.target.value)
            }}
            onBlur={evidenceSave.flush}
            className={`${inputClass} font-mono text-2xs`}
          />
        </td>
        <td className="px-2 py-1.5 align-top">
          <button type="button" aria-label="Remove scope item" onClick={remove} className="flex-shrink-0 text-text3 hover:text-red">
            <X size={12} />
          </button>
        </td>
      </tr>
      {guardMessage && (
        <tr>
          <td colSpan={5} className="border-b border-border px-3 pb-1.5 text-2xs text-red">
            {guardMessage}
          </td>
        </tr>
      )}
    </>
  )
}

export function NewScopeEntryForm({ matrixId, onCreated }: { matrixId: string; onCreated: () => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [item, setItem] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = item.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const entry = await createScopeEntry(repo, { matrixId, item: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'scope-entry', id: entry.id, label: entry.item },
        kind: 'created',
        diffSummary: 'New scope item.',
      })
      notifyDataChanged()
      setItem('')
      setCreating(false)
      onCreated()
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-2 flex items-center gap-1.5 text-2xs text-text3 hover:text-text2"
      >
        <Plus size={11} />
        Add scope item
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-border bg-inset p-2">
      <input autoFocus value={item} onChange={(event) => setItem(event.target.value)} placeholder="Scope item" className={inputClass} />
      <button type="submit" disabled={!item.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
        {busy ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setCreating(false)}
        className="flex-shrink-0 rounded-md border border-border p-1.5 text-text2 hover:border-border-hover"
      >
        <X size={14} />
      </button>
    </form>
  )
}

export function ScopeMatrixBlockEditor({ block }: { block: ScopeMatrixBlock; onChange: (b: Block) => void }) {
  const { data: project } = useActiveProject()
  const { data: entries, loading, refetch } = useScopeEntries(block.matrixId)
  const { data: decisions } = useDecisions(project?.id)

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-inset" aria-hidden="true" />

  const unjustified = (entries ?? []).filter((e) => e.verdict === 'undecided').length

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border bg-inset px-3 py-2 text-2xs text-text3">
          <span>{(entries ?? []).length} items</span>
          <span>{(entries ?? []).filter((e) => e.verdict === 'in').length} in</span>
          <span>{(entries ?? []).filter((e) => e.verdict === 'out').length} out</span>
          <span>{(entries ?? []).filter((e) => e.verdict === 'stretch').length} stretch</span>
          <span className={unjustified > 0 ? 'text-red' : ''}>{unjustified} undecided</span>
        </div>
        {(entries ?? []).length === 0 ? (
          <p className="p-3 text-sm text-text3">No scope entries yet.</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm-plus">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <tbody>
              {(entries ?? []).map((entry) => (
                <ScopeEntryRow key={entry.id} entry={entry} decisions={decisions ?? []} onRemoved={refetch} />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <NewScopeEntryForm matrixId={block.matrixId} onCreated={refetch} />
    </div>
  )
}

export function EmbedNoteBlockEditor({ block, onChange }: { block: EmbedNoteBlock; onChange: (b: Block) => void }) {
  const { data: project } = useActiveProject()
  const { data: notes } = useLogicNotes(project?.id)
  return (
    <div className="flex flex-col gap-2">
      {block.noteId && <EmbedNoteBlockView block={block} />}
      <select value={block.noteId} onChange={(event) => onChange({ ...block, noteId: event.target.value })} className={selectClass}>
        <option value="">Choose a note…</option>
        {(notes ?? []).map((note) => (
          <option key={note.id} value={note.id}>
            {note.title}
          </option>
        ))}
      </select>
    </div>
  )
}
