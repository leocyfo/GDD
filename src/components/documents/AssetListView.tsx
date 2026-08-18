import { Check, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import { useActiveProject, useProductionAssets } from '../../data/hooks/entityHooks'
import { createProductionAsset } from '../../data/newProductionAsset'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { AssetKind, ProductionAsset, ProductionAssetStatus } from '../../data/types/entities'
import { useAutosave } from '../../lib/useAutosave'
import { toneForProductionAssetStatus } from '../../lib/tones'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { StatusDot } from '../common/StatusDot'
import { AssetImage } from './blocks/MediaBlocks'
import { UploadButton } from './editableBlocks/MediaBlockEditors'
import { EmptyDocument } from './EmptyDocument'

const KINDS: AssetKind[] = ['image', 'video', 'audio', 'file']
const STATUSES: ProductionAssetStatus[] = ['todo', 'in-progress', 'done', 'cut']

const cellInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-text1 outline-none transition-colors hover:border-border focus-visible:border-accent focus-visible:bg-card'
/** Same "grows with the text instead of clipping it" fix as the Scope
 * Matrix and Systems tables — a plain `<input>` can't wrap, so a longer
 * name/purpose/note just got clipped inside it with no sign there was
 * more. */
const cellTextareaClass = `${cellInputClass} resize-none overflow-hidden [field-sizing:content]`

function AssetRow({ entry }: { entry: ProductionAsset }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [name, setName] = useState(entry.name)
  const [purpose, setPurpose] = useState(entry.purpose)
  const [notes, setNotes] = useState(entry.notes)

  async function patch(fields: Partial<ProductionAsset>, summary: string) {
    await repo.productionAssets.update(entry.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'production-asset', id: entry.id, label: fields.name ?? entry.name },
        kind: 'edited',
        diffSummary: summary,
      })
    }
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed a planned asset.'))
  const purposeSave = useAutosave<string>((v) => patch({ purpose: v }, "Edited a planned asset's purpose."))
  const notesSave = useAutosave<string>((v) => patch({ notes: v }, 'Edited notes on a planned asset.'))

  async function remove() {
    await repo.productionAssets.delete(entry.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'production-asset', id: entry.id, label: entry.name },
        kind: 'deleted',
        diffSummary: 'Removed a planned asset.',
      })
    }
    notifyDataChanged()
  }

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-1.5 py-1.5 align-top">
        <textarea
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            nameSave.schedule(event.target.value)
          }}
          onBlur={nameSave.flush}
          rows={1}
          placeholder="Name"
          className={cellTextareaClass}
        />
      </td>
      <td className="px-1.5 py-1.5 align-top">
        <select
          value={entry.kind}
          onChange={(event) => patch({ kind: event.target.value as AssetKind }, 'Changed asset kind.')}
          className={`${selectClass} w-full capitalize`}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </td>
      <td className="px-1.5 py-1.5 align-top">
        <textarea
          value={purpose}
          onChange={(event) => {
            setPurpose(event.target.value)
            purposeSave.schedule(event.target.value)
          }}
          onBlur={purposeSave.flush}
          rows={1}
          placeholder="What it's for"
          className={cellTextareaClass}
        />
      </td>
      <td className="px-1.5 py-1.5 align-top">
        <span className="flex items-center gap-1.5">
          <StatusDot tone={toneForProductionAssetStatus(entry.status)} />
          <select
            value={entry.status}
            onChange={(event) => patch({ status: event.target.value as ProductionAssetStatus }, 'Changed asset status.')}
            className="min-w-0 rounded border border-transparent bg-transparent py-0.5 pl-0 pr-4 text-sm-plus capitalize text-text2 outline-none transition-colors hover:border-border focus-visible:border-accent"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </span>
      </td>
      <td className="px-1.5 py-1.5 align-top">
        {entry.assetId ? (
          entry.kind === 'image' ? (
            <div className="h-12 w-20">
              <AssetImage assetId={entry.assetId} caption={entry.name} />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-2xs text-green">
              <Check size={12} />
              Delivered
            </span>
          )
        ) : entry.kind === 'image' ? (
          <UploadButton onUploaded={(assetId) => patch({ assetId, status: entry.status === 'todo' ? 'done' : entry.status }, 'Delivered a planned asset.')} />
        ) : (
          <span className="text-2xs text-text3">—</span>
        )}
      </td>
      <td className="px-1.5 py-1.5 align-top">
        <textarea
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value)
            notesSave.schedule(event.target.value)
          }}
          onBlur={notesSave.flush}
          rows={1}
          placeholder="Notes"
          className={cellTextareaClass}
        />
      </td>
      <td className="px-1 py-1.5 text-center align-top">
        <button type="button" aria-label="Remove planned asset" onClick={remove} className="text-text3 hover:text-red">
          <X size={12} />
        </button>
      </td>
    </tr>
  )
}

function NewAssetForm() {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AssetKind>('image')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const entry = await createProductionAsset(repo, { projectId: project.id, name: trimmed, kind, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'production-asset', id: entry.id, label: entry.name },
        kind: 'created',
        diffSummary: 'New planned asset.',
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
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs-plus text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={12} />
        New asset
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-md border border-dashed border-border bg-inset p-2">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Storm damage VFX" className={inputClass} />
      <select value={kind} onChange={(event) => setKind(event.target.value as AssetKind)} className={`${selectClass} capitalize`}>
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!name.trim() || busy} className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
        {busy ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setCreating(false)}
        className="flex-shrink-0 rounded-md border border-border p-1.5 text-text2 hover:border-border-hover"
      >
        <X size={14} />
      </button>
    </form>
  )
}

export function AssetListView() {
  const { data: project } = useActiveProject()
  const { data: entries, loading } = useProductionAssets(project?.id)

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-8" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-inset" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-8 py-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-md font-semibold text-text1">Asset List</h1>
          <p className="mt-1 text-xs-plus text-text3">
            {(entries ?? []).length} planned {(entries ?? []).length === 1 ? 'asset' : 'assets'} — what the game still needs, separate from what's
            already uploaded.
          </p>
        </div>
        <NewAssetForm />
      </div>

      {(!entries || entries.length === 0) && (
        <EmptyDocument title="Nothing planned yet" body="Add the first asset the game needs — art, audio, or anything else." />
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] border-collapse text-sm-plus">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '3%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-inset">
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Name</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Kind</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Purpose</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Status</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Delivered</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">Notes</th>
                <th className="w-8 px-1 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <AssetRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
