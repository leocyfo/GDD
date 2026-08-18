import { useState } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import { useActiveProject } from '../../data/hooks/entityHooks'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { Project, ProjectStatus } from '../../data/types/entities'
import { relativeTime } from '../../lib/format'
import { useAutosave } from '../../lib/useAutosave'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { SaveIndicator } from '../common/SaveIndicator'
import { CollaboratorsPanel } from './overview/CollaboratorsPanel'
import { NonGoalsPanel } from './overview/NonGoalsPanel'
import { PillarsPanel } from './overview/PillarsPanel'

const STATUSES: ProjectStatus[] = ['draft', 'active', 'frozen', 'archived']

const plainInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-card'

function ProjectHeader({ project }: { project: Project }) {
  const repo = useRepository()
  const [name, setName] = useState(project.name)
  const [intro, setIntro] = useState(project.intro)

  async function patch(fields: Partial<Project>, summary: string) {
    await repo.projects.update(project.id, { ...fields, updatedBy: LOCAL_ACTOR })
    await logChange(repo, {
      projectId: project.id,
      by: LOCAL_ACTOR,
      target: { type: 'project', id: project.id, label: fields.name ?? project.name },
      kind: 'edited',
      diffSummary: summary,
    })
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed the project.'))
  const introSave = useAutosave<string>((v) => patch({ intro: v }, 'Edited the pitch.'))

  return (
    <div className="max-w-xl">
      <div className="text-2xs font-medium uppercase tracking-wide text-text3">Game Design Document</div>
      <input
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          nameSave.schedule(event.target.value)
        }}
        onBlur={nameSave.flush}
        placeholder="Untitled project"
        className={`${plainInputClass} text-display font-bold leading-tight text-text1`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-text3">
        <span>Living document</span>
        <span aria-hidden="true">·</span>
        <span>v{project.version}</span>
        <span aria-hidden="true">·</span>
        <select
          value={project.status}
          onChange={(event) => patch({ status: event.target.value as ProjectStatus }, 'Changed project status.')}
          className="rounded border border-transparent bg-transparent py-0 pl-0 pr-4 text-xs capitalize text-text3 outline-none transition-colors hover:border-border focus-visible:border-accent"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span aria-hidden="true">·</span>
        <span>Updated {relativeTime(project.updatedAt)}</span>
        <SaveIndicator state={nameSave.state === 'idle' ? introSave.state : nameSave.state} />
      </div>
      <textarea
        value={intro}
        onChange={(event) => {
          setIntro(event.target.value)
          introSave.schedule(event.target.value)
        }}
        onBlur={introSave.flush}
        placeholder="What's the pitch? One or two sentences on what this game is."
        rows={2}
        className={`${plainInputClass} mt-3 resize-none text-sm-plus leading-relaxed text-text2`}
      />
    </div>
  )
}

export function OverviewView() {
  const { data: project, loading } = useActiveProject()

  if (loading || !project) {
    return (
      <div className="flex flex-col gap-4 p-8" aria-hidden="true">
        <div className="h-10 w-96 animate-pulse rounded bg-inset" />
        <div className="h-24 animate-pulse rounded bg-inset" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-7">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row">
        <ProjectHeader project={project} />
        <CollaboratorsPanel />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PillarsPanel />
        <NonGoalsPanel />
      </div>

      <p className="mt-6 text-2xs text-text3">
        Every card here is editable in place — click into a pillar, non-goal, or the pitch above and start typing. Open a
        section from the sidebar for the rest of the document.
      </p>
    </div>
  )
}
