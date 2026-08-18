import type { Block } from '../../../data/types/entities'
import type { WikilinkItem } from '../../editor/wikilinkExtension'
import { ControlsDiagramBlockEditor } from './ControlsDiagramBlockEditor'
import { FlowMapBlockEditor } from './FlowMapBlockEditor'
import { DiagramBlockEditor, QueryBlockEditor } from './FutureBlockEditors'
import { LevelCatalogBlockEditor } from './LevelCatalogBlockEditor'
import { EmbedNoteBlockEditor, FeatureCardsBlockEditor, LoopBlockEditor, ScopeMatrixBlockEditor } from './LinkedBlockEditors'
import { AnnotatedMapBlockEditor, GalleryBlockEditor, ImageBlockEditor, PaletteBlockEditor } from './MediaBlockEditors'
import { CalloutBlockEditor, HeadingBlockEditor, ListBlockEditor, TableBlockEditor, TextBlockEditor } from './TextBlockEditors'

export function EditableBlockRenderer({
  block,
  onChange,
  linkableItems,
  onOpenLink,
}: {
  block: Block
  onChange: (block: Block) => void
  linkableItems: WikilinkItem[]
  onOpenLink: (id: string, kind: WikilinkItem['kind']) => void
}) {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange={onChange} linkableItems={linkableItems} onOpenLink={onOpenLink} />
    case 'heading':
      return <HeadingBlockEditor block={block} onChange={onChange} />
    case 'list':
      return <ListBlockEditor block={block} onChange={onChange} />
    case 'callout':
      return <CalloutBlockEditor block={block} onChange={onChange} linkableItems={linkableItems} onOpenLink={onOpenLink} />
    case 'table':
      return <TableBlockEditor block={block} onChange={onChange} />
    case 'image':
      return <ImageBlockEditor block={block} onChange={onChange} />
    case 'gallery':
      return <GalleryBlockEditor block={block} onChange={onChange} />
    case 'palette':
      return <PaletteBlockEditor block={block} onChange={onChange} />
    case 'loop':
      return <LoopBlockEditor block={block} onChange={onChange} />
    case 'featureCards':
      return <FeatureCardsBlockEditor block={block} onChange={onChange} />
    case 'scopeMatrix':
      return <ScopeMatrixBlockEditor block={block} onChange={onChange} />
    case 'embedNote':
      return <EmbedNoteBlockEditor block={block} onChange={onChange} />
    case 'query':
      return <QueryBlockEditor block={block} onChange={onChange} />
    case 'diagram':
      return <DiagramBlockEditor block={block} onChange={onChange} />
    case 'annotatedMap':
      return <AnnotatedMapBlockEditor block={block} onChange={onChange} />
    case 'controlsDiagram':
      return <ControlsDiagramBlockEditor block={block} onChange={onChange} />
    case 'flowMap':
      return <FlowMapBlockEditor block={block} onChange={onChange} />
    case 'levelCatalog':
      return <LevelCatalogBlockEditor block={block} onChange={onChange} />
  }
}
