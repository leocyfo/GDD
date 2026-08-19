import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { deleteProject } from '../../data/deleteProject'
import { useProjects } from '../../data/hooks/entityHooks'
import { createNewProject } from '../../data/newProject'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { Project } from '../../data/types/entities'
import { relativeTime } from '../../lib/format'
import { toneForProjectStatus } from '../../lib/tones'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { CompassMark } from '../common/CompassMark'
import { StatusDot } from '../common/StatusDot'
import { ThemeToggle } from '../common/ThemeToggle'
import { ProfileButton } from '../profile/ProfileButton'

function ProjectCard({ project, onOpen, onDeleted }: { project: Project; onOpen: () => void; onDeleted: () => void }) {
  const repo = useRepository()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(repo, project.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red bg-card p-5 text-left shadow-card">
        <span className="min-w-0 truncate text-sm-plus font-semibold text-text1">Delete "{project.name}"?</span>
        <p className="text-xs-plus text-text3">Every section, feature card, decision, and vault note in this document goes with it. This can't be undone.</p>
        <div className="mt-auto flex w-full gap-2 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red px-3 py-1.5 text-xs-plus font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete forever'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2 transition-colors hover:border-border-hover"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:border-border-hover">
      <button
        type="button"
        aria-label={`Delete ${project.name}`}
        onClick={(event) => {
          event.stopPropagation()
          setConfirming(true)
        }}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-text3 opacity-0 transition-opacity hover:bg-inset hover:text-red focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
      <button type="button" onClick={onOpen} className="flex w-full flex-col items-start gap-2 text-left">
        <div className="flex w-full items-center justify-between gap-2 pr-7">
          <span className="min-w-0 truncate text-sm-plus font-semibold text-text1">{project.name}</span>
          <span className="flex flex-shrink-0 items-center gap-1.5 text-2xs capitalize text-text3">
            <StatusDot tone={toneForProjectStatus(project.status)} />
            {project.status}
          </span>
        </div>
        <p className="line-clamp-2 min-h-[2.5em] text-xs-plus text-text3">{project.intro || 'No description yet.'}</p>
        <div className="mt-auto flex w-full items-center justify-between pt-2 text-2xs text-text3">
          <span>
            v{project.version} · updated {relativeTime(project.updatedAt)}
          </span>
          <ArrowRight size={13} className="flex-shrink-0" />
        </div>
      </button>
    </div>
  )
}

function NewProjectCard({ onCreated }: { onCreated: (projectId: string) => void }) {
  const repo = useRepository()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const project = await createNewProject(repo, trimmed)
      onCreated(project.id)
    } catch (err) {
      // Failing silently here reads as a dead button — a cloud-mode
      // creation can genuinely fail (RLS, network), and did once already.
      setError(err instanceof Error ? err.message : 'Could not create this document.')
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={18} />
        <span className="text-sm-plus font-medium">New game document</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[132px] flex-col gap-3 rounded-xl border border-dashed border-border bg-inset p-5">
      <label className="text-2xs font-medium uppercase tracking-wide text-text3" htmlFor="new-project-name">
        New document name
      </label>
      <input
        id="new-project-name"
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Lighthouse Keeper"
        className="rounded-md border border-border bg-card px-3 py-2 text-sm-plus text-text1 outline-none focus-visible:border-accent"
      />
      {error && <p className="text-2xs text-red">{error}</p>}
      <div className="mt-auto flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || busy}
          className="rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => {
            setCreating(false)
            setName('')
          }}
          className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2 transition-colors hover:border-border-hover"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function Hub() {
  const { data: projects, loading, refetch } = useProjects()
  const openProject = useWorkspaceStore((s) => s.openProject)

  const sorted = [...(projects ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  function handleCreated(projectId: string) {
    refetch()
    openProject(projectId)
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-y-auto bg-app text-text1">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <CompassMark />
          <span className="text-sm-plus font-semibold">Game Design Documents</span>
        </div>
        <div className="flex items-center gap-2">
          <ProfileButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-8">
        <h1 className="text-display font-bold leading-none text-text1">Your documents</h1>
        <p className="mt-2 text-sm-plus text-text3">Open one to keep working, or start a new one.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-xl bg-inset" aria-hidden="true" />
            ))}

          {!loading &&
            sorted.map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={() => openProject(project.id)} onDeleted={refetch} />
            ))}

          {!loading && <NewProjectCard onCreated={handleCreated} />}
        </div>
      </main>
    </div>
  )
}
