import { useActiveProject, useLevels } from '../../../data/hooks/entityHooks'
import type { Block } from '../../../data/types/entities'
import { toneForLevelStatus } from '../../../lib/tones'
import { StatusDot } from '../../common/StatusDot'
import { AssetImage } from './MediaBlocks'

type LevelCatalogBlock = Extract<Block, { type: 'levelCatalog' }>

/** No stored ids on the block itself (see the type's own comment) — always
 * shows every `Level` the current project has, same "one global thing"
 * reasoning as `scopeMatrix`. */
export function LevelCatalogBlockView({ block: _block }: { block: LevelCatalogBlock }) {
  const { data: project } = useActiveProject()
  const { data: levels, loading } = useLevels(project?.id)

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-inset" aria-hidden="true" />
  if (!levels || levels.length === 0) return <p className="text-sm text-text3">No levels yet.</p>

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {levels.map((level) => (
        <div key={level.id} className="overflow-hidden rounded-lg border border-border bg-inset">
          <div className="aspect-video w-full">
            <AssetImage assetId={level.assetId ?? ''} caption={level.name} />
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm-plus font-medium text-text1">{level.name}</span>
              <span className="flex items-center gap-1.5 text-2xs text-text3">
                <StatusDot tone={toneForLevelStatus(level.status)} />
                <span className="capitalize">{level.status}</span>
              </span>
            </div>
            {level.summary && <p className="mt-1 text-xs-plus text-text3">{level.summary}</p>}
            {level.uniqueFeatures && <p className="mt-1.5 text-2xs text-text3">{level.uniqueFeatures}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
