import type { Block } from '../../../data/types/entities'
import { ControlsDiagramBlockView } from './ControlsDiagramBlock'
import { FlowMapBlockView } from './FlowMapBlock'
import { DiagramBlockView, QueryBlockView } from './FutureBlocks'
import { LevelCatalogBlockView } from './LevelCatalogBlock'
import { EmbedNoteBlockView, FeatureCardsBlockView, LoopBlockView, ScopeMatrixBlockView } from './LinkedBlocks'
import { AnnotatedMapBlockView, GalleryBlockView, ImageBlockView, PaletteBlockView } from './MediaBlocks'
import { CalloutBlockView, HeadingBlockView, ListBlockView, TableBlockView, TextBlockView } from './TextBlocks'

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlockView block={block} />
    case 'heading':
      return <HeadingBlockView block={block} />
    case 'list':
      return <ListBlockView block={block} />
    case 'callout':
      return <CalloutBlockView block={block} />
    case 'table':
      return <TableBlockView block={block} />
    case 'image':
      return <ImageBlockView block={block} />
    case 'gallery':
      return <GalleryBlockView block={block} />
    case 'palette':
      return <PaletteBlockView block={block} />
    case 'loop':
      return <LoopBlockView block={block} />
    case 'featureCards':
      return <FeatureCardsBlockView block={block} />
    case 'scopeMatrix':
      return <ScopeMatrixBlockView block={block} />
    case 'embedNote':
      return <EmbedNoteBlockView block={block} />
    case 'query':
      return <QueryBlockView block={block} />
    case 'diagram':
      return <DiagramBlockView block={block} />
    case 'annotatedMap':
      return <AnnotatedMapBlockView block={block} />
    case 'controlsDiagram':
      return <ControlsDiagramBlockView block={block} />
    case 'flowMap':
      return <FlowMapBlockView block={block} />
    case 'levelCatalog':
      return <LevelCatalogBlockView block={block} />
  }
}

export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  )
}
