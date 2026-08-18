import { ArrowRight, FileText } from 'lucide-react'
import { useFeatureCardsByIds, useLoop, useLogicNote, useScopeEntries } from '../../../data/hooks/entityHooks'
import type { Block, LoopNode } from '../../../data/types/entities'
import { toneForFeatureStatus, toneForScopeVerdict } from '../../../lib/tones'
import { useTabsStore } from '../../../stores/useTabsStore'
import { StatusDot } from '../../common/StatusDot'

type LoopBlock = Extract<Block, { type: 'loop' }>
type FeatureCardsBlock = Extract<Block, { type: 'featureCards' }>
type ScopeMatrixBlock = Extract<Block, { type: 'scopeMatrix' }>
type EmbedNoteBlock = Extract<Block, { type: 'embedNote' }>

/** Pure presentational chain-of-boxes rendering, split out so `LoopsView`
 * (editing a `Loop` entity directly) and this block (reading one by id via
 * `loopId`) share one rendering instead of drifting apart. */
export function LoopDiagram({ nodes, isCycle }: { nodes: LoopNode[]; isCycle: boolean }) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-inset p-3.5">
        <p className="text-sm text-text3">No steps yet.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-inset p-3.5">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5" title={node.note}>
            <span className="text-sm-plus font-medium text-text1">{node.verb}</span>
          </div>
          {index < nodes.length - 1 && <ArrowRight size={14} className="text-text3" />}
        </div>
      ))}
      {isCycle && <ArrowRight size={14} className="text-text3" aria-label="loops back to the first step" />}
    </div>
  )
}

export function LoopBlockView({ block }: { block: LoopBlock }) {
  const { data: loop, loading } = useLoop(block.loopId)

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-inset" aria-hidden="true" />
  if (!loop) return <p className="text-sm text-text3">Loop not found.</p>

  return <LoopDiagram nodes={loop.nodes} isCycle={loop.isCycle} />
}

export function FeatureCardsBlockView({ block }: { block: FeatureCardsBlock }) {
  const { data: cards, loading } = useFeatureCardsByIds(block.featureIds)

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-inset" aria-hidden="true" />

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cards?.map((card) => (
        <div key={card.id} className="rounded-lg border border-border bg-inset p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm-plus font-medium text-text1">{card.name}</span>
            <StatusDot tone={toneForFeatureStatus(card.status)} />
          </div>
          <p className="mt-1 text-xs-plus text-text3">{card.playerPromise}</p>
          <div className="mt-2 font-mono text-2xs uppercase tracking-wide text-text3">{card.status}</div>
        </div>
      ))}
    </div>
  )
}

export function ScopeMatrixBlockView({ block }: { block: ScopeMatrixBlock }) {
  const { data: entries, loading } = useScopeEntries(block.matrixId)

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-inset" aria-hidden="true" />
  if (!entries || entries.length === 0) return <p className="text-sm text-text3">No scope entries yet.</p>

  const unjustified = entries.filter((e) => e.verdict === 'undecided').length

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border bg-inset px-3 py-2 text-2xs text-text3">
        <span>{entries.length} items</span>
        <span>{entries.filter((e) => e.verdict === 'in').length} in</span>
        <span>{entries.filter((e) => e.verdict === 'out').length} out</span>
        <span>{entries.filter((e) => e.verdict === 'stretch').length} stretch</span>
        <span className={unjustified > 0 ? 'text-red' : ''}>{unjustified} undecided</span>
      </div>
      <table className="w-full border-collapse text-sm-plus">
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border last:border-b-0">
              <td className="px-3 py-1.5 text-text2">{entry.item}</td>
              <td className="px-3 py-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot tone={toneForScopeVerdict(entry.verdict)} />
                  <span className="text-xs-plus capitalize text-text3">{entry.verdict}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmbedNoteBlockView({ block }: { block: EmbedNoteBlock }) {
  const { data: note, loading } = useLogicNote(block.noteId)
  const openTab = useTabsStore((s) => s.openTab)

  if (loading) return <div className="h-10 animate-pulse rounded-lg bg-inset" aria-hidden="true" />
  if (!note) return <p className="text-sm text-text3">Note not found.</p>

  return (
    <button
      type="button"
      onClick={() => openTab({ kind: 'note', refId: note.id, title: note.title, icon: 'FileText' })}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-inset px-3 py-2 text-left transition-colors hover:border-border-hover"
    >
      <FileText size={14} className="flex-shrink-0 text-text3" />
      <span className="font-mono text-sm-plus text-accent">{note.title}</span>
      <span className="ml-auto text-2xs text-text3">{note.folderPath}</span>
    </button>
  )
}
