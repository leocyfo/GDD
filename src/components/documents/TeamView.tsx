import { Link2, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import { useActiveProject, useCollaborators, useFeatureCards, useSections } from '../../data/hooks/entityHooks'
import { createCollaborator } from '../../data/newCollaborator'
import { useRepository } from '../../data/repository/RepositoryProvider'
import { useAuth } from '../../data/supabase/AuthProvider'
import { useProjectMembers } from '../../data/supabase/useProjectMembers'
import type { ProjectRole } from '../../data/supabase/types'
import type { Collaborator, CollaboratorRole, Presence } from '../../data/types/entities'
import { relativeTime } from '../../lib/format'
import { useAutosave } from '../../lib/useAutosave'
import { toneForPresence } from '../../lib/tones'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { StatusDot } from '../common/StatusDot'
import { EmptyDocument } from './EmptyDocument'

const ROLES: CollaboratorRole[] = ['owner', 'editor', 'commenter', 'viewer']
const PRESENCES: Presence[] = ['online', 'away', 'offline']

/** `project_members` only has two real access tiers (see the migration's
 * own notes) — `commenter`/`viewer` are display-only labels here, same as
 * they've always been (nothing in the app enforces read-only anywhere),
 * so both map to `editor` DB-wise: real access, just not "can manage
 * membership or delete the project." */
function dbRoleFor(role: CollaboratorRole): ProjectRole {
  return role === 'owner' ? 'owner' : 'editor'
}

const plainInputClass =
  'min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-inset'

function PersonCard({
  person,
  ownedSectionTitles,
  ownedFeatureNames,
  onSyncRole,
  onSyncRemove,
}: {
  person: Collaborator
  ownedSectionTitles: string[]
  ownedFeatureNames: string[]
  /** No-ops outside cloud mode, or for a row with no linked account —
   * `TeamView` decides whether these do anything real. */
  onSyncRole: (userId: string, role: CollaboratorRole) => void
  onSyncRemove: (userId: string) => void
}) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [name, setName] = useState(person.name)
  const [discipline, setDiscipline] = useState(person.discipline)

  async function patch(fields: Partial<Collaborator>, summary: string) {
    await repo.collaborators.update(person.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'collaborator', id: person.id, label: fields.name ?? person.name },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
    if (fields.role && person.userId) onSyncRole(person.userId, fields.role)
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed a teammate.'))
  const disciplineSave = useAutosave<string>((v) => patch({ discipline: v }, "Edited a teammate's discipline."))

  async function remove() {
    await repo.collaborators.delete(person.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'collaborator', id: person.id, label: person.name },
        kind: 'deleted',
        diffSummary: 'Removed a teammate.',
      })
    }
    notifyDataChanged()
    if (person.userId) onSyncRemove(person.userId)
  }

  return (
    <div className="group/person rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  nameSave.schedule(event.target.value)
                }}
                onBlur={nameSave.flush}
                placeholder="Name"
                className={`${plainInputClass} block min-w-0 flex-1 text-sm-plus font-medium text-text1`}
              />
              {person.userId && (
                <span
                  className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-2xs text-text3"
                  title="Linked to a real account — this role controls their actual document access."
                >
                  <Link2 size={10} />
                  Connected
                </span>
              )}
            </div>
            <input
              value={discipline}
              onChange={(event) => {
                setDiscipline(event.target.value)
                disciplineSave.schedule(event.target.value)
              }}
              onBlur={disciplineSave.flush}
              placeholder="Discipline"
              className={`${plainInputClass} block text-xs-plus text-text3`}
            />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <select
            value={person.role}
            onChange={(event) => patch({ role: event.target.value as CollaboratorRole }, 'Changed role.')}
            className={`${selectClass} py-1 text-2xs capitalize`}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1.5 text-2xs text-text3">
            <StatusDot tone={toneForPresence(person.presence)} />
            <select
              value={person.presence}
              onChange={(event) => patch({ presence: event.target.value as Presence, lastSeen: new Date().toISOString() }, 'Changed presence.')}
              className="rounded border border-transparent bg-transparent py-0 pl-0 pr-3 text-2xs capitalize text-text3 outline-none transition-colors hover:border-border focus-visible:border-accent"
            >
              {PRESENCES.map((presence) => (
                <option key={presence} value={presence}>
                  {presence === 'online' ? 'Online' : presence === 'away' ? 'Away' : `Offline · ${relativeTime(person.lastSeen)}`}
                </option>
              ))}
            </select>
          </span>
          <button
            type="button"
            aria-label="Remove teammate"
            onClick={remove}
            className="flex-shrink-0 text-text3 opacity-0 transition-opacity hover:text-red group-hover/person:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {(ownedSectionTitles.length > 0 || ownedFeatureNames.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {ownedSectionTitles.map((title) => (
            <span key={title} className="rounded-full border border-border bg-inset px-2 py-0.5 text-2xs text-text2">
              {title}
            </span>
          ))}
          {ownedFeatureNames.map((name) => (
            <span key={name} className="rounded-full border border-border bg-inset px-2 py-0.5 text-2xs font-mono text-text2">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** `invite` is only passed when signed into cloud mode — its presence is
 * what turns the email field on at all. Undefined in offline mode, where
 * "invite by email" has no meaning (no accounts to invite). */
function NewTeammateForm({ invite }: { invite?: (email: string, role: ProjectRole) => Promise<string> }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || busy || !project) return
    setBusy(true)
    setError(null)
    try {
      let userId: string | null = null
      if (trimmedEmail && invite) {
        try {
          userId = await invite(trimmedEmail, 'editor')
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
          return
        }
      }
      const person = await createCollaborator(repo, {
        projectId: project.id,
        name: trimmedName,
        discipline: discipline.trim(),
        userId,
        createdBy: LOCAL_ACTOR,
      })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'collaborator', id: person.id, label: person.name },
        kind: 'created',
        diffSummary: userId ? 'New teammate (connected).' : 'New teammate.',
      })
      notifyDataChanged()
      setName('')
      setDiscipline('')
      setEmail('')
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
        New teammate
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-inset p-2">
      <div className="flex flex-wrap items-center gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className={inputClass} />
        <input value={discipline} onChange={(event) => setDiscipline(event.target.value)} placeholder="Discipline" className={inputClass} />
        {invite && (
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional — grants real access)"
            className={`${inputClass} min-w-[220px] flex-1`}
          />
        )}
        <button type="submit" disabled={!name.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
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
      </div>
      {error && <p className="text-2xs text-red">{error}</p>}
    </form>
  )
}

