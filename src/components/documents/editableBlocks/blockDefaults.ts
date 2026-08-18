import {
  AudioLines,
  Component,
  FileCode2,
  GitBranch,
  Heading,
  Image as ImageIcon,
  Images,
  Keyboard,
  Link2,
  List,
  Map as MapIcon,
  Mountain,
  Search,
  Table as TableIcon,
  Text,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import type { Block, BlockType } from '../../../data/types/entities'
import { SCOPE_MATRIX_ID } from '../../../data/scopeMatrixId'

export interface BlockTypeMeta {
  type: BlockType
  label: string
  icon: LucideIcon
  create: () => Block
  /** Most blocks read best at the section's normal ~768px column width —
   * that's the default. A few are inherently spatial (a keyboard, a
   * flowchart with several columns) and just get cramped there, forcing
   * the reader to scroll sideways through their own component even when
   * the page has room to spare. Those opt out and render at the full
   * width of the section instead — see `BlockChrome`, which is what
   * actually applies the width per block. */
  wide?: boolean
}

export const BLOCK_TYPE_META: BlockTypeMeta[] = [
  { type: 'text', label: 'Text', icon: Text, create: () => ({ type: 'text', markdown: '' }) },
  { type: 'heading', label: 'Heading', icon: Heading, create: () => ({ type: 'heading', level: 2, text: '' }) },
  { type: 'list', label: 'List', icon: List, create: () => ({ type: 'list', ordered: false, items: [''] }) },
  {
    type: 'callout',
    label: 'Callout',
    icon: Component,
    create: () => ({ type: 'callout', variant: 'note', title: '', body: '' }),
  },
  {
    type: 'table',
    label: 'Table',
    icon: TableIcon,
    create: () => ({ type: 'table', headers: ['Column 1', 'Column 2'], rows: [['', '']] }),
  },
  { type: 'image', label: 'Image', icon: ImageIcon, create: () => ({ type: 'image', assetId: '', caption: '' }) },
  { type: 'gallery', label: 'Gallery', icon: Images, create: () => ({ type: 'gallery', assetIds: [] }) },
  {
    type: 'palette',
    label: 'Palette',
    icon: AudioLines,
    create: () => ({ type: 'palette', swatches: [{ hex: '#888888', name: 'New color' }] }),
  },
  { type: 'loop', label: 'Gameplay loop', icon: GitBranch, create: () => ({ type: 'loop', loopId: '' }) },
  {
    type: 'featureCards',
    label: 'Feature cards',
    icon: Component,
    create: () => ({ type: 'featureCards', featureIds: [] }),
  },
  {
    type: 'scopeMatrix',
    label: 'Scope matrix',
    icon: TableIcon,
    create: () => ({ type: 'scopeMatrix', matrixId: SCOPE_MATRIX_ID }),
    wide: true,
  },
  { type: 'embedNote', label: 'Embed vault note', icon: Link2, create: () => ({ type: 'embedNote', noteId: '' }) },
  { type: 'query', label: 'Live query', icon: Search, create: () => ({ type: 'query', expression: '' }) },
  { type: 'diagram', label: 'Diagram', icon: FileCode2, create: () => ({ type: 'diagram', mermaid: '' }) },
  {
    type: 'annotatedMap',
    label: 'Annotated map',
    icon: MapIcon,
    create: () => ({ type: 'annotatedMap', assetId: '', pins: [] }),
  },
  {
    type: 'controlsDiagram',
    label: 'Controls diagram',
    icon: Keyboard,
    create: () => ({ type: 'controlsDiagram', entries: [] }),
    wide: true,
  },
  {
    type: 'flowMap',
    label: 'Flow map',
    icon: Workflow,
    create: () => ({ type: 'flowMap', nodes: [], edges: [] }),
    wide: true,
  },
  {
    type: 'levelCatalog',
    label: 'Level catalog',
    icon: Mountain,
    create: () => ({ type: 'levelCatalog' }),
    wide: true,
  },
]

export function blockTypeMeta(type: BlockType): BlockTypeMeta {
  const meta = BLOCK_TYPE_META.find((m) => m.type === type)
  if (!meta) throw new Error(`Unknown block type "${type}"`)
  return meta
}
