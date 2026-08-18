import { ChevronDown, ChevronUp, ImageIcon, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, useLevels } from '../../../data/hooks/entityHooks'
import { createLevel } from '../../../data/newLevel'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { Block, Level, LevelStatus } from '../../../data/types/entities'
import { useAutosave } from '../../../lib/useAutosave'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { inputClass, selectClass } from '../../editor/fieldStyles'
import { AssetImage } from '../blocks/MediaBlocks'
import { UploadButton } from './MediaBlockEditors'

type LevelCatalogBlock = Extract<Block, { type: 'levelCatalog' }>

const STATUSES: LevelStatus[] = ['concept', 'blockout', 'art-pass', 'done']

const plainInputClass =
  'block w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-inset'

function LevelCard({ level, canMoveUp, canMoveDown, onMove }: { level: Level; canMoveUp: boolean; canMoveDown: boolean; onMove: (dir: -1 | 1) => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [name, setName] = useState(level.name)
  const [summary, setSummary] = useState(level.summary)
  const [uniqueFeatures, setUniqueFeatures] = useState(level.uniqueFeatures)

  async function patch(fields: Partial<Level>, summaryMsg: string) {
    await repo.levels.update(level.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'level', id: level.id, label: fields.name ?? level.name },
        kind: 'edited',
        diffSummary: summaryMsg,
      })
    }
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed a level.'))
  const summarySave = useAutosave<string>((v) => patch({ summary: v }, "Edited a level's summary."))
  const featuresSave = useAutosave<string>((v) => patch({ uniqueFeatures: v }, "Edited a level's unique features."))

  async function remove() {
    await repo.levels.delete(level.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'level', id: level.id, label: level.name },
        kind: 'deleted',
        diffSummary: 'Removed a level.',
      })
    }
    notifyDataChanged()
  }

  return (
    <div className="group/level rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
          {level.assetId ? (
            <AssetImage assetId={level.assetId} caption={name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-border text-text3">
              <ImageIcon size={16} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                nameSave.schedule(event.target.value)
              }}
              onBlur={nameSave.flush}
              placeholder="Level name"
              className={`${plainInputClass} flex-1 text-sm-plus font-medium text-text1`}
            />
            <select
              value={level.status}
              onChange={(event) => patch({ status: event.target.value as LevelStatus }, 'Changed level status.')}
              className={`${selectClass} flex-shrink-0 py-1 text-2xs capitalize`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <input
            value={summary}
            onChange={(event) => {
              setSummary(event.target.value)
              summarySave.schedule(event.target.value)
            }}
            onBlur={summarySave.flush}
            placeholder="Summary — one or two sentences"
            className={`${plainInputClass} text-xs-plus text-text2`}
          />
          <input
            value={uniqueFeatures}
            onChange={(event) => {
              setUniqueFeatures(event.target.value)
              featuresSave.schedule(event.target.value)
            }}
            onBlur={featuresSave.flush}
            placeholder="What makes this one different"
            className={`${plainInputClass} text-2xs text-text3`}
          />
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/level:opacity-100">
            <button type="button" aria-label="Move level up" disabled={!canMoveUp} onClick={() => onMove(-1)} className="text-text3 hover:text-text1 disabled:opacity-30">
              <ChevronUp size={13} />
            </button>
            <button type="button" aria-label="Move level down" disabled={!canMoveDown} onClick={() => onMove(1)} className="text-text3 hover:text-text1 disabled:opacity-30">
              <ChevronDown size={13} />
            </button>
            <button type="button" aria-label="Remove level" onClick={remove} className="text-text3 hover:text-red">
              <X size={13} />
            </button>
          </div>
          <UploadButton onUploaded={(assetId) => patch({ assetId }, 'Set level art.')} />
        </div>
      </div>
    </div>
  )
}

function NewLevelForm({ nextOrder }: { nextOrder: number }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const level = await createLevel(repo, { projectId: project.id, name: trimmed, nextOrder, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'level', id: level.id, label: level.name },
        kind: 'created',
        diffSummary: 'New level.',
      })
      notifyDataChanged()
      setName('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1.5 text-2xs text-text3 hover:text-text2">
        <Plus size={11} />
        Add level
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-md border border-dashed border-border bg-inset p-2">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Level or POI name" className={inputClass} />
      <button type="submit" disabled={!name.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
        {busy ? 'Adding…' : 'Add'}
      </button>
      <button type="button" aria-label="Cancel" onClick={() => setCreating(false)} className="flex-shrink-0 rounded-md border border-border p-1.5 text-text2 hover:border-border-hover">
        <X size={14} />
      </button>
    </form>
  )
}

/** Unlike most block editors, this reads/writes `Level` entities straight
 * through the repository instead of the block's own JSON — the block is
 * `{ type: 'levelCatalog' }`, no fields, so `onChange` is never called.
 * Same shape as `LoopsView`/`PillarsPanel` for the same reason. */
export function LevelCatalogBlockEditor({ block: _block }: { block: LevelCatalogBlock; onChange: (b: Block) => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: levels } = useLevels(project?.id)
  const sorted = levels ?? [] // already sorted by `order` via listByProject

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sorted.length) return
    const a = sorted[index]
    const b = sorted[target]
    await Promise.all([repo.levels.update(a.id, { order: b.order }), repo.levels.update(b.id, { order: a.order })])
    notifyDataChanged()
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((level, index) => (
        <LevelCard key={level.id} level={level} canMoveUp={index > 0} canMoveDown={index < sorted.length - 1} onMove={(dir) => move(index, dir)} />
      ))}
      {sorted.length === 0 && <p className="text-sm text-text3">No levels yet.</p>}
      <NewLevelForm nextOrder={sorted.length > 0 ? Math.max(...sorted.map((l) => l.order)) + 1 : 1} />
    </div>
  )
}
