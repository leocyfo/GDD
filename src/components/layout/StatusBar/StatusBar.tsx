import { useActiveProject, useLogicNote, useSectionByKey } from '../../../data/hooks/entityHooks'
import { countWordsAndChars, relativeTime } from '../../../lib/format'
import { sectionPlainText } from '../../../lib/wordCount'
import type { Tab } from '../../../stores/useTabsStore'

export function StatusBar({ tab }: { tab: Tab }) {
  const { data: project } = useActiveProject()
  const { data: section } = useSectionByKey(project?.id, tab.kind === 'section' ? tab.refId : undefined)
  const { data: note } = useLogicNote(tab.kind === 'note' ? tab.refId : undefined)

  let words = 0
  let chars = 0
  let backlinks: number | null = null
  let updatedAt: string | null = null

  if (tab.kind === 'section' && section) {
    const stats = countWordsAndChars(sectionPlainText(section.blocks))
    words = stats.words
    chars = stats.chars
    updatedAt = section.updatedAt
  } else if (tab.kind === 'note' && note) {
    const stats = countWordsAndChars(`${note.values} ${note.logic} ${note.extras}`)
    words = stats.words
    chars = stats.chars
    backlinks = note.inbound.length
    updatedAt = note.updatedAt
  } else if (tab.kind === 'overview' && project) {
    const stats = countWordsAndChars(project.intro)
    words = stats.words
    chars = stats.chars
    updatedAt = project.updatedAt
  }

  return (
    <div className="flex h-7 flex-shrink-0 items-center gap-4 border-t border-border px-4 text-2xs text-text3">
      <span>{backlinks === null ? '— backlinks' : `${backlinks} backlink${backlinks === 1 ? '' : 's'}`}</span>
      <span>{words} words</span>
      <span>{chars} characters</span>
      <span className="ml-auto">{updatedAt ? `Saved ${relativeTime(updatedAt)}` : 'Not saved yet'}</span>
    </div>
  )
}
