import { Check, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { useRepoQuery } from '../../../data/hooks/useRepoQuery'
import type { Asset, Block } from '../../../data/types/entities'

type ImageBlock = Extract<Block, { type: 'image' }>
type GalleryBlock = Extract<Block, { type: 'gallery' }>
type PaletteBlock = Extract<Block, { type: 'palette' }>
type AnnotatedMapBlock = Extract<Block, { type: 'annotatedMap' }>

function AssetPlaceholder({ caption, empty }: { caption: string; empty: boolean }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-inset px-4 text-center">
      <ImageIcon size={20} className="text-text3" />
      <span className="text-xs-plus text-text3">{caption}</span>
      {empty && <span className="text-2xs text-text3">No image chosen yet — pick or upload one in the editor.</span>}
    </div>
  )
}

/** Renders the real image once an asset actually has a `url` (uploaded, or
 * seeded with one) — otherwise falls back to a placeholder instead of
 * pretending art exists. `caption` prefers the block's own (it's the
 * author's context for *this* placement) over the asset's stored one. */
export function AssetImage({ assetId, caption }: { assetId: string; caption: string }) {
  const { data: asset } = useAsset(assetId)
  if (!asset) return <AssetPlaceholder caption={caption} empty={!assetId} />
  if (!asset.url) return <AssetPlaceholder caption={caption || asset.caption} empty />
  return (
    <img
      src={asset.url}
      alt={caption || asset.caption}
      className="aspect-video w-full rounded-lg border border-border object-cover"
    />
  )
}

export function ImageBlockView({ block }: { block: ImageBlock }) {
  return <AssetImage assetId={block.assetId} caption={block.caption} />
}

export function GalleryBlockView({ block }: { block: GalleryBlock }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {block.assetIds.map((assetId) => (
        <GalleryItem key={assetId} assetId={assetId} />
      ))}
    </div>
  )
}

function GalleryItem({ assetId }: { assetId: string }) {
  const { data: asset } = useAsset(assetId)
  return <AssetImage assetId={assetId} caption={asset?.caption ?? ''} />
}

function useAsset(assetId: string) {
  return useRepoQuery<Asset | undefined>((repo) => repo.assets.get(assetId), [assetId])
}

export function PaletteBlockView({ block }: { block: PaletteBlock }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(hex)
      setTimeout(() => setCopied((current) => (current === hex ? null : current)), 1500)
    } catch {
      // Clipboard access can be denied — the swatch still shows the hex
      // value, so the color is never actually unreadable.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {block.swatches.map((swatch) => (
        <button
          key={swatch.hex}
          type="button"
          onClick={() => copy(swatch.hex)}
          className="flex items-center gap-2 rounded-lg border border-border bg-inset py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-border-hover"
        >
          <span className="h-6 w-6 flex-shrink-0 rounded" style={{ background: swatch.hex }} aria-hidden="true" />
          <span className="flex flex-col">
            <span className="text-xs-plus text-text2">{swatch.name}</span>
            <span className="flex items-center gap-1 font-mono text-2xs text-text3">
              {copied === swatch.hex ? (
                <>
                  <Check size={10} className="text-green" /> Copied
                </>
              ) : (
                swatch.hex
              )}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function AnnotatedMapBlockView({ block }: { block: AnnotatedMapBlock }) {
  const { data: asset } = useAsset(block.assetId)
  return (
    <div
      className="relative h-[220px] w-full overflow-hidden rounded-lg border border-border bg-cover bg-center"
      style={
        asset?.url
          ? { backgroundImage: `url(${asset.url})` }
          : {
              background:
                'repeating-linear-gradient(to right, var(--raw-border) 0 1px, transparent 1px 16px), repeating-linear-gradient(to bottom, var(--raw-border) 0 1px, transparent 1px 16px), var(--raw-bg-inset)',
            }
      }
    >
      {block.pins.map((pin) => (
        <div
          key={pin.id}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <span className="h-2 w-2 rounded-full border border-border bg-accent" aria-hidden="true" />
          <span className="mt-1 whitespace-nowrap rounded border border-border bg-card px-1.5 py-0.5 text-2xs text-text2">
            {pin.label}
          </span>
        </div>
      ))}
    </div>
  )
}