export function TeamView() {
  const { data: project } = useActiveProject()
  const { data: collaborators, loading } = useCollaborators(project?.id)
  const { data: sections } = useSections(project?.id)
  const { data: features } = useFeatureCards(project?.id)
  const auth = useAuth()
  const members = useProjectMembers(auth.status === 'signedIn' ? (project?.id ?? null) : null)
  const cloudEnabled = auth.status === 'signedIn'

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-8" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-inset" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-md font-semibold text-text1">Team</h1>
          <p className="mt-1 text-xs-plus text-text3">{(collaborators ?? []).length} collaborators on this project.</p>
        </div>
        <NewTeammateForm invite={cloudEnabled ? members.invite : undefined} />
      </div>

      {(!collaborators || collaborators.length === 0) && (
        <EmptyDocument title="Nobody on the team yet" body="Add the first teammate above to start assigning ownership." />
      )}

      <div className="flex flex-col gap-3">
        {(collaborators ?? []).map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            ownedSectionTitles={(sections ?? []).filter((s) => s.owners.includes(person.id)).map((s) => s.title)}
            ownedFeatureNames={(features ?? []).filter((f) => f.owner === person.id).map((f) => f.name)}
            onSyncRole={(userId, role) => {
              if (cloudEnabled) members.setRole(userId, dbRoleFor(role))
            }}
            onSyncRemove={(userId) => {
              if (cloudEnabled) members.remove(userId)
            }}
          />
        ))}
      </div>
    </div>
  )
}
