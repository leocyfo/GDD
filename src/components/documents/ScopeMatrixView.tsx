import { useActiveProject, useDecisions, useScopeEntries } from '../../data/hooks/entityHooks'
import { SCOPE_MATRIX_ID } from '../../data/scopeMatrixId'
import { NewScopeEntryForm, ScopeEntryRow } from './editableBlocks/LinkedBlockEditors'
import { EmptyDocument } from './EmptyDocument'

/** A dedicated top-level screen, not just a block embedded inside
 * Constraints — both articles this app's GDD-template pass was checked
 * against (see the README's "GDD template alignment" note) call the scope
 * matrix out as the single most important discipline a living GDD needs,
 * on par with Feature Cards and Decisions. Burying it as one block among
 * several undersold it; this gives it the same first-class screen those
 * already get. The `scopeMatrix` block type still exists and still works
 * (see `ScopeMatrixBlockEditor`) for anyone who wants a read-only summary
 * embedded inside a section too — this screen and that block share the
 * exact same row-editing logic (`ScopeEntryRow`/`NewScopeEntryForm`)
 * rather than forking it. */
export function ScopeMatrixView() {
  const { data: project } = useActiveProject()
  const { data: entries, loading, refetch } = useScopeEntries(SCOPE_MATRIX_ID)
  const { data: decisions } = useDecisions(project?.id)

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-8" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-inset" />
        ))}
      </div>
    )
  }

  const rows = entries ?? []
  const unjustified = rows.filter((e) => e.verdict === 'undecided').length

  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-md font-semibold text-text1">Scope Matrix</h1>
        <p className="mt-1 text-xs-plus text-text3">
          {rows.length} items — every "in" or "out" needs a linked decision or evidence, no exceptions.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyDocument title="No scope entries yet" body="Add the first item — what's in, what's out, and why." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border bg-inset px-3 py-2 text-2xs text-text3">
            <span>{rows.length} items</span>
            <span>{rows.filter((e) => e.verdict === 'in').length} in</span>
            <span>{rows.filter((e) => e.verdict === 'out').length} out</span>
            <span>{rows.filter((e) => e.verdict === 'stretch').length} stretch</span>
            <span className={unjustified > 0 ? 'text-red' : ''}>{unjustified} undecided</span>
          </div>
          <table className="w-full min-w-[720px] border-collapse text-sm-plus">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <tbody>
              {rows.map((entry) => (
                <ScopeEntryRow key={entry.id} entry={entry} decisions={decisions ?? []} onRemoved={refetch} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3">
        <NewScopeEntryForm matrixId={SCOPE_MATRIX_ID} onCreated={refetch} />
      </div>
    </div>
  )
}
