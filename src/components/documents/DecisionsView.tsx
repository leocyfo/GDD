import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import {
  useActiveProject,
  useCollaborators,
  useDecisions,
  useFeatureCards,
  useLogicNotes,
  useMilestones,
  useSections,
} from '../../data/hooks/entityHooks'
import { createDecision } from '../../data/newDecision'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { AffectedRef, AffectedType, Decision, SyncState } from '../../data/types/entities'
import { resolveIcon } from '../../lib/icons'
import { Modal, ModalCloseButton } from '../common/Modal'
import { SaveIndicator } from '../common/SaveIndicator'
import { StatusDot } from '../common/StatusDot'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { useAutosave } from '../../lib/useAutosave'
import { toneForSyncState } from '../../lib/tones'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { EmptyDocument } from './EmptyDocument'

const SYNC_STATES: SyncState[] = ['matches-build', 'ahead-of-build', 'behind-build', 'unknown']

/** What a decision can point at, and how to resolve/label each one — one
 * small table instead of four near-identical branches everywhere this is
 * needed (the chip list, the "add" picker, the icon). */
const AFFECTED_TYPES: { type: AffectedType; label: string; icon: string }[] = [
  { type: 'section', label: 'Section', icon: 'LayoutPanelLeft' },
  { type: 'feature', label: 'Feature card', icon: 'LayoutGrid' },
  { type: 'milestone', label: 'Milestone', icon: 'CalendarCheck' },
  { type: 'note', label: 'Vault note', icon: 'BookOpen' },
]

interface AffectableItem {
  id: string
  label: string
}

type AffectableIndex = Record<AffectedType, Map<string, AffectableItem>>

function useAffectableIndex(projectId: string | undefined): AffectableIndex {
  const { data: sections } = useSections(projectId)
  const { data: features } = useFeatureCards(projectId)
  const { data: milestones } = useMilestones(projectId)
  const { data: notes } = useLogicNotes(projectId)

  return {
    section: new Map((sections ?? []).map((s) => [s.id, { id: s.id, label: s.title }])),
    feature: new Map((features ?? []).map((f) => [f.id, { id: f.id, label: f.name }])),
    milestone: new Map((milestones ?? []).map((m) => [m.id, { id: m.id, label: m.name }])),
    note: new Map((notes ?? []).map((n) => [n.id, { id: n.id, label: n.title }])),
  }
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  rows?: number
}) {
  return (
    <label className="flex flex-col gap-1 text-2xs text-text3">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} rows={rows} className={`${inputClass} resize-y`} />
    </label>
  )
}

/** The small tile shown in the grid — title, sync state, and the choice
 * (the actual outcome, the most scannable field) clamped to two lines.
 * Everything else lives behind the click, in the detail modal
 * (`DecisionFields`). */
function CompactDecisionCard({ decision, superseded, onOpen }: { decision: Decision; superseded: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-36 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors hover:border-border-hover"
    >
      <div className="flex w-full items-center gap-2">
        <span className={`min-w-0 flex-1 truncate text-sm-plus font-semibold ${superseded ? 'text-text3 line-through' : 'text-text1'}`}>
          {decision.title || 'Untitled'}
        </span>
        <StatusDot tone={toneForSyncState(decision.syncState)} />
      </div>
      <p className="line-clamp-2 flex-1 text-xs-plus text-text3">{decision.choice || 'No choice recorded yet.'}</p>
      <span className="font-mono text-2xs uppercase tracking-wide text-text3">{decision.date}</span>
    </button>
  )
}

/** Every field, unchanged from the old always-expanded card — just no
 * longer carrying its own card chrome, since it now lives inside a
 * `Modal` panel that already provides that. */
