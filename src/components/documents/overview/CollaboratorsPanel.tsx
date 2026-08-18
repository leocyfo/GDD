import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, useCollaborators } from '../../../data/hooks/entityHooks'
import { createCollaborator } from '../../../data/newCollaborator'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { toneForPresence } from '../../../lib/tones'
import { inputClass } from '../../editor/fieldStyles'
import { StatusDot } from '../../common/StatusDot'

function InviteForm({ onDone }: { onDone: () => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const person = await createCollaborator(repo, { projectId: project.id, name: trimmed, discipline: '', createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'collaborator', id: person.id, label: person.name },
        kind: 'created',
        diffSummary: 'New teammate.',
      })
      notifyDataChanged()
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className={`${inputClass} h-7 py-0 text-xs-plus`} />
      <button type="submit" disabled={!name.trim() || busy} aria-label="Add" className="flex-shrink-0 rounded-md bg-accent px-2 py-1 text-2xs font-medium text-accent-fg disabled:opacity-50">
        {busy ? '…' : 'Add'}
      </button>
      <button type="button" aria-label="Cancel" onClick={onDone} className="flex-shrink-0 text-text3 hover:text-text2">
        <X size={13} />
      </button>
    </form>
  )
}

export function CollaboratorsPanel() {
  const { data: project } = useActiveProject()
  const { data: collaborators, loading } = useCollaborators(project?.id)
  const [inviting, setInviting] = useState(false)

  return (
    <div className="w-full flex-shrink-0 rounded-xl border border-border bg-card p-3.5 shadow-card sm:w-[208px]">
      <h2 className="mb-3 text-sm-plus font-semibold text-text1">Collaborators</h2>

      <div className="flex flex-col gap-1.5">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[26px] animate-pulse rounded bg-inset" aria-hidden="true" />
          ))}

        {collaborators?.map((person) => (
          <div key={person.id} className="flex h-[26px] items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent text-2xs font-semibold text-accent-fg">
                {person.name.charAt(0)}
              </span>
              <span className="truncate text-xs-plus text-text2">
                {person.name} ({person.discipline})
              </span>
            </div>
            <StatusDot tone={toneForPresence(person.presence)} />
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-border" />
      {/* Name-only, decorative — no room here for the email field that
          grants real access. `TeamView.tsx`'s "New teammate" is the full
          version, with the actual by-email invite. */}
      {inviting ? (
        <InviteForm onDone={() => setInviting(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setInviting(true)}
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-border text-xs-plus text-text3 transition-colors hover:border-border-hover hover:text-text2"
        >
          <Plus size={12} />
          Add collaborator
        </button>
      )}
    </div>
  )
}
