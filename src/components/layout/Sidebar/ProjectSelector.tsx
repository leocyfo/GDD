import { useActiveProject } from '../../../data/hooks/entityHooks'
import { useWorkspaceStore } from '../../../stores/useWorkspaceStore'
import { CompassMark } from '../../common/CompassMark'

export function ProjectSelector() {
  const { data: project, loading } = useActiveProject()
  const goToHub = useWorkspaceStore((s) => s.goToHub)

  return (
    <button
      type="button"
      onClick={goToHub}
      title="Back to all documents"
      aria-label="Back to all documents"
      className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:bg-inset"
    >
      <CompassMark />
      {loading || !project ? (
        <span className="h-3 w-24 animate-pulse rounded bg-inset" aria-hidden="true" />
      ) : (
        <span className="min-w-0 truncate text-sm font-medium text-text2">{project.name}</span>
      )}
    </button>
  )
}