function DecisionFields({
  decision,
  allDecisions,
  affectableIndex,
}: {
  decision: Decision
  allDecisions: Decision[]
  affectableIndex: AffectableIndex
}) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: collaborators } = useCollaborators(project?.id)
  const [newAffectedType, setNewAffectedType] = useState<AffectedType>('section')

  const [title, setTitle] = useState(decision.title)
  const [context, setContext] = useState(decision.context)
  const [choice, setChoice] = useState(decision.choice)
  const [alternatives, setAlternatives] = useState(decision.alternatives)
  const [consequences, setConsequences] = useState(decision.consequences)

  const supersededBy = allDecisions.find((d) => d.supersedes === decision.id)

  async function patch(fields: Partial<Decision>, summary: string) {
    await repo.decisions.update(decision.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'decision', id: decision.id, label: decision.title },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const titleSave = useAutosave<string>((v) => patch({ title: v }, 'Renamed the decision.'))
  const contextSave = useAutosave<string>((v) => patch({ context: v }, 'Updated context.'))
  const choiceSave = useAutosave<string>((v) => patch({ choice: v }, 'Updated the choice.'))
  const alternativesSave = useAutosave<string>((v) => patch({ alternatives: v }, 'Updated alternatives.'))
  const consequencesSave = useAutosave<string>((v) => patch({ consequences: v }, 'Updated consequences.'))

  function toggleDecider(id: string) {
    const decidedBy = decision.decidedBy.includes(id) ? decision.decidedBy.filter((existing) => existing !== id) : [...decision.decidedBy, id]
    patch({ decidedBy }, 'Changed who decided.')
  }

  function addAffected(ref: AffectedRef) {
    if (decision.affects.some((existing) => existing.type === ref.type && existing.id === ref.id)) return
    patch({ affects: [...decision.affects, ref] }, 'Linked something this decision affects.')
  }
  function removeAffected(ref: AffectedRef) {
    patch(
      { affects: decision.affects.filter((existing) => !(existing.type === ref.type && existing.id === ref.id)) },
      'Unlinked something this decision affects.',
    )
  }

  const availableForNewType = Array.from(affectableIndex[newAffectedType].values()).filter(
    (item) => !decision.affects.some((ref) => ref.type === newAffectedType && ref.id === item.id),
  )

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            titleSave.schedule(event.target.value)
          }}
          onBlur={titleSave.flush}
          className={`${inputClass} text-sm-plus font-semibold ${supersededBy ? 'line-through' : ''}`}
        />
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <StatusDot tone={toneForSyncState(decision.syncState)} />
          <select
            value={decision.syncState}
            onChange={(event) => patch({ syncState: event.target.value as SyncState }, 'Changed sync state.')}
            className={`${selectClass} text-2xs`}
          >
            {SYNC_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {supersededBy && (
        <p className="mt-1 text-2xs text-text3">
          Superseded by <span className="text-text2">{supersededBy.title}</span>
        </p>
      )}

      <div className="mt-2 text-2xs text-text3">{decision.date}</div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Context" value={context} onChange={(v) => { setContext(v); contextSave.schedule(v) }} onBlur={contextSave.flush} />
        <TextField label="Choice" value={choice} onChange={(v) => { setChoice(v); choiceSave.schedule(v) }} onBlur={choiceSave.flush} />
        <TextField
          label="Alternatives considered"
          value={alternatives}
          onChange={(v) => { setAlternatives(v); alternativesSave.schedule(v) }}
          onBlur={alternativesSave.flush}
        />
        <TextField
          label="Consequences"
          value={consequences}
          onChange={(v) => { setConsequences(v); consequencesSave.schedule(v) }}
          onBlur={consequencesSave.flush}
        />
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Decided by</div>
        <div className="flex flex-wrap gap-1.5">
          {(collaborators ?? []).map((person) => {
            const active = decision.decidedBy.includes(person.id)
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => toggleDecider(person.id)}
                className={`rounded-full border px-2 py-0.5 text-2xs transition-colors ${
                  active ? 'border-accent bg-inset text-text1' : 'border-border text-text3 hover:text-text2'
                }`}
              >
                {person.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Affects</div>
        <div className="flex flex-wrap gap-1.5">
          {decision.affects.map((ref) => {
            const item = affectableIndex[ref.type].get(ref.id)
            const meta = AFFECTED_TYPES.find((t) => t.type === ref.type)
            const Icon = resolveIcon(meta?.icon ?? '')
            return (
              <span
                key={`${ref.type}:${ref.id}`}
                className="flex items-center gap-1.5 rounded-full border border-border bg-inset px-2 py-0.5 text-2xs text-text2"
              >
                <Icon size={11} className="flex-shrink-0 text-text3" />
                {item?.label ?? `${meta?.label ?? ref.type} (deleted)`}
                <button type="button" aria-label="Unlink" onClick={() => removeAffected(ref)} className="text-text3 hover:text-red">
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <select
            value={newAffectedType}
            onChange={(event) => setNewAffectedType(event.target.value as AffectedType)}
            className={`${selectClass} w-auto flex-shrink-0 text-2xs`}
          >
            {AFFECTED_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          {availableForNewType.length > 0 ? (
            <select
              value=""
              onChange={(event) => event.target.value && addAffected({ type: newAffectedType, id: event.target.value })}
              className={`${selectClass} text-2xs`}
            >
              <option value="">Link a {AFFECTED_TYPES.find((t) => t.type === newAffectedType)?.label.toLowerCase()}…</option>
              {availableForNewType.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-2xs text-text3">Nothing left to link here.</span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <label className="flex flex-col gap-1 text-2xs text-text3">
          Supersedes
          <select
            value={decision.supersedes ?? ''}
            onChange={(event) => patch({ supersedes: event.target.value || null }, 'Changed which decision this supersedes.')}
            className={selectClass}
          >
            <option value="">None</option>
            {allDecisions
              .filter((d) => d.id !== decision.id)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex gap-3">
        <SaveIndicator state={titleSave.state} />
        <SaveIndicator state={contextSave.state} />
        <SaveIndicator state={choiceSave.state} />
      </div>
    </div>
  )
}

function NewDecisionTile({ onCreated }: { onCreated: () => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const decision = await createDecision(repo, { projectId: project.id, title: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'decision', id: decision.id, label: decision.title },
        kind: 'created',
        diffSummary: 'New decision logged.',
      })
      notifyDataChanged()
      setTitle('')
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
        className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={18} />
        <span className="text-sm-plus font-medium">Log a decision</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-36 flex-col gap-2 rounded-xl border border-dashed border-border bg-inset p-3.5">
      <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Decision title" className={inputClass} />
      <div className="mt-auto flex gap-2">
        <button type="submit" disabled={!title.trim() || busy} className="rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function DecisionsView() {
  const { data: project } = useActiveProject()
  const { data: decisions, loading, refetch } = useDecisions(project?.id)
  const affectableIndex = useAffectableIndex(project?.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3.5 p-8 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-inset" />
        ))}
      </div>
    )
  }

  const supersededIds = new Set((decisions ?? []).map((d) => d.supersedes).filter((id): id is string => id !== null))
  const selected = selectedId ? (decisions ?? []).find((d) => d.id === selectedId) : undefined

  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-md font-semibold text-text1">Decisions</h1>
        <p className="mt-1 text-xs-plus text-text3">Chronological, newest first — {(decisions ?? []).length} logged.</p>
      </div>

      {(!decisions || decisions.length === 0) && (
        <EmptyDocument title="No decisions logged yet" body="Log the first one to start making the doc's history visible." />
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {(decisions ?? []).map((decision) => (
          <CompactDecisionCard
            key={decision.id}
            decision={decision}
            superseded={supersededIds.has(decision.id)}
            onOpen={() => setSelectedId(decision.id)}
          />
        ))}
        <NewDecisionTile onCreated={refetch} />
      </div>

      {selected && (
        <Modal onClose={() => setSelectedId(null)} ariaLabel={`Edit ${selected.title || 'decision'}`} widthClassName="max-w-2xl">
          <div className="relative overflow-y-auto p-5">
            <ModalCloseButton onClose={() => setSelectedId(null)} />
            <DecisionFields key={selected.id} decision={selected} allDecisions={decisions ?? []} affectableIndex={affectableIndex} />
          </div>
        </Modal>
      )}
    </div>
  )
}
