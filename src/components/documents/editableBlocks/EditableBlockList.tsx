import { useState } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { Block } from '../../../data/types/entities'
import { useAutosave } from '../../../lib/useAutosave'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { SaveIndicator } from '../../common/SaveIndicator'
import type { WikilinkItem } from '../../editor/wikilinkExtension'
import { EmptyDocument } from '../EmptyDocument'
import { AddBlockMenu } from './AddBlockMenu'
import { BlockChrome } from './BlockChrome'
import { EditableBlockRenderer } from './EditableBlockRenderer'

/**
 * Owns a section's `blocks` array end to end: local state for instant
 * typing feedback, one debounced autosave for the whole array (blocks live
 * together as one field on the `Section` record, so a save writes them
 * together too), and the insert/remove/reorder operations the block chrome
 * and "Add block" menu call into. Reordering swaps two array positions
 * directly — no drag library, just the up/down controls in `BlockChrome`.
 */
export function EditableBlockList({
  sectionId,
  projectId,
  sectionLabel,
  initialBlocks,
  linkableItems,
  onOpenLink,
}: {
  sectionId: string
  projectId: string
  sectionLabel: string
  initialBlocks: Block[]
  linkableItems: WikilinkItem[]
  onOpenLink: (id: string, kind: WikilinkItem['kind']) => void
}) {
  const repo = useRepository()
  const [blocks, setBlocks] = useState(initialBlocks)

  const autosave = useAutosave<Block[]>(async (value) => {
    await repo.sections.update(sectionId, { blocks: value, updatedBy: LOCAL_ACTOR })
    await logChange(repo, {
      projectId,
      by: LOCAL_ACTOR,
      target: { type: 'section', id: sectionId, label: sectionLabel },
      kind: 'edited',
      diffSummary: 'Edited section content.',
    })
    notifyDataChanged()
  }, 900)

  function commit(next: Block[]) {
    setBlocks(next)
    autosave.schedule(next)
  }

  function updateBlockAt(index: number, block: Block) {
    commit(blocks.map((existing, i) => (i === index ? block : existing)))
  }
  function removeBlockAt(index: number) {
    commit(blocks.filter((_, i) => i !== index))
  }
  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }
  function insertBlockAt(index: number, block: Block) {
    commit([...blocks.slice(0, index), block, ...blocks.slice(index)])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-auto w-full max-w-3xl">
        <AddBlockMenu onInsert={(block) => insertBlockAt(0, block)} label="Add block at top" />
      </div>

      {blocks.length === 0 && (
        <div className="mx-auto w-full max-w-3xl">
          <EmptyDocument title="Nothing here yet" body="Add the first block below to start writing this section." />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => (
          <BlockChrome
            key={index}
            type={block.type}
            canMoveUp={index > 0}
            canMoveDown={index < blocks.length - 1}
            onMoveUp={() => moveBlock(index, -1)}
            onMoveDown={() => moveBlock(index, 1)}
            onDelete={() => removeBlockAt(index)}
          >
            <EditableBlockRenderer
              block={block}
              onChange={(next) => updateBlockAt(index, next)}
              linkableItems={linkableItems}
              onOpenLink={onOpenLink}
            />
          </BlockChrome>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <AddBlockMenu onInsert={(block) => insertBlockAt(blocks.length, block)} label="Add block" />
        <SaveIndicator state={autosave.state} />
      </div>
    </div>
  )
}
