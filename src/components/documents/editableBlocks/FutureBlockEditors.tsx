import { Search } from 'lucide-react'
import type { Block } from '../../../data/types/entities'
import { DiagramBlockView } from '../blocks/FutureBlocks'

type QueryBlock = Extract<Block, { type: 'query' }>
type DiagramBlock = Extract<Block, { type: 'diagram' }>

/** Same dashed-border "this is stored but not live yet" box as the
 * read-only view (`FutureBlocks.tsx`) — the editor used to just drop a
 * bare default textarea here, which read like an unstyled leftover next
 * to every other block's deliberate chrome. Editing and reading the same
 * stub now look like the same block, not two different ones. */
const textareaClass =
  'w-full resize-y rounded-md border border-transparent bg-card/60 px-2 py-1.5 font-mono text-xs-plus text-text2 outline-none transition-colors placeholder:text-text3 hover:border-border focus-visible:border-accent'

export function QueryBlockEditor({ block, onChange }: { block: QueryBlock; onChange: (b: Block) => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-inset p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-text3">
        <Search size={12} />
        Live query — results ship in a later phase
      </div>
      <textarea
        value={block.expression}
        onChange={(event) => onChange({ ...block, expression: event.target.value })}
        rows={3}
        placeholder={'FROM "GAME LOGIC/ECONOMY" WHERE tag = "status/wip" AS table(title, scope)'}
        className={textareaClass}
      />
    </div>
  )
}

export function DiagramBlockEditor({ block, onChange }: { block: DiagramBlock; onChange: (b: Block) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <DiagramBlockView block={block} />
      <textarea
        value={block.mermaid}
        onChange={(event) => onChange({ ...block, mermaid: event.target.value })}
        rows={4}
        placeholder={'graph TD\n  A[Explore] --> B[Encounter]'}
        className={textareaClass}
      />
    </div>
  )
}
