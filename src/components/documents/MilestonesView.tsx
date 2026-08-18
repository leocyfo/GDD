import { Check, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import { useActiveProject, useFeatureCards, useMilestones } from '../../data/hooks/entityHooks'
import { createMilestone } from '../../data/newMilestone'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { Milestone, MilestoneState } from '../../data/types/entities'
import { Modal, ModalCloseButton } from '../common/Modal'
import { SaveIndicator } from '../common/SaveIndicator'
import { StatusDot } from '../common/StatusDot'
import { fixedWidthInputClass, inputClass, selectClass } from '../editor/fieldStyles'
import { useAutosave } from '../../lib/useAutosave'
import { toneForFeatureStatus, toneForMilestoneState } from '../../lib/tones'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { EmptyDocument } from './EmptyDocument'

const STATES: MilestoneState[] = ['upcoming', 'active', 'at-risk', 'done']

/** The small tile shown in the grid — name, state, date, and how many exit
 * criteria are defined. Everything else (the criteria themselves, linked
 * feature cards) lives behind the click, in the detail modal
 * (`MilestoneFields`). */
function CompactMilestoneCard({ milestone, onOpen }: { milestone: Milestone; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-36 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors hover:border-border-hover"
    >
      <div className="flex w-full items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm-plus font-semibold text-text1">{milestone.name || 'Untitled'}</span>
        <StatusDot tone={toneForMilestoneState(milestone.state)} />
      </div>
      <span className="text-xs-plus text-text3">{milestone.date || 'No date set'}</span>
      <p className="flex-1 text-2xs text-text3">
        {milestone.exitCriteria.length} exit {milestone.exitCriteria.length === 1 ? 'criterion' : 'criteria'} ·{' '}
        {milestone.linkedFeatureIds.length} feature{milestone.linkedFeatureIds.length === 1 ? '' : 's'}
      </p>
      <span className="font-mono text-2xs uppercase tracking-wide text-text3">{milestone.state}</span>
    </button>
  )
}

/** Every field, unchanged from the old always-expanded card — just no
 * longer carrying its own card chrome, since it now lives inside a
 * `Modal` panel that already provides that. */
function MilestoneFields({ milestone }: { milestone: Milestone }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: cards } = useFeatureCards(project?.id)

  const [name, setName] = useState(milestone.name)
  const [date, setDate] = useState(milestone.date)

  async function patch(fields: Partial<Milestone>, summary: string) {
    await repo.milestones.update(milestone.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'milestone', id: milestone.id, label: milestone.name },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed the milestone.'))
  const dateSave = useAutosave<string>((v) => patch({ date: v }, 'Changed the date.'))

  function updateCriterion(index: number, value: string) {
    const exitCriteria = milestone.exitCriteria.map((c, i) => (i === index ? value : c))
    patch({ exitCriteria }, 'Edited an exit criterion.')
  }
  function removeCriterion(index: number) {
    patch({ exitCriteria: milestone.exitCriteria.filter((_, i) => i !== index) }, 'Removed an exit criterion.')
  }
  function addCriterion() {
    patch({ exitCriteria: [...milestone.exitCriteria, ''] }, 'Added an exit criterion.')
  }

  const linkedFeatures = (cards ?? []).filter((c) => milestone.linkedFeatureIds.includes(c.id))
  const availableFeatures = (cards ?? []).filter((c) => !milestone.linkedFeatureIds.includes(c.id))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <StatusDot tone={toneForMilestoneState(milestone.state)} />
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              nameSave.schedule(event.target.value)
            }}
            onBlur={nameSave.flush}
            className={`${inputClass} min-w-0 flex-1 text-sm-plus font-semibold`}
          />
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              dateSave.schedule(event.target.value)
            }}
            onBlur={dateSave.flush}
            className={`${fixedWidthInputClass} w-36 flex-shrink-0`}
          />
          <select
            value={milestone.state}
            onChange={(event) => patch({ state: event.target.value as MilestoneState }, 'Changed milestone state.')}
            className={`${selectClass} capitalize`}
          >
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Exit criteria</div>
        <div className="flex flex-col gap-1.5">
          {milestone.exitCriteria.map((criterion, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Check size={12} className="flex-shrink-0 text-text3" />
              <input value={criterion} onChange={(event) => updateCriterion(index, event.target.value)} className={inputClass} />
              <button type="button" aria-label="Remove criterion" onClick={() => removeCriterion(index)} className="flex-shrink-0 text-text3 hover:text-red">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addCriterion} className="mt-1.5 text-2xs text-text3 hover:text-text2">
          + Add exit criterion
        </button>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Feature cards that must land here</div>
        <div className="flex flex-wrap gap-1.5">
          {linkedFeatures.map((card) => (
            <span key={card.id} className="flex items-center gap-1.5 rounded-full border border-border bg-inset px-2 py-0.5 text-2xs text-text2">
              <StatusDot tone={toneForFeatureStatus(card.status)} />
              {card.name}
              <button
                type="button"
                aria-label="Unlink feature card"
                onClick={() => patch({ linkedFeatureIds: milestone.linkedFeatureIds.filter((id) => id !== card.id) }, 'Unlinked a feature card.')}
                className="text-text3 hover:text-red"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        {availableFeatures.length > 0 && (
          <select
            value=""
            onChange={(event) =>
              event.target.value && patch({ linkedFeatureIds: [...milestone.linkedFeatureIds, event.target.value] }, 'Linked a feature card.')
            }
            className={`${selectClass} mt-1.5`}
          >
            <option value="">Link a feature card…</option>
            {availableFeatures.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <SaveIndicator state={nameSave.state} />
        <SaveIndicator state={dateSave.state} />
      </div>
    </div>
  )
}

function NewMilestoneTile({ onCreated }: { onCreated: () => void }) {
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
      const milestone = await createMilestone(repo, { projectId: project.id, name: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'milestone', id: milestone.id, label: milestone.name },
        kind: 'created',
        diffSummary: 'New milestone.',
      })
      notifyDataChanged()
      setName('')
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
        <span className="text-sm-plus font-medium">New milestone</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-36 flex-col gap-2 rounded-xl border border-dashed border-border bg-inset p-3.5">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Milestone name" className={inputClass} />
      <div className="mt-auto flex gap-2">
        <button type="submit" disabled={!name.trim() || busy} className="rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function MilestonesView() {
  const { data: project } = useActiveProject()
  const { data: milestones, loading, refetch } = useMilestones(project?.id)
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

  const selected = selectedId ? (milestones ?? []).find((m) => m.id === selectedId) : undefined

  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-md font-semibold text-text1">Milestones</h1>
        <p className="mt-1 text-xs-plus text-text3">{(milestones ?? []).length} milestones, ordered by date.</p>
      </div>

      {(!milestones || milestones.length === 0) && (
        <EmptyDocument title="No milestones yet" body="Add the first one — Vertical Slice is a good place to start." />
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {(milestones ?? []).map((milestone) => (
          <CompactMilestoneCard key={milestone.id} milestone={milestone} onOpen={() => setSelectedId(milestone.id)} />
        ))}
        <NewMilestoneTile onCreated={refetch} />
      </div>

      {selected && (
        <Modal onClose={() => setSelectedId(null)} ariaLabel={`Edit ${selected.name || 'milestone'}`} widthClassName="max-w-xl">
          <div className="relative overflow-y-auto p-5">
            <ModalCloseButton onClose={() => setSelectedId(null)} />
            <MilestoneFields key={selected.id} milestone={selected} />
          </div>
        </Modal>
      )}
    </div>
  )
}
