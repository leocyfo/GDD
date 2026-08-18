import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, useNonGoals } from '../../../data/hooks/entityHooks'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { NonGoal } from '../../../data/types/entities'
import { useAutosave } from '../../../lib/useAutosave'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { inputClass } from '../../editor/fieldStyles'

const plainInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-inset'

function NonGoalRow({ nonGoal }: { nonGoal: NonGoal }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [statement, setStatement] = useState(nonGoal.statement)
  const [reason, setReason] = useState(nonGoal.reason)

  async function patch(fields: Partial<NonGoal>, summary: string) {
    await repo.nonGoals.update(nonGoal.id, fields)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'non-goal', id: nonGoal.id, label: fields.statement ?? nonGoal.statement },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const statementSave = useAutosave<string>((v) => patch({ statement: v }, 'Edited a non-goal.'))
  const reasonSave = useAutosave<string>((v) => patch({ reason: v }, "Edited a non-goal's reason."))

  async function remove() {
    await repo.nonGoals.delete(nonGoal.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'non-goal', id: nonGoal.id, label: nonGoal.statement },
        kind: 'deleted',
        diffSummary: 'Removed a non-goal.',
      })
    }
    notifyDataChanged()
  }

  return (
    <li className="group/nongoal flex items-start gap-1.5">
      <div className="min-w-0 flex-1">
        <input
          value={statement}
          onChange={(event) => {
            setStatement(event.target.value)
            statementSave.schedule(event.target.value)
          }}
          onBlur={statementSave.flush}
          placeholder="What this game deliberately isn't"
          className={`${plainInputClass} text-xs-plus text-text1`}
        />
        <input
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            reasonSave.schedule(event.target.value)
          }}
          onBlur={reasonSave.flush}
          placeholder="Why"
          className={`${plainInputClass} text-2xs text-text3`}
        />
      </div>
      <button
        type="button"
        aria-label="Remove non-goal"
        onClick={remove}
        className="mt-0.5 flex-shrink-0 text-text3 opacity-0 transition-opacity hover:text-red group-hover/nongoal:opacity-100"
      >
        <X size={12} />
      </button>
    </li>
  )
}

function NewNonGoalForm() {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [statement, setStatement] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = statement.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const nonGoal = await repo.nonGoals.create({ projectId: project.id, statement: trimmed, reason: '', updatedBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'non-goal', id: nonGoal.id, label: nonGoal.statement },
        kind: 'created',
        diffSummary: 'New non-goal.',
      })
      notifyDataChanged()
      setStatement('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button type="button" onClick={() => setCreating(true)} className="mt-2 flex items-center gap-1 text-2xs text-text3 hover:text-text2">
        <Plus size={11} />
        Add non-goal
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
      <input
        autoFocus
        value={statement}
        onChange={(event) => setStatement(event.target.value)}
        placeholder="e.g. No pay-to-win"
        className={`${inputClass} text-xs-plus`}
      />
      <button type="submit" disabled={!statement.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-2xs font-medium text-accent-fg disabled:opacity-50">
        {busy ? '…' : 'Add'}
      </button>
      <button type="button" aria-label="Cancel" onClick={() => setCreating(false)} className="flex-shrink-0 text-text3 hover:text-text2">
        <X size={14} />
      </button>
    </form>
  )
}

export function NonGoalsPanel() {
  const { data: project } = useActiveProject()
  const { data: nonGoals } = useNonGoals(project?.id)

  return (
    <section className="rounded-xl border border-border bg-card p-[18px] shadow-card">
      <h2 className="mb-3 text-sm-plus font-semibold text-text1">Non-goals</h2>
      {(!nonGoals || nonGoals.length === 0) && <p className="text-xs-plus text-text3">No non-goals yet — what will this game deliberately not do?</p>}
      <ul className="flex flex-col gap-2.5">
        {(nonGoals ?? []).map((goal) => (
          <NonGoalRow key={goal.id} nonGoal={goal} />
        ))}
      </ul>
      <NewNonGoalForm />
    </section>
  )
}
