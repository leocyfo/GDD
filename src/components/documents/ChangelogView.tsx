import { FilePlus, FileX, Move, Pencil, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useActiveProject, useChangeEntries, useCollaborators } from '../../data/hooks/entityHooks'
import type { ChangeKind, VersionBump } from '../../data/types/entities'
import { relativeTime } from '../../lib/format'
import { EmptyDocument } from './EmptyDocument'

const KIND_ICONS: Record<ChangeKind, LucideIcon> = {
  created: FilePlus,
  edited: Pencil,
  moved: Move,
  deleted: FileX,
  'status-changed': RefreshCw,
}

const BUMP_LABEL: Record<NonNullable<VersionBump>, string> = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
}

const BUMP_TEXT: Record<NonNullable<VersionBump>, string> = {
  major: 'text-red',
  minor: 'text-amber',
  patch: 'text-text3',
}

export function ChangelogView() {
  const { data: project } = useActiveProject()
  const { data: entries, loading } = useChangeEntries(project?.id)
  const { data: collaborators } = useCollaborators(project?.id)
  const nameById = new Map((collaborators ?? []).map((c) => [c.id, c.name]))

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-8" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-inset" />
        ))}
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="p-8">
        <EmptyDocument title="No history yet" body="Every edit to this document will show up here, newest first." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-7">
      <h1 className="mb-1 text-md font-semibold text-text1">Changelog</h1>
      <p className="mb-6 text-xs-plus text-text3">{entries.length} changes recorded for this document.</p>

      <ol className="flex flex-col">
        {entries.map((entry) => {
          const Icon = KIND_ICONS[entry.kind]
          return (
            <li key={entry.id} className="flex gap-3 border-b border-border py-3 last:border-b-0">
              <Icon size={14} className="mt-0.5 flex-shrink-0 text-text3" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs-plus">
                  <span className="font-medium text-text1">{nameById.get(entry.by) ?? entry.by}</span>
                  <span className="text-text3">{entry.kind.replace('-', ' ')}</span>
                  <span className="font-mono text-text2">{entry.target.label}</span>
                  {entry.versionBump && (
                    <span className={`text-2xs uppercase ${BUMP_TEXT[entry.versionBump]}`}>{BUMP_LABEL[entry.versionBump]}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs-plus text-text3">{entry.diffSummary}</p>
              </div>
              <span className="flex-shrink-0 text-2xs text-text3">{relativeTime(entry.at)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
