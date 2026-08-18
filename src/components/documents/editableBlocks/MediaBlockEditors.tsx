import { Plus, Upload, X } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { useActiveProject, useAssets } from '../../../data/hooks/entityHooks'
import { uploadAsset } from '../../../data/newAsset'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { Block } from '../../../data/types/entities'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { fixedWidthInputClass, inputClass, selectClass } from '../../editor/fieldStyles'
import { AnnotatedMapBlockView, AssetImage } from '../blocks/MediaBlocks'

type ImageBlock = Extract<Block, { type: 'image' }>
type GalleryBlock = Extract<Block, { type: 'gallery' }>
type PaletteBlock = Extract<Block, { type: 'palette' }>
type AnnotatedMapBlock = Extract<Block, { type: 'annotatedMap' }>

/** Reads a picked file straight into an `Asset` (see `uploadAsset` — no
 * backend, so this is a data: URL under the hood) and hands the new id
 * back — shared by every place a block references an asset, so "pick an
 * existing one" and "bring a new one in" are never two different UIs. */
function useAssetUploader(onUploaded: (assetId: string) => void) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [uploading, setUploading] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !project) return
    setUploading(true)
    try {
      const asset = await uploadAsset(repo, { projectId: project.id, file })
      notifyDataChanged()
      onUploaded(asset.id)
    } finally {
      setUploading(false)
    }
  }

  return { uploading, handleFile }
}

export function UploadButton({ onUploaded }: { onUploaded: (assetId: string) => void }) {
  const { uploading, handleFile } = useAssetUploader(onUploaded)
  return (
    <label
      className={`flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-[7px] text-2xs text-text2 transition-colors hover:border-border-hover ${uploading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <Upload size={12} />
      {uploading ? 'Uploading…' : 'Upload'}
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  )
}

function AssetSelect({ value, onChange }: { value: string; onChange: (assetId: string) => void }) {
  const { data: project } = useActiveProject()
  const { data: assets } = useAssets(project?.id)
  return (
    <div className="flex items-center gap-1.5">
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${selectClass} min-w-0 flex-1`}>
        <option value="">Choose an asset…</option>
        {(assets ?? []).map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.caption}
          </option>
        ))}
      </select>
      <UploadButton onUploaded={onChange} />
    </div>
  )
}

export function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (b: Block) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <AssetImage assetId={block.assetId} caption={block.caption} />
      <AssetSelect value={block.assetId} onChange={(assetId) => onChange({ ...block, assetId })} />
      <input
        value={block.caption}
        onChange={(event) => onChange({ ...block, caption: event.target.value })}
        placeholder="Caption"
        className={inputClass}
      />
    </div>
  )
}

export function GalleryBlockEditor({ block, onChange }: { block: GalleryBlock; onChange: (b: Block) => void }) {
  const { data: project } = useActiveProject()
  const { data: assets } = useAssets(project?.id)
  const available = (assets ?? []).filter((asset) => !block.assetIds.includes(asset.id))

  return (
    <div className="flex flex-col gap-2">
      {block.assetIds.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {block.assetIds.map((id) => {
            const asset = (assets ?? []).find((a) => a.id === id)
            return (
              <div key={id} className="group/thumb relative">
                <AssetImage assetId={id} caption={asset?.caption ?? ''} />
                <button
                  type="button"
                  aria-label="Remove from gallery"
                  onClick={() => onChange({ ...block, assetIds: block.assetIds.filter((existing) => existing !== id) })}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card/90 text-text2 opacity-0 shadow-card transition-opacity hover:text-red group-hover/thumb:opacity-100"
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {available.length > 0 && (
          <select
            value=""
            onChange={(event) => event.target.value && onChange({ ...block, assetIds: [...block.assetIds, event.target.value] })}
            className={`${selectClass} min-w-0 flex-1`}
          >
            <option value="">Add an asset…</option>
            {available.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.caption}
              </option>
            ))}
          </select>
        )}
        <UploadButton onUploaded={(assetId) => onChange({ ...block, assetIds: [...block.assetIds, assetId] })} />
      </div>
    </div>
  )
}

export function PaletteBlockEditor({ block, onChange }: { block: PaletteBlock; onChange: (b: Block) => void }) {
  function updateSwatch(index: number, patch: Partial<{ hex: string; name: string }>) {
    const swatches = block.swatches.map((swatch, i) => (i === index ? { ...swatch, ...patch } : swatch))
    onChange({ ...block, swatches })
  }
  function removeSwatch(index: number) {
    onChange({ ...block, swatches: block.swatches.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-1.5">
      {block.swatches.map((swatch, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(swatch.hex) ? swatch.hex : '#888888'}
            onChange={(event) => updateSwatch(index, { hex: event.target.value })}
            className="h-8 w-8 flex-shrink-0 cursor-pointer rounded border border-border bg-transparent"
          />
          <input
            value={swatch.hex}
            onChange={(event) => updateSwatch(index, { hex: event.target.value })}
            className={`${fixedWidthInputClass} w-28 flex-shrink-0 font-mono`}
          />
          <input
            value={swatch.name}
            onChange={(event) => updateSwatch(index, { name: event.target.value })}
            placeholder="Color name"
            className={inputClass}
          />
          <button type="button" aria-label="Remove swatch" onClick={() => removeSwatch(index)} className="flex-shrink-0 text-text3 hover:text-red">
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, swatches: [...block.swatches, { hex: '#888888', name: 'New color' }] })}
        className="flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2"
      >
        <Plus size={11} />
        Add swatch
      </button>
    </div>
  )
}

export function AnnotatedMapBlockEditor({ block, onChange }: { block: AnnotatedMapBlock; onChange: (b: Block) => void }) {
  function updatePin(index: number, patch: Partial<AnnotatedMapBlock['pins'][number]>) {
    const pins = block.pins.map((pin, i) => (i === index ? { ...pin, ...patch } : pin))
    onChange({ ...block, pins })
  }
  function removePin(index: number) {
    onChange({ ...block, pins: block.pins.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-2">
      <AnnotatedMapBlockView block={block} />
      <AssetSelect value={block.assetId} onChange={(assetId) => onChange({ ...block, assetId })} />
      {block.pins.map((pin, index) => (
        <div key={pin.id} className="flex items-center gap-1.5">
          <input
            value={pin.label}
            onChange={(event) => updatePin(index, { label: event.target.value })}
            placeholder="Pin label"
            className={inputClass}
          />
          <input
            type="number"
            value={pin.x}
            onChange={(event) => updatePin(index, { x: Number(event.target.value) })}
            className={`${fixedWidthInputClass} w-16 flex-shrink-0`}
            title="X %"
          />
          <input
            type="number"
            value={pin.y}
            onChange={(event) => updatePin(index, { y: Number(event.target.value) })}
            className={`${fixedWidthInputClass} w-16 flex-shrink-0`}
            title="Y %"
          />
          <button type="button" aria-label="Remove pin" onClick={() => removePin(index)} className="flex-shrink-0 text-text3 hover:text-red">
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...block,
            pins: [...block.pins, { id: `pin:${Date.now()}`, x: 50, y: 50, label: 'New pin' }],
          })
        }
        className="flex w-fit items-center gap-1 text-2xs text-text3 hover:text-text2"
      >
        <Plus size={11} />
        Add pin
      </button>
    </div>
  )
}
