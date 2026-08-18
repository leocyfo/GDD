import type { Block } from '../data/types/entities'

function blockText(block: Block): string {
  switch (block.type) {
    case 'text':
      return block.markdown
    case 'heading':
      return block.text
    case 'list':
      return block.items.join(' ')
    case 'callout':
      return `${block.title} ${block.body}`
    case 'table':
      return [block.headers.join(' '), ...block.rows.map((row) => row.join(' '))].join(' ')
    case 'image':
      return block.caption
    case 'gallery':
      return ''
    case 'palette':
      return block.swatches.map((s) => s.name).join(' ')
    case 'loop':
      return ''
    case 'featureCards':
      return ''
    case 'scopeMatrix':
      return ''
    case 'embedNote':
      return ''
    case 'query':
      return block.expression
    case 'diagram':
      return block.mermaid
    case 'annotatedMap':
      return block.pins.map((p) => p.label).join(' ')
    case 'controlsDiagram':
      return block.entries.map((e) => `${e.keys} ${e.action} ${e.gameState}`).join(' ')
    case 'flowMap':
      return [
        ...block.nodes.map((n) => `${n.label} ${n.note ?? ''}`),
        ...block.edges.map((e) => e.label ?? ''),
      ].join(' ')
    case 'levelCatalog':
      // No text of its own — every field lives on the referenced `Level`
      // records, not the block, same as `loop`/`featureCards`/`scopeMatrix`.
      return ''
  }
}

export function sectionPlainText(blocks: Block[]): string {
  return blocks.map(blockText).join('\n')
}
