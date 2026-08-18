import { useActiveProject, useLogicNote, useSectionByKey } from '../../../data/hooks/entityHooks'
import type { Tab } from '../../../stores/useTabsStore'

export function Breadcrumb({ tab }: { tab: Tab | null }) {
  const { data: project } = useActiveProject()
  const { data: section } = useSectionByKey(project?.id, tab?.kind === 'section' ? tab.refId : undefined)
  const { data: note } = useLogicNote(tab?.kind === 'note' ? tab.refId : undefined)

  if (!tab) {
    return <div className="h-8 flex-shrink-0 border-b border-border" aria-hidden="true" />
  }

  let segments: string[]
  switch (tab.kind) {
    case 'overview':
      segments = ['GDD', 'Overview']
      break
    case 'section':
      segments = ['GDD', section ? `${section.index}. ${section.title}` : tab.title]
      break
    case 'note':
      segments = note ? ['Vault', ...note.folderPath.split('/'), note.title] : ['Vault', tab.title]
      break
    case 'changelog':
      segments = ['Changelog']
      break
    case 'team':
      segments = ['Team']
      break
    case 'features':
      segments = ['Feature Cards']
      break
    case 'decisions':
      segments = ['Decisions']
      break
    case 'milestones':
      segments = ['Milestones']
      break
    case 'scopeMatrix':
      segments = ['Scope Matrix']
      break
    case 'loops':
      segments = ['Gameplay Loops']
      break
    case 'assets':
      segments = ['Asset List']
      break
  }

  return (
    <div className="flex h-8 flex-shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-4 text-xs-plus text-text3">
      {segments.map((segment, index) => (
        <span key={index} className="flex flex-shrink-0 items-center gap-1.5">
          {index > 0 && <span aria-hidden="true">/</span>}
          <span className={index === segments.length - 1 ? 'text-text2' : ''}>{segment}</span>
        </span>
      ))}
    </div>
  )
}
