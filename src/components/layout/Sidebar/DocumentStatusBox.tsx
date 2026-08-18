import { useActiveProject } from '../../../data/hooks/entityHooks'
import { editPolicyLabel } from '../../../lib/format'
import { toneForProjectStatus } from '../../../lib/tones'
import { StatusDot } from '../../common/StatusDot'

export function DocumentStatusBox() {
  const { data: project, loading } = useActiveProject()

  return (
    <div className="mt-auto border-t border-border pt-4">
      <div className="mb-2 text-xs font-medium uppercase text-text3">Document Status</div>
      {loading || !project ? (
        <div className="h-3 w-20 animate-pulse rounded bg-inset" aria-hidden="true" />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StatusDot tone={toneForProjectStatus(project.status)} />
            <span className="text-sm-plus capitalize text-text1">{project.status}</span>
          </div>
          <div className="mt-1.5 text-xs-plus text-text3">{editPolicyLabel(project.editPolicy)}</div>
        </>
      )}
    </div>
  )
}
