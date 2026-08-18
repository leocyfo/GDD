import { useActiveProject, useCollaborators, useLinkableItems, useSectionByKey } from '../../data/hooks/entityHooks'
import { SECTION_DEFINITIONS } from '../../data/sectionDefinitions'
import type { Section } from '../../data/types/entities'
import { relativeTime } from '../../lib/format'
import { resolveIcon } from '../../lib/icons'
import { toneForFreshness } from '../../lib/tones'
import { useTabsStore } from '../../stores/useTabsStore'
import { StatusDot } from '../common/StatusDot'
import { EditableBlockList } from './editableBlocks/EditableBlockList'
import { EmptyDocument } from './EmptyDocument'

/** Renders once the section has actually loaded — split out so the parent
 * can `key` it by `section.id`, forcing a fresh `EditableBlockList` (and
 * its local block state) instead of stale state leaking between sections
 * when the user switches tabs. */
function LoadedSection({ section, ownerNames }: { section: Section; ownerNames: string[] }) {
  const { data: project } = useActiveProject()
  const { data: linkableItems } = useLinkableItems(project?.id)
  const openTab = useTabsStore((s) => s.openTab)
  const Icon = resolveIcon(section.icon)

  return (
    // Wider than the ~768px reading column below: most blocks (text,
    // headings, callouts…) still center themselves at that narrow width
    // via `BlockChrome`, but a few — a keyboard, a branching flowchart —
    // are inherently spatial and opt out of it (`blockTypeMeta(type).wide`)
    // to use the room this outer container gives them instead of forcing
    // the reader to scroll sideways through their own diagram.
    <div className="mx-auto max-w-7xl px-8 py-7">
      <div className="mx-auto mb-6 flex max-w-3xl items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text3">
            <Icon size={14} />
            Section {section.index} of {SECTION_DEFINITIONS.length}
          </div>
          <h1 className="text-display font-bold text-text1">{section.title}</h1>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-inset px-2.5 py-1 text-2xs text-text3">
          <StatusDot tone={toneForFreshness(section.freshness)} />
          <span className="capitalize">{section.freshness}</span>
          <span aria-hidden="true">·</span>
          <span>updated {relativeTime(section.updatedAt)}</span>
        </div>
      </div>

      {ownerNames.length > 0 && (
        <div className="mx-auto mb-6 flex max-w-3xl items-center gap-2 text-xs-plus text-text3">
          <span>Owned by</span>
          {ownerNames.map((name) => (
            <span key={name} className="rounded-full border border-border bg-inset px-2 py-0.5 text-text2">
              {name}
            </span>
          ))}
        </div>
      )}

      <EditableBlockList
        sectionId={section.id}
        projectId={section.projectId}
        sectionLabel={section.title}
        initialBlocks={section.blocks}
        linkableItems={linkableItems ?? []}
        onOpenLink={(id, kind) => {
          const item = (linkableItems ?? []).find((candidate) => candidate.id === id)
          const label = item?.label ?? id
          if (kind === 'note') openTab({ kind: 'note', refId: id, title: label, icon: 'FileText' })
          else openTab({ kind: 'section', refId: id, title: label, icon: 'FileText' })
        }}
      />
    </div>
  )
}

export function SectionView({ sectionKey }: { sectionKey: string }) {
  const { data: project } = useActiveProject()
  const { data: section, loading } = useSectionByKey(project?.id, sectionKey)
  const { data: collaborators } = useCollaborators(project?.id)

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8" aria-hidden="true">
        <div className="h-8 w-64 animate-pulse rounded bg-inset" />
        <div className="h-24 animate-pulse rounded bg-inset" />
      </div>
    )
  }

  if (!section) {
    return <EmptyDocument title="Section not found" body="This section doesn't exist in the current project yet." />
  }

  const ownerNames = (collaborators ?? []).filter((c) => section.owners.includes(c.id)).map((c) => c.name)

  return <LoadedSection key={section.id} section={section} ownerNames={ownerNames} />
}
