import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, usePillars } from '../../../data/hooks/entityHooks'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { Pillar } from '../../../data/types/entities'
import { useAutosave } from '../../../lib/useAutosave'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { inputClass } from '../../editor/fieldStyles'

/** Same "looks like plain text at rest" treatment as the Controls Diagram
 * and Flow Map table cells — a pillar reads like a static label until you
 * actually go to edit it. */
const plainInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-inset'

function PillarRow({ pillar, canMoveUp, canMoveDown, onMove }: { pillar: Pillar; canMoveUp: boolean; canMoveDown: boolean; onMove: (dir: -1 | 1) => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [label, setLabel] = useState(pillar.label)
  const [rationale, setRationale] = useState(pillar.rationale)

  async function patch(fields: Partial<Pillar>, summary: string) {
    await repo.pillars.update(pillar.id, fields)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'pillar', id: pillar.id, label: fields.label ?? pillar.label },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const labelSave = useAutosave<string>((v) => patch({ label: v }, 'Renamed a pillar.'))
  const rationaleSave = useAutosave<string>((v) => patch({ rationale: v }, "Edited a pillar's rationale."))

  async function remove() {
    await repo.pillars.delete(pillar.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'pillar', id: pillar.id, label: pillar.label },
        kind: 'deleted',
        diffSummary: 'Removed a pillar.',
      })
    }
    notifyDataChanged()
  }

  return (
    <div className="group/pillar flex items-start gap-1.5">
      <div className="mt-0.5 flex flex-shrink-0 flex-col opacity-0 transition-opacity group-hover/pillar:opacity-100">
        <button type="button" aria-label="Move pillar up" disabled={!canMoveUp} onClick={() => onMove(-1)} className="text-text3 hover:text-text1 disabled:opacity-30">
          <ChevronUp size={11} />
        </button>
        <button type="button" aria-label="Move pillar down" disabled={!canMoveDown} onClick={() => onMove(1)} className="text-text3 hover:text-text1 disabled:opacity-30">
          <ChevronDown size={11} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <input
          value={label}
          onChange={(event) => {
            setLabel(event.target.value)
            labelSave.schedule(event.target.value)
          }}
          onBlur={labelSave.flush}
          placeholder="Pillar"
          className={`${plainInputClass} text-xs-plus font-medium text-text1`}
        />
        <input
          value={rationale}
          onChange={(event) => {
            setRationale(event.target.value)
            rationaleSave.schedule(event.target.value)
          }}
          onBlur={rationaleSave.flush}
          placeholder="Why this pillar matters"
          className={`${plainInputClass} text-2xs text-text3`}
        />
      </div>
      <button
        type="button"
        aria-label="Remove pillar"
        onClick={remove}
        className="mt-0.5 flex-shrink-0 text-text3 opacity-0 transition-opacity hover:text-red group-hover/pillar:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function NewPillarForm({ nextOrder }: { nextOrder: number }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const pillar = await repo.pillars.create({
        projectId: project.id,
        label: trimmed,
        rationale: '',
        order: nextOrder,
        updatedBy: LOCAL_ACTOR,
      })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'pillar', id: pillar.id, label: pillar.label },
        kind: 'created',
        diffSummary: 'New pillar.',
      })
      notifyDataChanged()
      setLabel('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button type="button" onClick={() => setCreating(true)} className="mt-2 flex items-center gap-1 text-2xs text-text3 hover:text-text2">
        <Plus size={11} />
        Add pillar
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
      <input autoFocus value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Pillar name" className={`${inputClass} text-xs-plus`} />
      <button type="submit" disabled={!label.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-2xs font-medium text-accent-fg disabled:opacity-50">
        {busy ? '…' : 'Add'}
      </button>
      <button type="button" aria-label="Cancel" onClick={() => setCreating(false)} className="flex-shrink-0 text-text3 hover:text-text2">
        <X size={14} />
      </button>
    </form>
  )
}

export function PillarsPanel() {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: pillars } = usePillars(project?.id)

  const sorted = [...(pillars ?? [])].sort((a, b) => a.order - b.order)

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sorted.length) return
    const a = sorted[index]
    const b = sorted[target]
    await Promise.all([repo.pillars.update(a.id, { order: b.order }), repo.pillars.update(b.id, { order: a.order })])
    notifyDataChanged()
  }

  return (
    <section className="rounded-xl border border-border bg-card p-[18px] shadow-card">
      <h2 className="mb-3 text-sm-plus font-semibold text-text1">Pillars</h2>
      {sorted.length === 0 && <p className="text-xs-plus text-text3">No pillars yet — what can this game never compromise on?</p>}
      <div className="flex flex-col gap-2.5">
        {sorted.map((pillar, index) => (
          <PillarRow key={pillar.id} pillar={pillar} canMoveUp={index > 0} canMoveDown={index < sorted.length - 1} onMove={(dir) => move(index, dir)} />
        ))}
      </div>
      <NewPillarForm nextOrder={sorted.length > 0 ? Math.max(...sorted.map((p) => p.order)) + 1 : 1} />
    </section>
  )
}
